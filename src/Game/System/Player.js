
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

  function Player(world){
    var player = null;
    
    function OnNewEntity(e){
      if (typeof(e.player) === typeof({}) && player === null){
        player = e;
      }
    }

    function OnPlayerMove(c, r){
      if (player !== null){
        world.emit("move-position", player, c, r);
        world.emit("camera-position", player.position.c, player.position.r);
      }
    }

    world.on("add-entity", OnNewEntity);
    world.on("player-move", OnPlayerMove);
  }
  Player.prototype.constructor = Player;

  return Player;
});
