
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(['src/R/System/Emitter'], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/R/System/Emitter')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.R.Browser) === 'undefined'){
      throw new Error("Missing R initilization.");
    }

    if (root.R.Browser.exists(root, "R.System.Emitter") === false){
      throw new Error("Missing required object");
    }
    root.R.Browser.def (root, "R.System.Heartbeat", factory());
  }
})(this, function (Emitter) {

  function Heartbeat(win){
    if (typeof(win) !== typeof({})){
      throw new TypeError("Expecting an object.");
    }
    if (typeof(win.requestAnimationFrame) !== 'function'){
      throw new TypeError("Object not valid.");
    }

    var lastTimestamp = null;
    var elapsedTimeList = [];
    var elapsedTimeOverPeriod = 0;
    var BPSMonitorLength = 10; // Number of frames to track.
    var BPS = 0;

    var heartbeatCallback = null;
    var stopCallback = null;
    var Running = false;

    function UpdateBPS(timestamp){
      var elapsed = (lastTimestamp === null) ? 0 : timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (BPSMonitorLength > 0){
	if (elapsedTimeList.length >= BPSMonitorLength){
	  elapsedTimeList.shift();
	  elapsedTimeList.push(elapsed);
	} else {
	  elapsedTimeList.push(elapsed);
	}

	elapsedTimeOverPeriod = elapsedTimeList.reduce(function(a, b){return a+b;}, 0);
	BPS = Math.floor(BPSMonitorLength/(elapsedTimeOverPeriod*0.001));
      }
    }

    function HeartbeatFunc(timestamp){
      UpdateBPS(timestamp);
      if (heartbeatCallback !== null){
	heartbeatCallback.call(heartbeatCallback, timestamp);
      }
      if (Running){
	// Keep revving the pig...
	win.requestAnimationFrame(HeartbeatFunc);
      } else if (stopCallback !== null){
	stopCallback.call(stopCallback);
      }
    }

    this.setCallbacks = function(callbacks){
      if (typeof(callbacks.heartbeat) !== 'undefined'){
	if (typeof(callbacks.heartbeat) === 'function' || callbacks.heartbeat === null){
	  heartbeatCallback = callbacks.heartbeat;
	}
      }
      if (typeof(callbacks.stop) !== 'undefined'){
	if (typeof(callbacks.stop) === 'function' || callbacks.stop === null){
	  stopCallback = callbacks.stop;
	}
      }
    };

    this.start = function(){
      if (Running === false){
	Running = true;
	// Kick the pig into gear!
	win.requestAnimationFrame(HeartbeatFunc);
      }
    };

    this.stop = function(){
      Running = false;
    };

    Object.defineProperties(this, {
      "running":{
	get:function(){return Running;}
      },

      "beatsPerSecond":{
	get:function(){return BPS;}
      },

      "lastTimestamp":{
	get:function(){return lastTimestamp;}
      },

      "BPSMonitorLength":{
	get:function(){return BPSMonitorLength;},
	set:function(len){
	  if (typeof(len) === 'number' && len >= 0){
	    BPSMonitorLength = Math.floor(len);
	    if (BPSMonitorLength < elapsedTimeList.length){
	      elapsedTimeList.splice(0, elapsedTimeList.length - BPSMonitorLength);
	      if (BPSMonitorLength > 0){
		// Recalculating values.
		elapsedTimeOverPeriod = elapsedTimeList.reduce(function(a, b){return a+b;}, 0);
		BPS = Math.floor(BPSMonitorLength/(elapsedTimeOverPeriod*0.001));
	      } else {
		elapsedTimeOverPeriod = 0;
		BPS = 0;
	      }
	    }
	  }
	}
      }
    });
  }
  Heartbeat.prototype.__proto__ = Emitter.prototype;
  Heartbeat.prototype.constructor = Heartbeat;

  return Heartbeat;
});
