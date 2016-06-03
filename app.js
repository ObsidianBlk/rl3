
requirejs.config({
  baseUrl:"./"
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
  'src/Game/States/GameState',
  'src/Game/States/MainMenuState',
  'src/Game/States/GEPEditorState'
], function(Heartbeat, Keyboard, Color, Glyph, Terminal, Cursor, Tileset, Tilemap, Entity, ComponentDB, Assembler, FSM, GameState, MainMenuState, GEPEditorState){

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
    // --------------------------------------------------------------------
    // Temporary Keyboard input test code!
    var kinput = new Keyboard(window);
/*    kinput.on("keydown", function(code){
      var key = Keyboard.CodeToKeyName(code);
      console.log("[keydown]: <" + ((key !== "") ? key : "UNKNOWN") + ">");
    });

    kinput.on("keyup", function(code){
      var key = Keyboard.CodeToKeyName(code);
      console.log("[keyup]: <" + ((key !== "") ? key : "UNKNOWN") + ">");
    });

    kinput.on("comboon", function(comboName){
      console.log("[comboon]: " + comboName);
    });

    kinput.on("combooff", function(comboName){
      console.log("[combooff]: " + comboName);
    });

    kinput.onCombo("A", {
      on:function(){
	console.log("[SPECIAL ON] - Shift-A");
      },
      off:function(){
	console.log("[SPECIAL OFF] - Shift-A");
      }
    });

    kinput.onCombo("ctrl+B", {
      on:function(){
	console.log("[SUPER SPECIAL ON] - CTRL-SHIFT-B");
      },
      off:function(){
	console.log("[SUPER SPECIAL OFF] - CTRL-SHIFT-B");
      }
    });*/

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
      // Temporary map setup code.

      var ts = new Tileset("demo");
      ts.set("floor", {
        name:"Wood Floor",
	description: "This is a wood floor you sassy buster you.",
	primeglyph: parseInt("F0", 16),
	betaglyph: -1,
	movability: 1.0,
	visibility: 1.0,
	foreground: "#a58740",
	background: null
      });
      ts.set("wall", {
        name:"Wooden Wall",
	description: "This is a wooden wall... Sooo grainey",
	primeglyph: parseInt("DB", 16),
	betaglyph: -1,
	movability: 1.0,
	visibility: 1.0,
	foreground: "#a58740",
	background: null
      });

      var map = new Tilemap();
      var findex = map.useTile(ts.get("floor"));
      var windex = map.useTile(ts.get("wall"));
      map.initialize("map", "map", 200, 200);
      map.createRoom(0, 0, 15, 15, findex, windex);
      map.createRoom(14, 5, 10, 3, findex, windex);
      map.createRoom(23, 0, 10, 30, findex, windex);

      // --------------------------------------------------------------------
      // Temporary ECS Test code

      var assembler = new Assembler();
      var cdb = assembler.db;

      cdb.defineComponent("position", {x:0, y:0});
      cdb.defineComponent("demographic", {race:"human", gender:"male"});
      cdb.defineComponent("viz", {primeglyph:1, betaglyph:2});

      assembler.defineAssemblage("creature", "human", "position,demographic,viz");
      assembler.defineAssemblage("creature", "elf", [
	{name:"position"},
	{name:"demographic", idata:{race:"elf"}},
	{name:"viz", idata:{primeglyph:2, betaglyph:1}}
      ]);

      var human = assembler.createEntity("creature", "human");
      var elf = assembler.createEntity("creature", "elf");

      // --------------------------------------------------------------------

      var fsm = new FSM();
      new MainMenuState(term, kinput, fsm, true);
      new GameState(term, kinput, map, fsm);
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

/*document.addEventListener("DOMContentLoaded", function(event) {
  if (!(window.Game instanceof Object)){
    throw new Error("Missing the 'Game' object.");
  }
  if (typeof(window.Game.application) === 'undefined'){
    throw new Error("Missing 'Game.application'.");
  }

  window.Game.application.init(window, "terminal", "rogue", {
    fonts: [
      {name:"rogue", width:10, height:10, uri:"data/graphics/10x10/RogueObsidian_10x10.png"}
    ],
    screen: window.Game.Screen.game,
    minColumns: 60,
    minRows: 42
  });
  window.Game.application.start();
});*/
