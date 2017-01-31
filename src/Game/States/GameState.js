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
      'src/Game/System/Reticle',
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
        require('src/Game/System/Reticle'),
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
        root.System.Reticle,
        root.System.GameMap,
        root.System.Doors,
        root.Game.System.FOV.Shadowcaster
      );
    }
  }
})(this, function (FSM, World, Entity, Terminal, Cursor, Tileset, Tilemap, Keyboard, Navigation, Player, Reticle, GameMap, Doors, Shadowcaster) {

  var UI_WIDTH = 12;
  var DIALOG_HEIGHT = 6;

  function GameState(terminal, keyboard, fsm, assembler, setActive){
    if (!(terminal instanceof Terminal)){
      throw new TypeError("Argument <terminal> expected to be a Terminal instance.");
    }
    if (!(keyboard instanceof Keyboard)){
      throw new TypeError("Argument <keyboard> expected to be a Keyboard instance.");
    }

    var focus = false;
    //var cursor = null;

    var cursor_map = null;
    var cursor_ui = null;
    var cursor_dialog = null;
    
    var updateMap = true;

    var ts = Tileset.FromJSON({
      name:"demo",
      description:"Who the hell cares?!",
      tiles:[
        {
          id:"floor",
          name:"Wood Floor",
          description: "This is a wood floor you sassy buster you.",
          primeglyph: parseInt("F0", 16),
          moveability: 1.0,
          visibility: 1.0,
          foreground: "#a58740",
          background: null
        },

        {
          id:"wall",
          name:"Wooden Wall",
          description: "This is a wooden wall... Sooo grainey",
          primeglyph: parseInt("DB", 16),
          moveability: 0.0,
          visibility: 0.0,
          foreground: "#a58740",
          background: null
        }
      ]
    });


    
    var world = new World();
    var map = new GameMap(world);
    map.tilemap = new Tilemap();
    var findex = map.tilemap.useTile(ts.get("floor"));
    var windex = map.tilemap.useTile(ts.get("wall"));
    map.tilemap.initialize("map", "map", 200, 200);
    map.tilemap.createRoom(0, 0, 15, 15, findex, windex);
    map.tilemap.setTile(6, 7, windex);
    
    map.tilemap.createRoom(23, 0, 10, 30, findex, windex);
    map.tilemap.createCorridor(14, 5, 10, 0, findex, windex);
    map.tilemap.createRoom(54, 5, 10, 10, findex, windex);

    var sysPlayer = new Player(world);
    sysPlayer.map = map;

    var sysReticle = new Reticle(world);
    sysReticle.map = map;


    world.registerSystem(new Navigation(world, map));
    world.registerSystem(sysPlayer);
    world.registerSystem(sysReticle);
    world.registerSystem(new Doors(world, assembler));
    world.registerSystem(map, 0);

    (function(){
      var player = assembler.createEntity("actor", "human");
      assembler.db.addToEntity(player, "player");
      player.position.c = 1;
      player.position.r = 1;
      world.addEntity(player);

      var reticle = assembler.createEntity("actor", "reticle");
      reticle.reticle = {};
      world.addEntity(reticle);

      var door = assembler.createEntity("door", "door_closed");
      door.position.c = 14;
      door.position.r = 5;
      world.addEntity(door);
    })();

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
      } else if (Keyboard.CodeSameAsName(code, "l") === true){
        if (sysReticle.enabled === true){
          world.emit("disable-reticle");
        } else {
          world.emit("enable-reticle", sysPlayer.c, sysPlayer.r);
        }
      }

      if (dc !== 0 || dr !== 0){
        world.emit("player-move", dc, dr);
      }
      updateMap = true;
    };

    function onRenderResize(newres, oldres){
      cursor_map.region = {
	left: 0,
	top: 0,
	right: newres[0]-(UI_WIDTH+1),
	bottom: newres[1]-(DIALOG_HEIGHT+1)
      };

      cursor_ui.region = {
        left: newres[0] - UI_WIDTH,
        top: 0,
        right: newres[0]-1,
        bottom: newres[1]-DIALOG_HEIGHT
      };

      cursor_dialog.region = {
        left: 0,
        top: newres[1]-DIALOG_HEIGHT,
        right: newres[0]-1,
        bottom: newres[1]-1
      };
      Render();
    }

    function Render(){
      cursor_dialog.c = 0;
      cursor_dialog.r = 1;
      cursor_dialog.textOut("Frames Per Second:");

      cursor_map.c = 0;
      cursor_map.r = 0;
      if (map instanceof GameMap){
        map.draw(cursor_map, sysPlayer.fov);
      }
    }

    function onExitCombo(){
      fsm.removeState("GameState");
    }

    this.enter = function(){
      cursor_map = new Cursor(terminal);
      cursor_ui = new Cursor(terminal);
      cursor_dialog = new Cursor(terminal);
      sysReticle.cursor = cursor_ui;
    };

    this.getFocus = function(){
      terminal.on("renderResize", onRenderResize);
      keyboard.onCombo("ctrl+shift+esc", onExitCombo);
      keyboard.on("keyup", onKeyUp);
      cursor_map.clear();
      cursor_ui.clear();
      cursor_dialog.clear();
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
      sysReticle.cursor = null;
      cursor_map = null;
      cursor_ui = null;
      cursor_dialog = null;
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
        
	//if (lastDigitSize > 0){
	//  cursor_dialog.clearRegion(19, 1, lastDigitSize, 1);
	//}
	cursor_dialog.c = 19;
	cursor_dialog.r = 1;
	var fpsstr = fps.toString();
	if (fpsstr.length < 2){
	  fpsstr += " ";
	}
	cursor_dialog.textOut(fpsstr);
	//lastDigitSize = fps.toString().length;
      }
    };


    FSM.State.call(this, "GameState", fsm, setActive);
  }
  GameState.prototype.__proto__ = FSM.State.prototype;
  GameState.prototype.constructor = GameState;


  return GameState;
});
