(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/Game/FSM',
      'src/R/ECS/World',
      'src/R/ECS/Entity',
      'src/R/Graphics/Terminal',
      'src/R/Graphics/Cursor',
      'src/R/Map/Tileset',
      'src/R/Map/Tilemap',
      'src/R/Input/Keyboard',
      'src/Game/System/Navigation',
      'src/Game/System/Player',
      'src/Game/System/GameMap',
      'src/Game/System/Doors',
      'src/Game/System/FOV/Shadowcaster'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/Game/FSM'),
        require('src/R/ECS/World'),
        require('src/R/ECS/Entity'),
	require('src/R/Graphics/Terminal'),
	require('src/R/Graphics/Cursor'),
        require('src/R/Map/Tileset'),
        require('src/R/Map/Tilemap'),
	require('src/R/Input/Keyboard'),
        require('src/Game/System/Navigation'),
        require('src/Game/System/Player'),
        require('src/Game/System/GameMap'),
        require('src/Game/System/Doors'),
        require('src/Game/System/FOV/Shadowcaster')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    // WTF AM I DOING HERE?!?!?!
    if (typeof(root.FSM) === 'undefined'){
      throw new Error("Missing required class 'FSM'.");
    }
    if (typeof(root.System) === 'undefined'){
      throw new Error("Missing required class 'System.GameMap'.");
    }
    if (typeof(root.R) === 'undefined'){
      throw new Error("The R library has not been loaded.");
    }
    if (typeof(root.States) === 'undefined'){
      root.States = {};
    }
    if (typeof(root.States.GameState) === 'undefined'){
      root.States.Game = factory(
	root.FSM,
        root.R.ECS.World,
        root.R.ECS.Entity,
	root.R.Graphics.Terminal,
	root.R.Graphics.Cursor,
        root.R.Map.Tileset,
        root.R.Map.Tilemap,
	root.R.Input.Keyboard,
        root.System.Navigation,
        root.System.Player,
        root.System.GameMap,
        root.System.Doors,
        root.Game.System.FOV.Shadowcaster
      );
    }
  }
})(this, function (FSM, World, Entity, Terminal, Cursor, Tileset, Tilemap, Keyboard, Navigation, Player, GameMap, Doors, Shadowcaster) {

  function GameState(terminal, keyboard, fsm, assembler, setActive){
    if (!(terminal instanceof Terminal)){
      throw new TypeError("Argument <terminal> expected to be a Terminal instance.");
    }
    if (!(keyboard instanceof Keyboard)){
      throw new TypeError("Argument <keyboard> expected to be a Keyboard instance.");
    }

    var focus = false;
    var cursor = null;
    var updateMap = true;

    // TODO: Make Tileset a more "global" object.
    var ts = new Tileset("demo");
    ts.set("floor", {
      name:"Wood Floor",
      description: "This is a wood floor you sassy buster you.",
      primeglyph: parseInt("F0", 16),
      betaglyph: -1,
      moveability: 1.0,
      visibility: 1.0,
      foreground: "#a58740",
      background: null
    });
    ts.set("wall", {
      name:"Wooden Wall",
      description: "This is a wooden wall... Sooo grainey",
      primeglyph: parseInt("DB", 16),
      betaglyph: -1,
      moveability: 0.0,
      visibility: 0.0,
      foreground: "#a58740",
      background: null
    });


    
    var world = new World();
    var map = new GameMap(world, Shadowcaster);
    map.tilemap = new Tilemap();
    var findex = map.tilemap.useTile(ts.get("floor"));
    var windex = map.tilemap.useTile(ts.get("wall"));
    map.tilemap.initialize("map", "map", 200, 200);
    map.tilemap.createRoom(0, 0, 15, 15, findex, windex);
    
    map.tilemap.createRoom(23, 0, 10, 30, findex, windex);
    map.tilemap.createCorridor(14, 5, 10, 0, findex, windex);
    map.tilemap.createRoom(54, 5, 10, 10, findex, windex);


    world.registerSystem(new Navigation(world, map));
    world.registerSystem(new Player(world));
    world.registerSystem(new Doors(world, assembler));
    world.registerSystem(map, 0);

    Object.defineProperties(this, {
      "map":{
        enumerable:true,
        get:function(){return map;}
      },

      "world":{
        enumerable:true,
        get:function(){return world;}
      }
    });

    function onKeyUp(code){
      var dc = 0;
      var dr = 0;
      if (Keyboard.CodeSameAsName(code, "up") === true){
        dr = -1;
      } else if (Keyboard.CodeSameAsName(code, "down") === true){
        dr = 1;
      } else if (Keyboard.CodeSameAsName(code, "left") === true){
        dc = -1;
      } else if (Keyboard.CodeSameAsName(code, "right") === true){
        dc = 1;
      }

      world.emit("player-move", dc, dr);
      updateMap = true;
    };

    function onRenderResize(newres, oldres){
      cursor.region = {
	left: 0,
	top: 0,
	right: newres[0]-1,
	bottom: newres[1]-1
      };
      Render();
    }

    function Render(){
      cursor.c = 0;
      cursor.r = cursor.rows - 1;
      cursor.textOut("Frames Per Second:");

      cursor.c = 0;
      cursor.r = 0;
      if (map instanceof GameMap){
        map.draw(cursor);
      }
    }

    function onExitCombo(){
      fsm.removeState("GameState");
    }

    this.enter = function(){
      cursor = new Cursor(terminal);
    };

    this.getFocus = function(){
      terminal.on("renderResize", onRenderResize);
      keyboard.onCombo("ctrl+shift+esc", onExitCombo);
      keyboard.on("keyup", onKeyUp);
      cursor.clear();
      onRenderResize([terminal.columns, terminal.rows], null);
      focus = true;
    };

    this.looseFocus = function(){
      terminal.unlisten("renderResize", onRenderResize);
      keyboard.unlistenCombo("ctrl+shift+esc", onExitCombo);
      keyboard.unlisten("keyup", onKeyUp);
      focus = false;
    };

    this.exit = function(){
      cursor = null;
      focus = false;
    };

    var lastDigitSize = 0;
    this.update = function(timestamp, fps){
      if (focus === true){
        if (updateMap === true){
          //cursor.clear();
          updateMap = false;
          Render();
        }
        
	if (lastDigitSize > 0){
	  cursor.clearRegion(19, cursor.rows - 1, lastDigitSize, 1);
	}
	cursor.c = 19;
	cursor.r = cursor.rows - 1;
	cursor.textOut(fps.toString());
	lastDigitSize = fps.toString().length;
      }
    };


    FSM.State.call(this, "GameState", fsm, setActive);
  }
  GameState.prototype.__proto__ = FSM.State.prototype;
  GameState.prototype.constructor = GameState;


  return GameState;
});
