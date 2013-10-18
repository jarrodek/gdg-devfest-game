
function AppTimer(duration /* in ms */, props) {
    this.ontick = props && typeof props.ontick === "function" ? props.ontick : function() {
    };
    this.onend = props && typeof props.onend === "function" ? props.onend : function() {
    };
    this.elapsed = 0;

    var running = false, start, end, self = this;
    this.start = function() {
        if (running)
            return self;

        start = window.performance.now();
        end = start + duration;
        running = true;
        tick();
        return self;
    };
    
    this.stop = function(){
        running = false;
    };

    function tick() {
        if(!running) return;
        var now = window.performance.now();
        self.ontick(self.elapsed, duration);
        self.elapsed = now - start;
        if (now < end)
            requestAnimationFrame(tick);
        else
            self.onend.call(self);
    }
}

/**
 * The Pie timer.
 * @param {Number} duration The number of miliseconds to countdown
 * @param {Object} opts Available options:
 *  end (Function) - called on the end of timer
 *  target (String|CanvasElement) Canvas element or its ID.
 * @returns {PieTimer}
 */
function PieTimer(duration, opts) {
    this.debugSymbol = null;
    this.canvas = null;
    if (typeof opts.target === 'string') {
        this.canvas = document.querySelector('#' + opts.target);
    } else if (opts.target instanceof HTMLCanvasElement) {
        this.canvas = opts.target;
    } else {
        throw "Target is a not valid parameter. Only HTMLCanvasElement or ID string is a vliad argument.";
    }
    if (!this.canvas) {
        throw "Target is a not valid parameter. Canvas can't be found.";
    }
    this.ctx = this.canvas.getContext('2d');
    this.drawStart = -Math.PI / 2;

    var timerOpts = {
        'ontick': this._tick.bind(this),
        'onend': function() {
            this._tick.bind(this);
            if (typeof opts.end === "function") {
                setTimeout(opts.end, 0);
            }
            this.canvas = null;
            this.timer = null;
            this.ctx = null;
        }.bind(this)
    };
    this.timer = new AppTimer(duration, timerOpts);
    if(this.debugSymbol){
        this.timer.debugSymbol = this.debugSymbol;
    }

    //set circle size
    var cWidth = this.canvas.clientWidth;
    var cHeight = this.canvas.clientHeight;
    this.size = Math.min(cWidth, cHeight);

    this.showCountdown = true;
    this.font = "normal 56px Arial";

    this.elapsedColorStartR = 128;
    this.elapsedColorStartG = 197;
    this.elapsedColorStartB = 46;
    this.elapsedColorEndR = 255;
    this.elapsedColorEndG = 102;
    this.elapsedColorEndB = 102;

    this.durationColor = '#ffffff';
    this.textColor = '#ffffff';
}
PieTimer.prototype.recalculateSize = function() {
    //set circle size
    var cWidth = this.canvas.clientWidth;
    var cHeight = this.canvas.clientHeight;
    this.size = Math.min(cWidth, cHeight);
};

PieTimer.prototype.setOnend = function(callback) {
    this.timer.onend = callback;
};

PieTimer.prototype.start = function() {
    this.timer.start();
};
PieTimer.prototype.stop = function() {
    this.timer.stop();
};
/**
 * Draw canvas timer pie.
 * @param {Number} elapsed Time elapsed
 * @param {Number} duration Timer duration
 * @returns {undefined}
 */
PieTimer.prototype._tick = function(elapsed, duration) {
    var ctx = this.ctx, sta = this.drawStart, size = this.size, halfSize = size / 2;
    var pct = elapsed / duration,
            sec = Math.ceil((duration - elapsed) / 1000);
    if (pct >= 0.995) {
        pct = 1;
        sec = 0;
    }
    if(this.debugSymbol){
        console.log(this.debugSymbol, this.canvas);
    }
    var fillStr = "rgb("
            + Math.round((this.elapsedColorStartR + pct * (this.elapsedColorEndR - this.elapsedColorStartR)))
            + ","
            + Math.round((this.elapsedColorStartG + pct * (this.elapsedColorEndG - this.elapsedColorStartG)))
            + ","
            + Math.round((this.elapsedColorStartB + pct * (this.elapsedColorEndB - this.elapsedColorStartB)))
            + ")";


    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = this.durationColor;
    ctx.arc(halfSize, halfSize, halfSize, 0, 2 * Math.PI);
    ctx.fill();


    ctx.fillStyle = fillStr;
    if (this.showCountdown) {
        ctx.beginPath();
        ctx.moveTo(halfSize, halfSize);
        ctx.arc(halfSize, halfSize, 35, 0 * Math.PI, 2 * Math.PI);
        ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(halfSize, halfSize);
    ctx.arc(halfSize, halfSize, halfSize, sta, sta + 2 * Math.PI * pct);
    ctx.fill();

    if (this.showCountdown) {
        ctx.font = this.font;
        var wid = ctx.measureText(sec).width;
        ctx.fillStyle = "#D8D8D8";
        ctx.fillText(sec, halfSize - wid / 2 + 1, halfSize + wid / 2 + 1);
        ctx.fillStyle = this.textColor;
        ctx.fillText(sec, halfSize - wid / 2, halfSize + wid / 2);
    }
};
