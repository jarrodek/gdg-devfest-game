window.AudioContext = window.AudioContext || window.webkitAudioContext;

/**
 * Main function to controll sounds in the game
 * @param {Object} opts
 * - <b>sounds</b> - initial sounds list. The sounds will be loaded on initialization time.
 * @returns {GameSounds}
 */
function GameSounds(opts) {
    this.audioContext = null;
    this.bufferLoader = null;
    this.initialized = false;
    this.initialize(opts.sounds);
    
    this.sounds = {};
    this.sources = {};
}
GameSounds.prototype.initialize = function(soundsList) {
    this.audioContext = new AudioContext();
    this.bufferLoader = new BufferLoader(this.audioContext, soundsList);
    this.bufferLoader.load(function(state, param){
        switch(state){
            case 'error':
                console.error(param);
            break;
            case 'load':
                //one sound loaded
            break;
            case 'loadend':
                this.initialized = true;
                this.sounds = param;
            break;
        }
    }.bind(this));
};
/**
 * Play a sound.
 * If sound was not downloaded earlier it will download it before it can play.
 * @param {Object} opts List of options.
 * - url - URL of the file to play.
 * @returns {undefined}
 */
GameSounds.prototype.play = function(opts) {
    if(!this.initialized) return;
    
    if(!(opts.url in this.sounds)){
        //todo - load sound and play
        return;
    }
    
    if(opts.url in this.sources){
        this._playFromSource(this.sources[opts.url], opts);
        return;
    }
    
    var source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[opts.url];
    source.connect(this.audioContext.destination);
    this._playFromSource(source, opts);
    this.sources[opts.url] = source;
    
};
GameSounds.prototype._playFromSource = function(source, opts) {
    if(opts.loop){
        source.loop = true;
    }
    if(opts.onended){
        source.onended = opts.onended;
    } else {
        source.onended = undefined;
    }
    if(opts.volume){
        if(opts.volume > 1) opts.volume = 1;
        if(opts.volume < 0) opts.volume = 0;
        source.gain.value = opts.volume;
    } else {
        source.gain.value = 1;
    }
    
    source.start(0);
};


GameSounds.prototype.fadeOut = function(opts) {
    if(!this.initialized) return;
    
    if(!(opts.url in this.sources)){
        return;
    }
    var time = opts.time || 1500;
    var tickWait = 100;
    var source = this.sources[opts.url];
    
    var startGain = source.gain.value;
    var ticksCount = (time / tickWait);
    var step = startGain/ticksCount;
    
    
    function tick(){
        var hasNext = true;
        var x = source.gain.value - step;
        if(x<=0){
            hasNext = false;
            x = 0;
        }
        source.gain.value = x;
        if(hasNext){
            setTimeout(tick, tickWait);
        } else {
            if (!source.stop) {
                source.noteOff(0);
            } else {
                source.stop(0);
            }
        }
    }
    setTimeout(tick, tickWait);
};

GameSounds.prototype.stop = function(opts) {
    if(!this.initialized) return;
    
    if(!(opts.url in this.sources)){
        return;
    }
    
    var source = this.sources[opts.url];
    if (!source.stop) {
        source.noteOff(0);
    } else {
        source.stop(0);
    }
};



/**
 * See http://www.html5rocks.com/en/tutorials/webaudio/intro/
 * @param {AudioContext} context
 * @param {Array} urlList
 * @returns {BufferLoader}
 */
function BufferLoader(context, urlList) {
    this.context = context;
    this.urlList = urlList;
    this.clb = function() {};
    this.bufferList = {};
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    var loader = this;
    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(request.response, function(buffer) {
                if (!buffer) {
                    loader.clb('error', {
                        'source': url,
                        'index': index,
                        'message': 'Can\'t decode audio file.'
                    });
                    return;
                }
                loader.bufferList[url] = buffer;
                if (++loader.loadCount === loader.urlList.length) {
                    loader.clb('loadend', loader.bufferList);
                } else {
                    loader.clb('load', {
                        'source': url,
                        'index': index
                    });
                }
            },
            function(error) {
                console.error('decodeAudioData error', error);
                loader.clb('error', {
                    'source': url,
                    'index': index,
                    'message': 'Can\'t decode audio file.'
                });
            }
        );
    };

    request.onerror = function() {
        loader.clb('error', {
            'source': url,
            'index': index,
            'message': 'Can\'t load file from location.'
        });
    };

    request.send();
};

BufferLoader.prototype.load = function(callback) {
    if (typeof callback === 'function') {
        this.clb = callback;
    }
    for (var i = 0; i < this.urlList.length; ++i) {
        this.loadBuffer(this.urlList[i], i);
    }
};