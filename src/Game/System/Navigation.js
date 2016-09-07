
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

  function Navigation(world){
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

        // TODO: Validate position on map.

        e.position.c = nc;
        e.position.r = nr;
      }
    }

    function OnPosition(e, c, r){
      if (e.id in Entities){
        // TODO: Validate (c, r) position on map
        e.position.c = c;
        e.position.r = r;
      }
    }

    world.on("add-entity", OnNewEntity);
    world.on("move-position", OnMove);
    world.on("change-position", OnPosition);
  }
  Navigation.prototype.constructor = Navigation;

  return Navigation;
});
