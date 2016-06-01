(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/Game/FSM',
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
	require('src/Game/FSM'),
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
    if (typeof(root.States.GameState) === 'undefined'){
      root.States.Game = factory(
	root.FSM,
	root.R.Graphics.Terminal,
	root.R.Graphics.Cursor,
	root.R.Input.Keyboard
      );
    }
  }
})(this, function (FSM, Terminal, Cursor, Keyboard) {

  function MainMenuState(terminal, keyboard, fsm, setActive){
    if (!(terminal instanceof Terminal)){
      throw new TypeError("Argument <terminal> expected to be a Terminal instance.");
    }
    if (!(keyboard instanceof Keyboard)){
      throw new TypeError("Argument <keyboard> expected to be a Keyboard instance.");
    }

    var focus = false;
    var cursor = null;

    var update = false;
    var menuItem = 0;

    var self = this;
    function onRenderResize(newres, oldres){
      cursor.region = {
	left: 0,
	top: 0,
	right: newres[0]-1,
	bottom: newres[1]-1
      };

      update = true;
      self.update();
    }

    function onExitCombo(){
      fsm.removeStates();
    }

    function onKeyDown(key){
      var keyName = Keyboard.CodeToKeyName(key);
      if (keyName === "up" || keyName === "w" || keyName === "left" || keyName === "a"){
	menuItem -= (menuItem > 0) ? 1 : 0;
	update = true;
      }

      if (keyName === "down" || keyName === "s" || keyName === "right" || keyName === "d"){
	menuItem += (menuItem < 2) ? 1 : 0;
	update = true;
      }

      if (keyName === "enter"){
	if (menuItem === 0){
	  fsm.setActive("GameState");
	} else if (menuItem === 2){
	  fsm.removeStates();
	}
      }
    }

    this.enter = function(){
      cursor = new Cursor(terminal);
    };

    this.getFocus = function(){
      terminal.on("renderResize", onRenderResize);
      keyboard.on("keydown", onKeyDown);
      keyboard.onCombo("ctrl+shift+esc", onExitCombo);
      onRenderResize([terminal.columns, terminal.rows], null);
      focus = true;
    };

    this.looseFocus = function(){
      terminal.unlisten("renderResize", onRenderResize);
      keyboard.unlisten("keydown", onKeyDown);
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
	if (update === true){
	  update = false;

	  cursor.c = 0;
	  cursor.r = 0;
	  cursor.textOut("Roguelike Demo - Main Menu");

	  cursor.c = 0;
	  cursor.r = 1;
	  if (menuItem === 0){
	    cursor.textOut("Play", {foreground:"#FFFF00"});
	  } else {
	    cursor.textOut("Play");
	  }

	  cursor.c = 0;
	  cursor.r = 2;
	  if (menuItem === 1){
	    cursor.textOut("Options", {foreground:"#FFFF00"});
	  } else {
	    cursor.textOut("Options");
	  }

	  cursor.c = 0;
	  cursor.r = 3;
	  if (menuItem === 2){
	    cursor.textOut("Quit", {foreground:"#FFFF00"});
	  } else {
	    cursor.textOut("Quit");
	  }
	}

	if (typeof(fps) === 'number'){
	  if (lastDigitSize > 0){
	    cursor.clearRegion(19, cursor.rows - 1, lastDigitSize, 1);
	  }
	  cursor.c = 19;
	  cursor.r = cursor.rows - 1;
	  cursor.textOut(fps.toString());
	  lastDigitSize = fps.toString().length;
	}
      }
    };


    FSM.State.call(this, "MainMenuState", fsm, setActive);
  }
  MainMenuState.prototype.__proto__ = FSM.State.prototype;
  MainMenuState.prototype.constructor = MainMenuState;


  return MainMenuState;

});
