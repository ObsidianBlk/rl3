
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Loader',
      'src/R/ECS/Assembler',
      'src/R/ECS/ComponentDB'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
        require('src/R/System/Loader'),
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
        root.R.System.Loader,
	root.R.ECS.Assembler,
	root.R.ECS.ComponentDB
      );
    }
  }
})(this, function (Loader, Assembler, ComponentDB) {

  return function(){
    var assembler = new Assembler();
    var cdb = assembler.db;

    // NOTE: This section assumes code is running on NWJS. This will break like crazy in a browser. How crazy? Don't know. :-/

    var loader = new Loader();
    console.log(loader.type);
    loader.load('data/defs/components.json', function(cerr, cdata){
      if (cerr) throw cerr;
      cdb.deserialize(cdata.toString());

      loader.load('data/defs/assemblages.json', function(aerr, adata){
        if (aerr) throw aerr;
        assembler.deserialize(adata.toString());
      });
    });
    
    /*var fs = require('fs');
    fs.readFile('data/defs/components.json', function(cerr, cdata){
      if (cerr) throw cerr;
      cdb.deserialize(cdata.toString());

      fs.readFile('data/defs/assemblages.json', function(aerr, adata){
        if (aerr) throw aerr;
        assembler.deserialize(adata.toString());
      });
    });*/
    
    // ------------------------------------------------------------


    /* ---------------------------------------------------------------------------------------------------------------------------------------------
       COMPONENT DEFINITIONS!
       --------------------------------------------------------------------------------------------------------------------------------------------- */

    // Location in map space the entity currently resides.
    //cdb.defineComponent("position", {c:0, r:0});
    
    // How the entity is rendered on screen.
    /*
    cdb.defineComponent("visual", {
      primeglyph:1,
      betaglyph:2,
      tint: null,
      background: null
    });
    */

    // I totally forget what this was for...
    // TODO: Delete this?
    //cdb.defineComponent("actor", {});

    //cdb.defineComponent("player", {});

    // Determins how the entity allows or blocks movement and sight.
    /*
    cdb.defineComponent("physical", {
      moveability: 0.0, // The ability to move THROUGH the entity.
      visibility: 0.0 // The ability to see THROUGH the entity.
    });
    */

    
    //cdb.defineComponent("stateswitch", {nextState:""}); // nextState is the name of the assemblage which replaces the owning entity.



    /* ---------------------------------------------------------------------------------------------------------------------------------------------
       ASSEMBLAGE DEFINITIONS!
       --------------------------------------------------------------------------------------------------------------------------------------------- */

    /*assembler.defineAssemblage("actor", "human", [
      {name: "visual", idata:{primeglyph: 2, tint: "#fff"}},
      {name: "position"},
      {name: "physical", idata:{moveability: 0.0, visibility: 0.0}},
    ]);

    assembler.defineAssemblage("door", "door_opened", [
      {name: "visual", idata:{primeglyph: 8, tint: "#a58740"}},
      {name: "position"},
      {name: "physical", idata:{moveability: 1.0, visibility: 1.0}},
      {name: "stateswitch", idata:{nextState:"door_closed"}}
    ]);

    assembler.defineAssemblage("door", "door_closed", [
      {name: "visual", idata:{primeglyph: 10, tint: "#a58740"}},
      {name: "position"},
      {name: "physical"},
      {name: "stateswitch", idata:{nextState:"door_opened"}}
    ]);*/
    
    return assembler;
  };
});
