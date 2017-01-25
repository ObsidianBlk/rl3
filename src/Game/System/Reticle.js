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

  function Reticle(world){

    var reticle = null;
    var map = null;
    var cursor = null;

    Object.defineProperties(this, {
      "enabled":{
        enumerable: true,
        get:function(){
          return (reticle !== null) ? reticle.visual.visible : false;
        }
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
          }
        }
      },

      "cursor":{
        enumerable: true,
        get:function(){return cursor;},
        set:function(c){
          // TODO: Test for the correct object!!!
          if (cursor !== c){
            cursor = c;
          }
        }
      }
    });
    
    function OnNewEntity(e){
      if (e !== reticle && e.type === "actor" && typeof(e.reticle) === typeof({})){
        reticle = e;
        reticle.visual.visible = false;
      }
    }

    function OnReticleMove(c, r){
      if (reticle.visual.visible === true){
        var oc = reticle.position.c;
        var or = reticle.position.r;
        world.emit("move-position", reticle, c, r);
        if (map !== null && (reticle.position.c !== oc || reticle.position.r !== or)){
          var tile = map.tilemap.getTile(reticle.position.c, reticle.position.r);
          if (tile !== null && tile.description.trim() !== ""){
            cursor.clear();
            cursor.c = 1;
            cursor.r = 5;
            cursor.textOut(tile.description);
          }
        }
      }
    }

    function OnEnableReticle(c, r){
      reticle.visual.visible = true;
      reticle.position.c = c;
      reticle.position.r = r;
    }

    function OnDisableReticle(){
      reticle.visual.visible = false;
    }

    world.on("player-move", OnReticleMove);
    world.on("enable-reticle", OnEnableReticle);
    world.on("disable-reticle", OnDisableReticle);
    world.on("add-entity", OnNewEntity);
  };
  Reticle.prototype.constructor = Reticle;


  return Reticle;
});
