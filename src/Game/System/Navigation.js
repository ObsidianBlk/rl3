
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Emitter',
      'src/R/ECS/World',
      'src/R/ECS/Entity',
      'src/Game/System/GameMap'
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
        require('src/Game/System/GameMap')
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
      throw new Error("The System library is empty. System component required.");
    }
    
    if (typeof(root.System.Navigation) === 'undefined'){
      root.System.Navigation = factory(
        root.R.System.Emitter,
        root.R.ECS.World,
        root.R.ECS.Entity,
        root.System.GameMap
      );
    }
  }
})(this, function (Emitter, World, Entity, GameMap) {

  function Navigation(world, map){
    if (!(map instanceof GameMap)){
      throw new TypeError("Expected GameMap instance object.");
    }
    var Entities = {};
    
    function OnNewEntity(e){
      if (!(e.id in Entities) && typeof(e.position) === typeof({})){
        Entities[e.id] = Entities;
      }
    }

    function OnMove(e, dc, dr){
      if (e.id in Entities){
        var nc = e.position.c + dc;
        var nr = e.position.r + dr;

        var moveability = map.getMoveability(nc, nr);
        if (moveability !== null && moveability > 0){
          e.position.c = nc;
          e.position.r = nr;
        }
      }
    }

    function OnPosition(e, c, r){
      if (e.id in Entities){
        var moveability = map.getMoveability(c, r);
        if (moveability !== null && moveability > 0){
          e.position.c = c;
          e.position.r = r;
        }
      }
    }

    world.on("add-entity", OnNewEntity);
    world.on("move-position", OnMove);
    world.on("change-position", OnPosition);
  }
  Navigation.prototype.constructor = Navigation;

  return Navigation;
});
