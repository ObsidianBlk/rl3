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
      'src/Game/System/Dialog',
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
        require('src/Game/System/Dialog'),
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
        root.System.Dialog,
        root.Game.System.FOV.Shadowcaster
      );
    }
  }
})(this, function (FSM, World, Entity, Terminal, Cursor, Tileset, Tilemap, Keyboard, Navigation, Player, Reticle, GameMap, Doors, Dialog, Shadowcaster) {

  var UI_WIDTH = 24;
  var DIALOG_HEIGHT = 12;

  function GameState(terminal, keyboard, fsm, assembler, setActive){
    if (!(terminal instanceof Terminal)){
      throw new TypeError("Argument <terminal> expected to be a Terminal instance.");
    }
    if (!(keyboard instanceof Keyboard)){
      throw new TypeError("Argument <keyboard> expected to be a Keyboard instance.");
    }

    var focus = false;
    //var cursor = null;

    var cursor_full = null;
    var cursor_map = null;
    var cursor_ui = null;
    var cursor_dialog = null;

    var Cols = 0;
    var Rows = 0;
    
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


    // 0 = Default mode. 1 = "Interact" mode.
    var inputMode = 0;

    
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

    var sysDialog = new Dialog(world);


    world.registerSystem(new Navigation(world, map));
    world.registerSystem(sysDialog);
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

      var door = assembler.createEntity("door", "wooden_door");
      assembler.mimicEntity("door", "_closed", door);
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
      if (inputMode === 0){
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
            world.emit("dialog-message", "Reticle Disabled");
            world.emit("disable-reticle");
          } else {
            world.emit("dialog-message", "Reticle Enabled");
            world.emit("enable-reticle", sysPlayer.c, sysPlayer.r);
          }
        } else if (Keyboard.CodeSameAsName(code, "i") === true){
          inputMode = 1;
        }

        if (dc !== 0 || dr !== 0){
          if (sysReticle.enabled){
            world.emit("dialog-message", "The reticle has moved (" + dc + ", " + dr + ")", {originator: "Reticle", tint:"#FA0"});
          } else {
            world.emit("dialog-message", "The player has moved (" + dc + ", " + dr + ")", {originator:"Player", tint:"#0AF"});
          }
          world.emit("player-move", dc, dr);
        }
      } else if (inputMode === 1){
        if (Keyboard.CodeSameAsName(code, "q") === true){
          sysPlayer.doInteraction(0);
        } else if (Keyboard.CodeSameAsName(code, "w") === true){
          sysPlayer.doInteraction(1);
        } else if (Keyboard.CodeSameAsName(code, "e") === true){
          sysPlayer.doInteraction(2);
        } else if (Keyboard.CodeSameAsName(code, "d") === true){
          sysPlayer.doInteraction(3);
        } else if (Keyboard.CodeSameAsName(code, "c") === true){
          sysPlayer.doInteraction(4);
        } else if (Keyboard.CodeSameAsName(code, "x") === true){
          sysPlayer.doInteraction(5);
        } else if (Keyboard.CodeSameAsName(code, "z") === true){
          sysPlayer.doInteraction(6);
        } else if (Keyboard.CodeSameAsName(code, "a") === true){
          sysPlayer.doInteraction(7);
        } else if (Keyboard.CodeSameAsName(code, "s") === true){
          sysPlayer.doInteraction(8);
        }
        inputMode = 0;

      } else { // This should never happen.
        inputMode = 0;
      }
      updateMap = true;
    };

    function onRenderResize(newres, oldres){
      Cols = newres[0];
      Rows = newres[1];
      
      cursor_full.region = {
	left:0,
	top: 0,
	right: Cols-1,
	bottom: Rows-1
      };
      
      cursor_map.region = {
	left: 1,
	top: 1,
	right: Cols-(UI_WIDTH+3),
	bottom: Rows-(DIALOG_HEIGHT+3)
      };

      cursor_ui.region = {
        left: Cols - (UI_WIDTH+1),
        top: 1,
        right: Cols-2,
        bottom: Rows-(DIALOG_HEIGHT+3)
      };

      cursor_dialog.region = {
        left: 1,
        top: Rows-(DIALOG_HEIGHT+1),
        right: Cols-2,
        bottom: Rows-2
      };
      RenderFrame();
      Render();
      sysDialog.render();
    }

    function DrawFrame(cur, c, r, w, h){
      var gh = 196;
      var gv = 179;
      var gul = 218;
      var gll = 192;
      var gur = 191;
      var glr = 217;
      
      for (var _c=c; _c < c+w; _c++){
	cur.c = _c;
	cur.r = r;
	cur.set(gh);

	cur.c = _c;
	cur.r = (r+h)-1;
	cur.set(gh);
      }

      for (var _r=r+1; _r < (r+h)-1; _r++){
	cur.c = c;
	cur.r = _r;
	cur.set(gv);

	cur.c = (c+w)-1;
	cur.r = _r;
	cur.set(gv);
      }

      cur.c = c;
      cur.r = r;
      cur.set(gul);

      cur.c = (c+w)-1;
      cur.r = r;
      cur.set(gur);

      cur.c = c;
      cur.r = (r+h)-1;
      cur.set(gll);

      cur.c = (c+w)-1;
      cur.r = (r+h)-1;
      cur.set(glr);
    }

    function RenderFrame(){
      var gtl = 180;
      var gtr = 195;
      var gtu = 193;
      var gtd = 194;
      var gx = 197;

      DrawFrame(cursor_full, 0, 0, Cols-(UI_WIDTH+1), Rows-(DIALOG_HEIGHT+1));
      DrawFrame(cursor_full, Cols-(UI_WIDTH+2), 0, UI_WIDTH+2, Rows-(DIALOG_HEIGHT+1));
      DrawFrame(cursor_full, 0, Rows-(DIALOG_HEIGHT+2), Cols, DIALOG_HEIGHT+2);

      cursor_full.c = Cols - (UI_WIDTH+2);
      cursor_full.r = 0;
      cursor_full.set(gtd);

      cursor_full.c = Cols - (UI_WIDTH+2);
      cursor_full.r = Rows-(DIALOG_HEIGHT+2);
      cursor_full.set(gtu);

      cursor_full.c = 0;
      cursor_full.r = Rows-(DIALOG_HEIGHT+2);
      cursor_full.set(gtr);

      cursor_full.c = Cols-1;
      cursor_full.r = Rows-(DIALOG_HEIGHT+2);
      cursor_full.set(gtl);
    }

    function Render(){
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
      cursor_full = new Cursor(terminal);
      cursor_map = new Cursor(terminal);
      cursor_ui = new Cursor(terminal);
      cursor_dialog = new Cursor(terminal);
      sysReticle.cursor = cursor_ui;
      sysDialog.cursor = cursor_dialog;
    };

    this.getFocus = function(){
      terminal.on("renderResize", onRenderResize);
      keyboard.onCombo("ctrl+shift+esc", onExitCombo);
      keyboard.on("keyup", onKeyUp);
      cursor_full.clear(); // This will clear the entire screen.
      //cursor_map.clear();
      //cursor_ui.clear();
      //cursor_dialog.clear();
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
      sysDialog.cursor = null;
      cursor_full = null;
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
	/*cursor_dialog.c = 19;
	cursor_dialog.r = 1;
	var fpsstr = fps.toString();
	if (fpsstr.length < 2){
	  fpsstr += " ";
	}
	cursor_dialog.textOut(fpsstr);*/
	//lastDigitSize = fps.toString().length;
      }
    };


    FSM.State.call(this, "GameState", fsm, setActive);
  }
  GameState.prototype.__proto__ = FSM.State.prototype;
  GameState.prototype.constructor = GameState;


  return GameState;
});
