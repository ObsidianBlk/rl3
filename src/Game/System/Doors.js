(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Emitter',
      'src/R/ECS/World',
      'src/R/ECS/Entity',
      'src/R/ECS/Assembler'
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
        require('src/R/ECS/Assembler')
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
        root.R.ECS.Assembler
      );
    }
  }
})(this, function (Emitter, World, Entity, Assembler) {

  function Doors(world, assembler){
    Emitter.call(this);

    var doorDict = {};

    function OnNewEntity(e){
      var tobj = typeof({});
      if (assembler.db.entityHasComponents(e, [
        {name:"visual", type:tobj},
        {name:"physical", type:tobj},
        {name:"stateswitch", type:tobj}
      ]) && e.type === "door"){
        if (!(e.id in doorDict)){
          doorDict[e.id] = e;
        }
      }
    }

    function OnRemoveEntity(e){
      if (e in doorDict){
        delete doorDict[e];
      }
    }

    function OnInteract(actor, actee){
      var tobj = typeof({});
      if (assembler.db.entityHasComponents(actee, [
        {name:"visual", type:tobj},
        {name:"physical", type:tobj},
        {name:"stateswitch", type:tobj}
      ])){
	assembler.mimicEntity("door", actee.stateswitch.next, actee);
        /*var nent = assembler.createEntity("door", actee.stateswitch.nextState);
        world.removeEntity(actee);
        nent.position.c = actee.position.c;
        nent.position.r = actee.position.r;
        world.addEntity(nent);*/
      }
    }

    world.on("add-entity", OnNewEntity);
    world.on("remove-entity", OnRemoveEntity);
    world.on("interact", OnInteract);
  }
  Doors.prototype.__proto__ = Emitter.prototype;
  Doors.prototype.constructor = Doors;


  return Doors;
});
