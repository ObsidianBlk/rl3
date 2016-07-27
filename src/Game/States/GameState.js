(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/Game/FSM',
      'src/R/ECS/Entity',
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
        require('src/R/ECS/Entity'),
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
        root.R.ECS.Entity,
	root.R.Graphics.Terminal,
	root.R.Graphics.Cursor,
	root.R.Input.Keyboard,
        root.System.GameMap
      );
    }
  }
})(this, function (FSM, Entity, Terminal, Cursor, Keyboard, GameMap) {

  function GameState(terminal, keyboard, fsm, setActive){
    if (!(terminal instanceof Terminal)){
      throw new TypeError("Argument <terminal> expected to be a Terminal instance.");
    }
    if (!(keyboard instanceof Keyboard)){
      throw new TypeError("Argument <keyboard> expected to be a Keyboard instance.");
    }

    var map = null;
    var player = null;
    var focus = false;
    var cursor = null;
    var updateMap = true;

    Object.defineProperties(this, {
      "map":{
        enumerate:true,
        get:function(){return map;},
        set:function(m){
          if (m === null || m instanceof GameMap){
            map = m;
            if (player !== null){
              map.setTarget(player);
            }
          } else {
            throw new TypeError("Expecting a GameMap instance objector null.");
          }
        }
      },

      "player":{
        enumerate:true,
        get:function(){return player;},
        set:function(p){
          if (!(p instanceof Entity)){
            throw new TypeError("Expected Entity instance object.");
          }
          if (typeof(p.visual) !== 'undefined' && typeof(p.position) !== 'undefined'){
            if (player !== p){
              if (player !== null && map !== null){
                map.removeEntity(player);
              }
              player = p;
              if (map !== null){
                map.setTarget(player);
              }
            }
          }
        }
      }
    });

    function onKeyUp(code){
      if (player !== null){
        if (Keyboard.CodeSameAsName(code, "up") === true){
          player.position.r -= 1;
          updateMap = true;
        } else if (Keyboard.CodeSameAsName(code, "down") === true){
          player.position.r += 1;
          updateMap = true;
        } else if (Keyboard.CodeSameAsName(code, "left") === true){
          player.position.c -= 1;
          updateMap = true;
        } else if (Keyboard.CodeSameAsName(code, "right") === true){
          player.position.c += 1;
          updateMap = true;
        }
      }
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
          cursor.clear();
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
