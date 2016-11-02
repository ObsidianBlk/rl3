
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
  'src/Game/ComponentDef',
  'src/Game/FSM',
  'src/Game/System/GameMap',
  'src/Game/States/GameState',
  'src/Game/States/MainMenuState',
  'src/Game/States/GEPEditorState'
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
            ComponentDef,
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
    var assembler = ComponentDef();
    
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
      // Temporary ECS Test code

      /*assembler.defineAssemblage("creature", "human", "position,demographic,viz");
      assembler.defineAssemblage("creature", "elf", [
	{name:"position"},
	{name:"demographic", idata:{race:"elf"}},
	{name:"viz", idata:{primeglyph:2, betaglyph:1}}
      ]);

      var human = assembler.createEntity("creature", "human");
      var elf = assembler.createEntity("creature", "elf");*/
      var player = new Entity("player", "actor");
      assembler.db.addToEntity(player, "position");
      assembler.db.addToEntity(player, "visual");
      assembler.db.addToEntity(player, "actor");
      assembler.db.addToEntity(player, "player");
      player.player = {};
      player.visual.primeGlyph = 2;
      player.visual.tint = "#FFF";
      player.position.c = 1;
      player.position.r = 1;


      var door = assembler.createEntity("door", "door_closed");
      door.position.c = 14;
      door.position.r = 5;
      

      // --------------------------------------------------------------------

      var fsm = new FSM();
      new MainMenuState(term, kinput, fsm, true);
      new GameState(term, kinput, fsm, assembler);
      new GEPEditorState(term, kinput, fsm);

      var gstate = fsm.get("GameState");
      //gstate.map.tilemap = map;
      //gstate.player = player;
      gstate.world.addEntity(player);
      gstate.world.addEntity(door);
      //gstate.map.setTarget(player);
      


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
