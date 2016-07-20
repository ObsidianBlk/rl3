(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/Game/FSM',
      'src/R/Graphics/Terminal',
      'src/R/Graphics/Cursor',
      'src/R/Input/Keyboard',
      'src/Game/System/GameMap'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/Game/FSM'),
	require('src/R/Graphics/Terminal'),
	require('src/R/Graphics/Cursor'),
	require('src/R/Input/Keyboard'),
        require('src/Game/System/GameMap')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
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
	root.R.Graphics.Terminal,
	root.R.Graphics.Cursor,
	root.R.Input.Keyboard,
        root.System.GameMap
      );
    }
  }
})(this, function (FSM, Terminal, Cursor, Keyboard, GameMap) {

  function GameState(terminal, keyboard, fsm, setActive){
    if (!(terminal instanceof Terminal)){
      throw new TypeError("Argument <terminal> expected to be a Terminal instance.");
    }
    if (!(keyboard instanceof Keyboard)){
      throw new TypeError("Argument <keyboard> expected to be a Keyboard instance.");
    }

    var map = null;
    var focus = false;
    var cursor = null;

    Object.defineProperties(this, {
      "map":{
        enumerate:true,
        get:function(){return map;},
        set:function(m){
          if (m === null || m instanceof GameMap){
            map = m;
          } else {
            throw new TypeError("Expecting a GameMap instance objector null.");
          }
        }
      }
    });

    function onRenderResize(newres, oldres){
      cursor.region = {
	left: 0,
	top: 0,
	right: newres[0]-1,
	bottom: newres[1]-1
      };

      cursor.c = 0;
      cursor.r = cursor.rows - 1;
      cursor.textOut("Frames Per Second:");

      cursor.c = 0;
      cursor.r = 0;
      if (map instanceof GameMap){
        map.draw(cursor);
        /*var mapinfo = map.getRegionTileInfo(0, 0, 64, 30, false);
        Object.keys(mapinfo).forEach(function(key){
          var tile = mapinfo[key].tile;
	  var gindex = tile.primeglyph;
          var opts = {};
          if (tile.foreground !== null){
            opts.foreground = tile.foreground;
          }
          if (tile.background !== null){
            opts.background = tile.background;
          }
	  var coords = mapinfo[key].coord;
          var coordCount = coords.length/2;
          for (var i=0; i < coordCount; i++){
            cursor.c = coords[i*2];
            cursor.r = coords[(i*2)+1] + 4; // The +4 is an explicit shift down.
            cursor.set(gindex, Cursor.WRAP_TYPE_CHARACTER, opts);
          }
        });*/
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
      cursor.clear();
      onRenderResize([terminal.columns, terminal.rows], null);
      focus = true;
    };

    this.looseFocus = function(){
      terminal.unlisten("renderResize", onRenderResize);
      keyboard.unlistenCombo("ctrl+shift+esc", onExitCombo);
      focus = false;
    };

    this.exit = function(){
      cursor = null;
      focus = false;
    };

    var lastDigitSize = 0;
    this.update = function(timestamp, fps){
      if (focus === true){
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
