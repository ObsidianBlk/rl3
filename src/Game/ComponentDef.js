
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/ECS/Assembler',
      'src/R/ECS/ComponentDB'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/R/ECS/Assembler'),
        require('src/R/ECS/ComponentDB')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.FSM) === 'undefined'){
      throw new Error("Missing required class 'FSM'.");
    }
    if (typeof(root.R) === 'undefined'){
      throw new Error("The R library has not been loaded.");
    }
    if (typeof(root.ComponentDef) === 'undefined'){
      root.States.Game = factory(
	root.R.ECS.Assembler,
	root.R.ECS.ComponentDB
      );
    }
  }
})(this, function (Assembler, ComponentDB) {

  return function(){
    var assembler = new Assembler();
    var cdb = assembler.db;

    cdb.defineComponent("position", {c:0, r:0});
    cdb.defineComponent("visual", {
      primeglyph:1,
      betaglyph:2,
      tint: null,
      background: null
    });
    cdb.defineComponent("actor", {});

    cdb.defineComponent("physical", {
      movability: 0.0, // The ability to move THROUGH the entity.
      visibility: 0.0 // The ability to see THROUGH the entity.
    });

    cdb.defineComponent("door", {});
    
    return assembler;
  };
});
