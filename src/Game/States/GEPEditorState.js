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
      'src/R/Graphics/GlyphEncodedPicture'
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
	require('src/R/Graphics/GlyphEncodedPicture')
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
	root.R.Input.Keyboard,
	root.R.Graphics.GlyphEncodedPicture
      );
    }
  }
})(this, function (FSM, Terminal, Cursor, Keyboard, GlyphEncodedPicture) {

  // (G)lyph (E)ncoded (P)icture Editor State
  function GEPEditorState(terminal, keyboard, fsm, setActive){
    if (!(terminal instanceof Terminal)){
      throw new TypeError("Argument <terminal> expected to be a Terminal instance.");
    }
    if (!(keyboard instanceof Keyboard)){
      throw new TypeError("Argument <keyboard> expected to be a Keyboard instance.");
    }

    var gep = null;
    var offset = { // Offset of the "camera" viewing the GEP image.
      c: 0,
      r: 0
    };

    var activeGlyph = 0;
    var activeFG = null;
    var activeBG = null;

    var framecursor = null;
    var gepcursor = null;
    var palcursor = null;
    var glyphcursor = null;
    var uicursor = null;

    var focus = false;
    var redrawFrame = true;
    var redrawPalette = true;
    var redrawGlyphs = true;
    var redrawImage = true;
    var redrawUI = true;

    function onRenderResize(newres, oldres){
      framecursor.region = {
	left: 0,
	top: 0,
	right: newres[0]-1,
	bottom: newres[1]-1
      };
      framecursor.clear();

      gepcursor.region = {
	left: 3,
	right: newres[0] - 4,
	top: 1,
	bottom: newres[1] - 4
      };

      palcursor.region = {
	left: 1,
	right: 2,
	top: 1,
	bottom: newres[1] - 4
      };

      glyphcursor.region = {
	left: newres[0] - 2,
	right: newres[0] - 2,
	top: 1,
	bottom: newres[1] - 4
      };

      uicursor.region = {
	left: 1,
	right: newres[0] - 2,
	top: newres[1] - 2,
	bottom: newres[1] - 2
      };

      redrawFrame = true;
      redrawPalette = true;
      redrawGlyphs = true;
      redrawImage = true;
      redrawUI = true;
    };

    function RenderFrame(cur){
      var rows = cur.rows;
      var columns = cur.columns;
      
      cur.c = 0;
      cur.r = 0;
      var line = new Array(columns);
      for (var c = 0; c < columns; c++){
	if (c === 0){
	  line[c] = parseInt("DA", 16);
	} else if (c === 3 || c === columns - 3){
	  line[c] = parseInt("C2", 16);
	} else if (c === columns - 1){
	  line[c] = parseInt("BF", 16);
	} else {
	  line[c] = parseInt("C4", 16);
	}
      }
      cur.dataOut(line);
      
      var vlinecode = parseInt("B3", 16);
      for (var r=1; r < rows-3; r++){
	cur.r = r;
	cur.c = 0;
	cur.set(vlinecode);
	cur.c = 3;
	cur.set(vlinecode);
	cur.c = columns - 3;
	cur.set(vlinecode);
	cur.c = columns - 1;
	cur.set(vlinecode);
      }

      for (c=0; c < columns; c++){
	if (c === 0){
	  line[c] = parseInt("C3", 16);
	} else if (c === 3 || c === columns - 3){
	  line[c] = parseInt("C1", 16);
	} else if (c === columns - 1){
	  line[c] = parseInt("B4", 16);
	} else {
	  line[c] = parseInt("C4", 16);
	}
      }
      cur.c = 0;
      cur.r = rows - 3;
      cur.dataOut(line);

      cur.c = 0;
      cur.r = rows - 2;
      cur.set(vlinecode);
      cur.c = columns - 1;
      cur.set(vlinecode);

      for (c=0; c < columns; c++){
	if (c === 0){
	  line[c] = parseInt("C0", 16);
	} else if (c === columns - 1){
	  line[c] = parseInt("D9", 16);
	} else {
	  line[c] = parseInt("C4", 16);
	}
      }
      cur.c = 0;
      cur.r = rows - 1;
      cur.dataOut(line);
    };


    function onKeyDown(code){
      if (Keyboard.CodeSameAsName(code, "escape") === true){
	fsm.activateState("MainMenuState");
      }
    };


    this.enter = function(){
      framecursor = new Cursor(terminal);
      gepcursor = new Cursor(terminal);
      palcursor = new Cursor(terminal);
      glyphcursor = new Cursor(terminal);
      uicursor = new Cursor(terminal);
    };

    this.getFocus = function(){
      terminal.on("renderResize", onRenderResize);
      onRenderResize([terminal.columns, terminal.rows], null);
      if (gep === null){
	gep = new GlyphEncodedPicture();
      }
      keyboard.on("keydown", onKeyDown);
      focus = true;
    };

    this.looseFocus = function(){
      terminal.unlisten("renderResize", onRenderResize);
      keyboard.unlisten("keydown", onKeyDown);
      focus = false;
    };

    this.exit = function(){
      framecursor = null;
      gepcursor = null;
      palcursor = null;
      glyphcursor = null;
      uicursor = null;
      gep = null;
    };

    this.update = function(timestamp, bps){
      if (focus === true){
	if (redrawFrame === true){
	  redrawFrame = false;
	  RenderFrame(framecursor);
	}
      }
    };


    FSM.State.call(this, "GEPEditorState", fsm, setActive);
  };
  GEPEditorState.prototype.__proto__ = FSM.State.prototype;
  GEPEditorState.prototype.constructor = GEPEditorState;

  return GEPEditorState;

});
