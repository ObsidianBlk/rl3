
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Emitter',
      'src/R/ECS/World',
      'src/R/ECS/Entity'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
        require('src/R/System/Emitter'),
        require('src/R/ECS/World'),
        require('src/R/ECS/Entity')
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
        root.R.ECS.Entity
      );
    }
  }
})(this, function (Emitter, World, Entity) {

  function Player(world, map){
    var player = null;
    var reticle = null;
    
    function OnNewEntity(e){
      if (e !== player && e.type === "actor" && typeof(e.player) === typeof({})){
        player = e;
      } else if (e !== reticle && e.type === "actor" && typeof(e.reticle) === typeof({})){
        reticle = e;
        reticle.visual.visible = false;
      }
    }

    function OnPlayerMove(c, r){
      if (reticle !== null && reticle.visual.visible){
        world.emit("move-position", reticle, c, r);
      } else if (player !== null){
        world.emit("move-position", player, c, r);
        world.emit("camera-position", player.position.c, player.position.r);
      }
    }

    function OnToggleReticle(){
      if (reticle !== null){
        reticle.position.c = player.position.c;
        reticle.position.r = player.position.r;
        reticle.visual.visible = !reticle.visual.visible;
      }
    }

    world.on("add-entity", OnNewEntity);
    world.on("player-move", OnPlayerMove);
    world.on("toggle-reticle", OnToggleReticle);
  }
  Player.prototype.constructor = Player;

  return Player;
});
