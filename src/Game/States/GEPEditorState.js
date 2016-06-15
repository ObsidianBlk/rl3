(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/Game/FSM',
      'src/R/Graphics/Color',
      'src/R/Graphics/Terminal',
      'src/R/Graphics/Cursor',
      'src/R/Input/Keyboard',
      'src/R/Graphics/GlyphEncodedPicture',
      'src/Game/States/GEPEditor/PalControl',
      'src/Game/States/GEPEditor/GlyphControl',
      'src/Game/States/GEPEditor/TerminalControl',
      'src/Game/States/GEPEditor/EditorControl'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/Game/FSM'),
        require('src/R/Graphics/Color'),
	require('src/R/Graphics/Terminal'),
	require('src/R/Graphics/Cursor'),
	require('src/R/Input/Keyboard'),
	require('src/R/Graphics/GlyphEncodedPicture'),
	require('src/Game/States/GEPEditor/PalControl'),
	require('src/Game/States/GEPEditor/GlyphControl'),
	require('src/Game/States/GEPEditor/TerminalControl'),
	require('src/Game/States/GEPEditor/EditorControl')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.FSM) === 'undefined'){
      throw new Error("Missing required class 'FSM'.");
    }
    if (typeof(root.States) === 'undefined'){
      throw new Error("Missing required library object 'States'.");
    }
    if (typeof(root.States.GEPEditor) === 'undefined'){
      throw new Error("Missing required library object 'States.GEPEditor'.");
    }
    if (typeof(root.States.GEPEditor.PalControl) === 'undefined'){
      throw new Error("Missing required class 'PalControl'.");
    }
    if (typeof(root.State.GEPEditor.GlyphControl) === 'undefined'){
      throw new Error("Missing required class 'GlyphControl'.");
    }
    if (typeof(root.State.GEPEditor.TerminalControl) === 'undefined'){
      throw new Error("Missing required class 'TerminalControl'.");
    }
    if (typeof(root.States.GEPEditor.EditorControl) === 'undefined'){
      throw new Error("Missing required class 'EditorControl'.");
    }
    if (typeof(root.R) === 'undefined'){
      throw new Error("The R library has not been loaded.");
    }

    if (typeof(root.States.GameState) === 'undefined'){
      root.States.Game = factory(
	root.FSM,
        root.R.Graphics.Color,
	root.R.Graphics.Terminal,
	root.R.Graphics.Cursor,
	root.R.Input.Keyboard,
	root.R.Graphics.GlyphEncodedPicture,
	root.States.GEPEditor.PalControl,
	root.States.GEPEditor.GlyphControl,
	root.States.GEPEditor.TerminalControl,
	root.States.GEPEditor.EditorControl
      );
    }
  }
})(this, function (FSM, Color, Terminal, Cursor, Keyboard, GlyphEncodedPicture, PalControl, GlyphControl, TerminalControl, EditorControl) {



  // (G)lyph (E)ncoded (P)icture Editor State
  function GEPEditorState(terminal, keyboard, fsm, setActive){
    if (!(terminal instanceof Terminal)){
      throw new TypeError("Argument <terminal> expected to be a Terminal instance.");
    }
    if (!(keyboard instanceof Keyboard)){
      throw new TypeError("Argument <keyboard> expected to be a Keyboard instance.");
    }

    var gep = null;

    var ctrlPalette = new PalControl(keyboard);
    var ctrlGlyph = new GlyphControl(terminal, keyboard);
    var ctrlEditor = new EditorControl(keyboard);
    var ctrlTerminal = new TerminalControl(keyboard);

    var framecursor = null;

    var focus = false;
    var redrawFrame = true;

    function onRenderResize(newres, oldres){
      framecursor.region = {
	left: 0,
	top: 0,
	right: newres[0]-1,
	bottom: newres[1]-1
      };
      framecursor.clear();

      if (ctrlEditor.cursor !== null){
	ctrlEditor.cursor.region = {
	  left: 6,
	  right: newres[0] - 5,
	  top: 1,
	  bottom: newres[1] - 4
	};
      }

      if (ctrlPalette.cursor !== null){
	ctrlPalette.cursor.region = {
	  left: 1,
	  right: 4,
	  top: 1,
	  bottom: newres[1] - 4
	};
      }

      if (ctrlGlyph.cursor !== null){
	ctrlGlyph.cursor.region = {
	  left: newres[0] - 3,
	  right: newres[0] - 2,
	  top: 1,
	  bottom: newres[1] - 4
	};
      }

      if (ctrlTerminal.cursor !== null){
	ctrlTerminal.cursor.region = {
	  left: 1,
	  right: newres[0] - 2,
	  top: newres[1] - 2,
	  bottom: newres[1] - 2
	};
      }

      redrawFrame = true;
    };

    function OnPaletteChange(){
      ctrlEditor.forceRerender();
      // TODO: Force Editor to redraw
    }


    function RenderFrame(cur){
      var rows = cur.rows;
      var columns = cur.columns;

      var coll1 = 0;
      var coll2 = 5;
      var colr1 = columns - 4;
      var colr2 = columns - 1;
      
      cur.c = 0;
      cur.r = 0;
      var line = new Array(columns);
      for (var c = 0; c < columns; c++){
	if (c === coll1){
	  line[c] = parseInt("DA", 16);
	} else if (c === coll2 || c === colr1){
	  line[c] = parseInt("C2", 16);
	} else if (c === colr2){
	  line[c] = parseInt("BF", 16);
	} else {
	  line[c] = parseInt("C4", 16);
	}
      }
      cur.dataOut(line);
      
      var vlinecode = parseInt("B3", 16);
      for (var r=1; r < rows-3; r++){
	cur.r = r;
	cur.c = coll1;
	cur.set(vlinecode);
	cur.c = coll2;
	cur.set(vlinecode);
	cur.c = colr1;
	cur.set(vlinecode);
	cur.c = colr2;
	cur.set(vlinecode);
      }

      for (c=0; c < columns; c++){
	if (c === coll1){
	  line[c] = parseInt("C3", 16);
	} else if (c === coll2 || c === colr1){
	  line[c] = parseInt("C1", 16);
	} else if (c === colr2){
	  line[c] = parseInt("B4", 16);
	} else {
	  line[c] = parseInt("C4", 16);
	}
      }
      cur.c = coll1;
      cur.r = rows - 3;
      cur.dataOut(line);

      cur.c = coll1;
      cur.r = rows - 2;
      cur.set(vlinecode);
      cur.c = columns - 1;
      cur.set(vlinecode);

      for (c=0; c < columns; c++){
	if (c === coll1){
	  line[c] = parseInt("C0", 16);
	} else if (c === colr2){
	  line[c] = parseInt("D9", 16);
	} else {
	  line[c] = parseInt("C4", 16);
	}
      }
      cur.c = coll1;
      cur.r = rows - 1;
      cur.dataOut(line);
    };


    function onKeyDown(code){
      if (Keyboard.CodeSameAsName(code, "escape") === true){
        if (ctrlTerminal.active === false){
	  fsm.activateState("MainMenuState");
        } else {
	  ctrlEditor.activate(true);
        }

      } else if (Keyboard.CodeSameAsName(code, "grave") === true){
	if (keyboard.activeCombo("ctrl+`") === true){
	  ctrlTerminal.activate(true);
	}

	// Terminal trumps all over inputs...
      } else if (ctrlTerminal.active === false){
	if (Keyboard.CodeSameAsName(code, "tab") === true){
	  if (ctrlPalette.active === true){
	    ctrlEditor.activate(true);
	  } else if (ctrlEditor.active === true){
	    ctrlGlyph.activate(true);
	  } else if (ctrlGlyph.active === true){
	    ctrlPalette.activate(true);
	  }
	} else if (keyboard.activeCombo("shift+tab") === true){
	  if (ctrlPalette.active === true){
	    ctrlGlyph.activate(true);
	  } else if (ctrlGlyph.active === true){
	    ctrlEditor.activate(true);
	  } else if (ctrlEditor.active === true){
	    ctrlPalette.activate(true);
	  }
	}
      }
    };

    function onCtrlTildaCombo(){
      //ctrlTerminal.activate(true);
    };


    this.enter = function(){
      gep = new GlyphEncodedPicture();
      framecursor = new Cursor(terminal);

      ctrlPalette.cursor = new Cursor(terminal);
      ctrlPalette.gep = gep;
      ctrlPalette.on("palettechange", OnPaletteChange);
      ctrlPalette.on("activating", function(){
	ctrlEditor.activate(false);
	ctrlGlyph.activate(false);
	ctrlTerminal.activate(false);
      });

      ctrlGlyph.cursor = new Cursor(terminal);
      ctrlGlyph.gep = gep;
      ctrlGlyph.on("activating", function(){
	ctrlEditor.activate(false);
	ctrlPalette.activate(false);
	ctrlTerminal.activate(false);
      });

      ctrlEditor.cursor = new Cursor(terminal);
      ctrlEditor.gep = gep;
      ctrlEditor.on("activating", function(){
	ctrlPalette.activate(false);
	ctrlGlyph.activate(false);
	ctrlTerminal.activate(false);
      });

      ctrlTerminal.cursor = new Cursor(terminal);
      ctrlTerminal.on("activating", function(){
	ctrlEditor.activate(false);
	ctrlGlyph.activate(false);
	ctrlPalette.activate(false);
      });
      ctrlTerminal.on("setpalette16", function(args){
	ctrlPalette.processGet16BitPaletteCMD(args);
      });
      ctrlTerminal.on("switchpalettecolor", function(args, fg){
	ctrlPalette.processSwitchColorCMD(args, fg);
      });
      ctrlTerminal.on("switchglyphindex", function(index){
	if (index < 0 || index >= terminal.glyph.elements){
	  ctrlTerminal.displayError("Glyph index out of bounds.");
	}
	ctrlGlyph.glyph = index;
      });
      ctrlTerminal.on("requestinfo", function(type){
	if (type === "glyph"){
	  ctrlTerminal.displayMessage("Glyph Index: " + ctrlGlyph.glyph.toString());
	}
      });
    };

    this.getFocus = function(){
      terminal.on("renderResize", onRenderResize);
      onRenderResize([terminal.columns, terminal.rows], null);
      keyboard.on("keydown", onKeyDown);
      keyboard.onCombo("ctrl+`", {on:onCtrlTildaCombo});
      ctrlEditor.activate(true);
      focus = true;
    };

    this.looseFocus = function(){
      terminal.unlisten("renderResize", onRenderResize);
      keyboard.unlisten("keydown", onKeyDown);
      keyboard.unlistenCombo("ctrl+`", {on:onCtrlTildaCombo});

      ctrlEditor.activate(false);
      ctrlPalette.activate(false);
      ctrlGlyph.activate(false);
      ctrlTerminal.activate(false);

      focus = false;
    };

    this.exit = function(){
      framecursor = null;

      ctrlEditor.activate(false);
      ctrlEditor.cursor = null;
      ctrlEditor.gep = null;
      ctrlEditor.unlistenAll();

      ctrlPalette.activate(false);
      ctrlPalette.cursor =  null;
      ctrlPalette.gep = null;
      ctrlPalette.unlistenAll();

      ctrlGlyph.activate(false);
      ctrlGlyph.cursor = null;
      ctrlGlyph.unlistenAll();

      ctrlTerminal.activate(false);
      ctrlTerminal.cursor = null;
      ctrlTerminal.unlistenAll();

      gep = null;
    };

    this.update = function(timestamp, bps){
      if (focus === true){
	if (redrawFrame === true){
	  redrawFrame = false;
	  RenderFrame(framecursor);
	}
        
        ctrlEditor.update(timestamp);

        
        ctrlPalette.render();
        ctrlEditor.render();
	ctrlGlyph.render();
	ctrlTerminal.render(gep);
      }
    };


    FSM.State.call(this, "GEPEditorState", fsm, setActive);
  };
  GEPEditorState.prototype.__proto__ = FSM.State.prototype;
  GEPEditorState.prototype.constructor = GEPEditorState;

  return GEPEditorState;

});
