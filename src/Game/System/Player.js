
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Emitter',
      'src/R/ECS/World',
      'src/R/ECS/Entity',
      'src/Game/System/GameMap',
      'src/Game/System/FOV/Shadowcaster'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
        require('src/R/System/Emitter'),
        require('src/R/ECS/World'),
        require('src/R/ECS/Entity'),
        require('src/Game/System/GameMap'),
        require('src/Game/System/FOV/Shadowcaster')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.R) === 'undefined'){
      throw new Error("The R library has not been loaded.");
    }
    if (typeof(root.System) === 'undefined'){
      root.System = {};
    }
    if (typeof(root.System.GameMap) === 'undefined'){
      root.System.GameMap = factory(
        root.R.System.Emitter,
        root.R.ECS.World,
        root.R.ECS.Entity,
        root.System.GameMap,
        root.System.FOV.Shadowcaster
      );
    }
  }
})(this, function (Emitter, World, Entity, GameMap, Shadowcaster) {

  function Player(world){
    var player = null;
    var fov = null;
    var map = null;

    Object.defineProperties(this, {
      "fov":{
        enumerable: true,
        get:function(){return fov;}
      },

      "map":{
        enumerable: true,
        get:function(){return map;},
        set:function(m){
          if (m !== null && !(m instanceof GameMap)){
            throw new TypeError("Expected GameMap object instance.");
          }
          if (m !== map){
            map = m;
            if (fov !== null){
              fov.map = m;
            } else if (m !== null){
              fov = new Shadowcaster();
              fov.map = m;
            }
          }
        }
      },

      "c":{
        enumerable: true,
        get:function(){return (player !== null) ? player.position.c : 0;}
      },

      "r":{
        enumerable: true,
        get:function(){return (player !== null) ? player.position.r : 0;}
      }
    });
    
    function OnNewEntity(e){
      if (e !== player && e.type === "actor" && typeof(e.player) === typeof({})){
        player = e;
        fov = new Shadowcaster();
        fov.trackVisits = true;
        fov.radius = 10;
        fov.col = player.position.c;
        fov.row = player.position.r;
        if (map !== null){
          fov.map = map;
          fov.generate();
        }
      }
    }

    function OnPlayerMove(c, r){
      if (player !== null && player.player.inControl === true){
        world.emit("move-position", player, c, r);
        fov.col = player.position.c;
        fov.row = player.position.r;
        fov.generate();
      }
    }

    

    function OnEnableReticle(c, r){
      player.player.inControl = false;
    }

    function OnDisableReticle(){
      player.player.inControl = true;
    }

    world.on("add-entity", OnNewEntity);
    world.on("player-move", OnPlayerMove);
    world.on("enable-reticle", OnEnableReticle);
    world.on("disable-reticle", OnDisableReticle);
  }
  Player.prototype.constructor = Player;

  return Player;
});
