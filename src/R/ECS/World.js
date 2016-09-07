(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Emitter',
      'src/R/ECS/Entity'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
        require('src/R/System/Emitter'),
        require('src/R/ECS/Entity')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.R.Browser) === 'undefined'){
      throw new Error("Missing R initilization.");
    }
    if (root.R.Browser.exists(root, [
      "R.System.Emitter",
      "R.ECS.Entity",
    ]) === false){
      throw new Error("Missing required object");
    }
    root.R.Browser.def (root, "R.ECS.World", factory(
      root.R.System.Emitter,
      root.R.ECS.Entity
    ));
  }
})(this, function (Emitter, Entity) {
  
  function World(){
    Emitter.call(this);

    var Systems = [];
    var DefaultPriority = 100;
    
    this.registerSystem = function(sys, priority){
      //if (typeof(sys.update) !== 'function'){
      //  throw new TypeError("Object missing required function.");
      //}

      if (typeof(priority) !== 'number'){
        priority = DefaultPriority;
      }

      var exists = false;
      for (var i=0; i < Systems.length; i++){
        if (Systems[i].sys === sys){
          Systems[i].priority = priority;
          exists = true;
          break;;
        }
      }

      if (exists === false){
        Systems.push({
          sys:sys,
          priority: priority
        });
      }

      Systems.sort(function(s1, s2){
        return (s1.priority - s2.priority);
      });
    };


    this.registerEntity = function(ent){
      this.emit("add-entity", ent);
    };

    this.update = function(dt){
      // TODO: Decide if I even neeed this!
    };
  }
  World.prototype.__proto__ = Emitter.prototype;
  World.prototype.constructor = World;

  return World;
});





