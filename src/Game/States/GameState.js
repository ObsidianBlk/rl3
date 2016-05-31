(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/Game/States/Game',
      'src/R/Graphics/Terminal',
      'src/R/Graphics/Cursor',
      'src/R/Input/Keyboard'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/Game/States/Game'),
	require('src/R/Graphics/Terminal'),
	require('src/R/Graphics/Cursor'),
	require('src/R/Input/Keyboard')
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
    if (typeof(root.States) === 'undefined'){
      root.States = {};
    }
    if (typeof(root.States.Game) === 'undefined'){
      root.States.Game = factory(
	root.FSM,
	root.R.Graphics.Terminal,
	root.R.Graphics.Cursor,
	root.R.Input.Keyboard
      );
    }
  }
})(this, function (FSM, Terminal, Cursor, Keyboard) {

  function GameState(terminal, keyboard){
    if (!(terminal instanceof Terminal)){
      throw new TypeError("Argument <terminal> expected to be a Terminal instance.");
    }
    if (!(keyboard instanceof Keyboard)){
      throw new TypeError("Argument <keyboard> expected to be a Keyboard instance.");
    }
    FSM.State.call(this, "GameState");

    var focus = false;
    var cursor = null;

    function onRenderResize(oldres, newres){
      cursor.region = {
	left: 0,
	top: 0,
	right: newres[0]-1,
	bottom: newres[1]-1
      };
    }


    this.enter = function(){
      cursor = new Cursor(terminal);
    };

    this.getFocus = function(){
      terminal.on("renderResize", onRenderResize);
      onRenderResize();
      focus = true;
    };

    this.looseFocus = function(){
      terminal.unlisten("renderResize", onRenderResize);
      focus = false;
    };

    this.exit = function(){
      cursor = null;
      focus = false;
    };

    this.update = function(info){
      if (focus){
	;
      }
    };
  }
  GameState.prototype.__proto__ = FSM.State.prototype;
  GameState.prototype.constructor = GameState;


  return GameState;
});
