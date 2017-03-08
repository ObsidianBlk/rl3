
requirejs.config({
  baseUrl:"./",
  paths:{
    text:'./node_modules/text/text',
    tv4:'./node_modules/tv4/tv4'
  }
});
requirejs([
  'src/R/System/Heartbeat',
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
  'src/Game/States/GEPEditorState',
  'src/R/System/ODB',
  'text!data/defs/components.json',
  'text!data/defs/assemblages.json'
], function(Heartbeat,
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
            GEPEditorState,
            ODB,
            componentDef,
            assemblageDef){

  
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

    var db = new ODB();
    var col = db.collection("bobo");
    col.add([
      {name:"ObsidianBlk", age:20, description:"He's the man"},
      {name:"JimboSteve", age:35, description:"The one down under"},
      {name:"Pheonix", age:11, description:"One HOT lady"},
      {name:"Viktor", age:44, description:"Do not mess with"},
      {name:"SpigettiMonster", age:200, description:"An old smuck!"}
    ]);
    var res = col.find({name:"ObsidianBlk"});
    res = col.findAll();
    if (res.length !== 5){
      console.error("FindAll() : Wrong result count!");
    }
    res = col.find({age:{"&ne;":35}});
    if (res.length !== 4){
      console.error("Find() : Wrong result count!");
    }
    col.remove({name:"JimboSteve"});
    res = col.findAll();
    if (res.length !== 4){
      console.error("Remove() : Wrong result count!");
    }
    var count = col.update({age:{"&lt;":33}}, {description:"This description has been changed... ha!"});
    if (count !== 2){
      console.error("Update() : Count !== 2");
    }
    count = col.update({name:"ObsidianBlk"}, {score:10}, true);
    if (count !== 1){
      console.error("Update() : Count !== 1");
    }
    count = col.update({name:"Pheonix"}, {score:10});
    if (count !== 0){
      console.error("Update() : Count !== 0");
    }
    res = col.findAll();
    
    var assembler = new Assembler();
    var cdb = assembler.db;

    cdb.deserialize(componentDef);
    assembler.deserialize(assemblageDef);
    
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
      new GameState(term, kinput, fsm, assembler);
      new GEPEditorState(term, kinput, fsm);


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
