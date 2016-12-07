
requirejs.config({
  baseUrl:"./",
  paths:{
    tv4:'./node_modules/tv4/tv4'
  }
});
requirejs([
  'src/R/System/Heartbeat',
  'src/R/System/Loader',
  'src/R/Input/Keyboard',
  'src/R/Graphics/Color',
  'src/R/Graphics/Glyph',
  'src/R/Graphics/Terminal',
  'src/R/Graphics/Cursor',
  'src/R/Map/Tileset',
  'src/R/Map/Tilemap',
  'src/R/ECS/Entity',
  'src/R/ECS/ComponentDB',
  'src/R/ECS/Assembler',
  'src/Game/FSM',
  'src/Game/System/GameMap',
  'src/Game/States/GameState',
  'src/Game/States/MainMenuState',
  'src/Game/States/GEPEditorState'
], function(Heartbeat,
            Loader,
            Keyboard,
            Color,
            Glyph,
            Terminal,
            Cursor,
            Tileset,
            Tilemap,
            Entity,
            ComponentDB,
            Assembler,
            FSM,
            GameMap,
            GameState,
            MainMenuState,
            GEPEditorState){

  
  // --------------------------------
  // Defining a "Document Ready" function. This is only garanteed to work on Chrome at the moment.
  function ready(callback){
    if (document.readyState === "complete"){
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', function (){
	callback();
      });
    }
  }


  // --------------------------------
  // App starts here :)
  ready(function(){
    var assembler = new Assembler();
    var cdb = assembler.db;
    
    // --------------------------------------------------------------------
    var kinput = new Keyboard(window);
    kinput.rollOffCombos = true;
    kinput.notifyKeysOnce = true;

    // --------------------------------------------------------------------



    var glyph = new Glyph();
    glyph.on("ready", function(){
      var term = new Terminal(document.getElementById("terminal"), {
        glyph:glyph,
        minRows: 60,
        window: window,
	terminalToWindow: true
      });
      

      // --------------------------------------------------------------------

      var fsm = new FSM();
      new MainMenuState(term, kinput, fsm, true);

      var loader = new Loader();
      console.log(loader.type);
      loader.load('data/defs/components.json', function(cerr, cdata){
        if (cerr) throw cerr;
        cdb.deserialize(cdata.toString());

        loader.load('data/defs/assemblages.json', function(aerr, adata){
          if (aerr) throw aerr;
          assembler.deserialize(adata.toString());

          new GameState(term, kinput, fsm, assembler);
          new GEPEditorState(term, kinput, fsm);
        });
      });


      var lastDigitSize = 0;
      var heartbeat = new Heartbeat(window);
      heartbeat.setCallbacks({
	heartbeat:function(timestamp){
	  if (fsm.registeredStateCount <= 0){
	    heartbeat.stop();
	  } else {
	    fsm.update(timestamp, heartbeat.beatsPerSecond);
	    term.flip();
	  }
	},

	stop:function(){
	  if (typeof(require) === 'function'){
	    // Assume we exist in a NodeJS-Webkit world...
	    require('nw.gui').App.quit();
	  }
	}
      });
      heartbeat.start();
    });

    glyph.on("error", function(){
      alert("You're an idiot!");
    });

    glyph.load("data/glyphs/10x10/RogueObsidian_10x10.png", {
      cell_width: 10,
      cell_height: 10
    });
  });
});
