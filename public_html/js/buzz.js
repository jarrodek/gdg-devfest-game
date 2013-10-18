var VENDOR_ID = 0x054C;
var PRODUCT_IDS = [0x0002, 0x1000];


function AppBase() {
    this.listeners = [];
}
AppBase.prototype = {
    constructor: AppBase,
    notifyListeners: function(change, param) {
        var this_ = this;
        this.listeners.forEach(function(listener) {
            listener(this_, change, param);
        });
    },
    addListener: function(listener) {
        if (!this.listeners)
            this.listeners = [];
        this.listeners.push(listener);
    }
};

/**
 * Wrapper for USB api to control Sony Buzz! controllers.
 * 
 * @author Paweł Psztyć (GDG Warsaw), Wojtek Kaliciński (GDG Warsaw)
 * @returns {ChromeBuzz}
 */
function ChromeBuzz() {
    this.listeners_ = {};

    var isInitialized = false;
    /**
     * Array of found devices ConnectionHandle.
     * 
     * Each element is an object with folowing keys:
     * - canwrite (Boolean) true if the app successfully claimed for "out" interface
     * - canread (Boolean) true if the app successfully claimed for "in" interface
     * - connectionhandle (ConnectionHandle): the connection handle object returned by findDevices function.
     * 
     * Device ConnectionHandle
     * - handle ( integer ) - The id of the USB connection handle.
     * - vendorId ( integer )
     * - productId ( integer )
     * 
     * @type Array
     */
    this.devices = [];
    /**
     * True if the user has already granded additional permission to teh app.
     * @type Boolean
     */
    this.hasUserPermission = false;

    /**
     * Transfer object to leasen for data from USB controllers.
     * @type Object
     */
    Object.defineProperty(this, "transfer", {
        get: function() {
            return {
                direction: 'in',
                endpoint: 1,
                length: 8
            };
        }
    });
    /**
     * True if app is initialized.
     * @type Boolean
     */
    Object.defineProperty(this, "initialized", {
        get: function() {
            return isInitialized;
        }
    });



    this._initialize(function() {
        isInitialized = true;
        this.notifyListeners('initialized', this.hasUserPermission);
    }.bind(this));

}
ChromeBuzz.prototype = Object.create(AppBase.prototype);
/**
 * Internal initialization object.
 * @param {Function} callback
 * @returns {undefined}
 */
ChromeBuzz.prototype._initialize = function(callback) {
    if (this.initialized) {
        window.setTimeout(callback, 0);
        return;
    }
    this.hasPermission(function(status){
        this.hasUserPermission = status;
        window.setTimeout(callback, 0);
    }.bind(this));
};

/**
 * 2nd important function int this wrapper (1st one is constructor).
 * Call this function only if user has granted permission for USB devices!
 * 
 * You should listnen for an event "hasPermission" right after app initialization
 * and depending on state ask the user for permission or initialize the app.
 * 
 * @param {Function} callback
 * @returns {undefined}
 */
ChromeBuzz.prototype.setupDevices = function(callback) {
    callback = callback || function(){};
    if (!this.initialized) {
        callback = null;
        throw "The app is still initializing.";
    }
    if(!this.hasUserPermission){
        callback = null;
        throw "You must grant permissions for Buzz!-ers first";
    }
    
    this.findDevices(function(numberOfDevices){
        this.notifyListeners('hasDevices', numberOfDevices);
        if(numberOfDevices === 0){
            setTimeout(callback,0);
            return;
        } else {
            this.claimInterfaces(function(){
                this.readAll();
                setTimeout(callback,0);
            }.bind(this));
        }
    }.bind(this));
};

/**
 * Get Chrome permission object to request additional permissions from the user.
 * @returns {ChromeBuzz.prototype.getPermissionObject.Anonym$8}
 */
ChromeBuzz.prototype.getPermissionObject = function() {
    var devicePermission = [];

    for (var i = 0, len = PRODUCT_IDS.length; i < len; i++) {
        var productId = PRODUCT_IDS[i];
        devicePermission[devicePermission.length] = {
            "vendorId": VENDOR_ID,
            "productId": productId
        };
    }
    return {permissions: [{'usbDevices': devicePermission}]};
};

/**
 * Request permission from the user to use controller connected to a USB port.
 * 
 * Warning: this function has to be called as a result of user inpit (eg. click)!
 * 
 * @param {Function} callback Fallback function with request result. The only parametr of the callback is Boolean value (true if user has granted permissions).
 * @returns {undefined}
 */
ChromeBuzz.prototype.requestPermission = function(callback) {
    callback = callback || function(){};
    var permissions = this.getPermissionObject();
    chrome.permissions.request(permissions, function(result) {
        this.hasUserPermission = !!result;
        this.notifyListeners('hasPermission', this.hasUserPermission);
        if (this.hasUserPermission) {
            callback(true);
        } else {
            console.log('App was not granted the "usbDevices" permission.');
            console.log(chrome.runtime.lastError);
            callback(false);
        }
    }.bind(this));
};

ChromeBuzz.prototype.hasPermission = function(callback) {
    var permissions = this.getPermissionObject();
    chrome.permissions.contains(permissions, function(result) {
        callback(result);
    });
};


/**
 * Connect to the device.
 * @param {Function} callback
 * @returns {undefined}
 */
ChromeBuzz.prototype.findDevices = function(callback) {
    var context = this;
    var productRequestsCount = 0;

    function hasMore() {
        return productRequestsCount < PRODUCT_IDS.length;
    }
    var makeRequest = function() {
        var prodId = PRODUCT_IDS[productRequestsCount];
        chrome.usb.findDevices({"vendorId": VENDOR_ID, "productId": prodId}, onDeviceFound);
    };

    var onDeviceFound = function(devices) {
        productRequestsCount++;
        if (devices && devices.length > 0) {
            for (var i = 0, len = devices.length; i < len; i++) {
                context.devices.push(context._createDeviceObject(devices[i]));
            }
            if (!hasMore()) {
                callback(context.devices.length);
                return;
            }
            makeRequest();
        } else {
            if (!hasMore()) {
                callback(context.devices.length);
                return;
            }
            makeRequest();
        }
    };
    makeRequest();
};

ChromeBuzz.prototype._createDeviceObject = function(device) {
    var deviceObject = {
        'canwrite': false,
        'canread': false,
        'connectionhandle': device,
        'interfaceNumber': null,
        'writesize': null,
        'readsize': null
    };
    return deviceObject;
};

/**
 * Before it will be able to read data from controllers it must claim an interface.
 * However it is a HID device so system claim the interface first.
 * If so, you must to do two things:
 * 1) Find device id using dmesg
 * $ dmesg
 * There should be some line with something like:
 * input: Logitech Logitech Buzz(tm) Controller V1 as /devices/pci0000:00/0000:00:1d.0/usb2/2-1/2-1.1/2-1.1:1.0/input/input17
 * 
 * Where "2-1.1:1.0" is device ID.
 * Next login as root:
 * $ sudo su
 * And unbind controller from the system:
 * # echo "2-1.1:1.0" > /sys/bus/usb/drivers/usbhid/unbind
 * 
 * Under ChromeOS device it just need to call
 * 
 * After calling this function the device object in this.devices array will be updated with the information about possibility to read and write to the device.
 * 
 * @param {Function} callback
 * @returns {undefined}
 */
ChromeBuzz.prototype.claimInterfaces = function(callback) {

    var context = this;
    var devicesRequestsCount = 0;

    function hasMore() {
        return devicesRequestsCount < context.devices.length;
    }

    function claimNext() {
        if (!hasMore()) {
            setTimeout(callback, 0);
        }
        var device = context.devices[devicesRequestsCount];
        chrome.usb.listInterfaces(device.connectionhandle, function(interfaces) {

            interfaces.forEach(function(interface) {
                //Properties of each item
                // - interfaceNumber ( integer )
                // - alternateSetting ( integer )
                // - interfaceClass ( integer )
                // - interfaceSubclass ( integer )
                // - interfaceProtocol ( integer )
                // - description ( optional string )
                // - endpoints ( array of object )

                // Properties of endpoints item
                // - address ( integer )
                // - type ( enum of "control", "interrupt", "isochronous", or "bulk" )
                // - direction ( Direction )
                // - maximumPacketSize ( integer )
                // - synchronization ( optional enum of "asynchronous", "adaptive", or "synchronous" ) - Used for isochronous mode.
                // - usage ( optional enum of "data", "feedback", or "explicitFeedback" )
                // - pollingInterval ( optional integer ) - If this is an interrupt endpoint, this will be 1-255.
                device.interfaceNumber = interface.interfaceNumber;
                interface.endpoints.forEach(function(endpoint) {
                    if (endpoint.direction === 'in') {
                        device.canread = true;
                        device.readsize = endpoint.maximumPacketSize;
                        //device.pollinginterval = endpoint.pollingInterval
                    } else if (endpoint.direction === 'out') {
                        device.canwrite = true;
                        device.writesize = endpoint.maximumPacketSize;
                    }
                });

                chrome.usb.claimInterface(device.connectionhandle, device.interfaceNumber, function(e) {
                    console.log("claimInterface", device);
                    context.notifyListeners('interfaceready', device);
                });
            });

            devicesRequestsCount++;
            if (!hasMore()) {
                setTimeout(callback, 0);
            } else {
                claimNext();
            }
        });
    }
    claimNext();
};
/**
 * Start reading data from all devices.
 * @returns {undefined}
 */
ChromeBuzz.prototype.readAll = function() {
    this.devices.forEach(function(device){
        this._readDevice(device);
    }.bind(this));
};


/**
 * Read data from the device.
 * It will wait until message from the device will arrive.
 * Listen for event handlers to handle read data.
 * @param {type} device
 * @returns {undefined}
 */
ChromeBuzz.prototype._readDevice = function(device) {
    chrome.usb.interruptTransfer(device.connectionhandle, this.transfer, function(usbEvent) {

        if (usbEvent.resultCode) {
            console.log("Error: ", usbEvent);
            this.notifyListeners('devicedisconnected', device);
            return;
        }
        
        var data = new Uint8Array(usbEvent.data);
        var currByte = 2;
        var currShift = 0;
        var controllersState = [];
        var controllersButtons = ["red", "yellow", "green", "orange", "blue"];
        for (var i = 0; i < 4; i++) {
            var singleControllerState = {};
            for (var n in controllersButtons) {
                singleControllerState[controllersButtons[n]] = ((data[currByte] & (1 << currShift)) !== 0);
                currShift++;
                if (currShift === 8) {
                    currShift = 0;
                    currByte++;
                }
            }
            controllersState.push(singleControllerState);
        }
        this.notifyListeners('devicedata', {'device': device, 'controllersState': controllersState});
        this._readDevice(device);
    }.bind(this));
};
