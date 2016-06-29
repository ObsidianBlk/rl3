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


  var FS = require('fs'); // Mixing NODEJS in... this won't have any reparcussions.
  var Path = require('path');
  

  // (G)lyph (E)ncoded (P)icture Editor State
  function GEPEditorState(terminal, keyboard, fsm, setActive){
    if (!(terminal instanceof Terminal)){
      throw new TypeError("Argument <terminal> expected to be a Terminal instance.");
    }
    if (!(keyboard instanceof Keyboard)){
      throw new TypeError("Argument <keyboard> expected to be a Keyboard instance.");
    }

    var gep = null;
    var cur = null;
    
    var ctrlPalette = new PalControl(keyboard);
    var ctrlGlyph = new GlyphControl(terminal, keyboard);
    var ctrlEditor = new EditorControl(keyboard);
    var ctrlTerminal = new TerminalControl(keyboard);

    var focus = false;
    var redrawFrame = true;

    function onRenderResize(newres, oldres){
      if (ctrlEditor.cursor !== null){
	ctrlEditor.cursor.region = {
	  left: 0,
	  right: newres[0] - 1,
	  top: 0,
	  bottom: newres[1] - 4
	};
      }

      if (ctrlPalette.cursor !== null){
	ctrlPalette.cursor.region = {
	  left: 0,
	  right: 18,
	  top: 0,
	  bottom: 17
	};
      }

      if (ctrlGlyph.cursor !== null){
	ctrlGlyph.cursor.region = {
	  left: newres[0] - 18,
	  right: newres[0] - 1,
	  top: 0,
	  bottom: 17
	};
      }

      if (ctrlTerminal.cursor !== null){
	ctrlTerminal.cursor.region = {
	  left: 0,
	  right: newres[0] - 1,
	  top: newres[1] - 3,
	  bottom: newres[1] - 1
	};
      }

      redrawFrame = true;
    };

    function OnPaletteChange(){
      ctrlEditor.forceRerender();
      // TODO: Force Editor to redraw
    }


    function onKeyDown(code){
      if (Keyboard.CodeSameAsName(code, "escape") === true){
        if (ctrlGlyph.active === true || ctrlPalette.active === true || ctrlTerminal.active === true){
          ctrlEditor.activate(true);
        } else {
          fsm.activateState("MainMenuState");
        }

      } else if (Keyboard.CodeSameAsName(code, "grave") === true){
	if (keyboard.activeCombo("ctrl+`") === true){
	  ctrlTerminal.activate(true);
	}

	// Terminal trumps all over inputs...
      } else if (ctrlTerminal.active === false){
        if (Keyboard.CodeSameAsName(code, "g") === true){
          ctrlGlyph.activate(true);
        } else if (Keyboard.CodeSameAsName(code, "p") === true){
          ctrlPalette.activate(true);
        }
      }
    };

    function onCtrlTildaCombo(){
      //ctrlTerminal.activate(true);
    };


    this.enter = function(){
      gep = new GlyphEncodedPicture();
      //framecursor = new Cursor(terminal);

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
      ctrlTerminal.on("saveGEP", function(cmd){
        var p = Path.resolve(cmd);
        console.log(p);
        FS.access(p, FS.R_OK | FS.W_OK, function(err){
          if (err && err.code !== "ENOENT") {
            ctrlTerminal.displayError(err.toString());
            console.log(err);
            console.error("ERROR Saving GEP File \"" + cmd + "\".");
            return;
          }
          FS.writeFile(p, gep.toString(true), function(err){
            if (err){
              ctrlTerminal.displayError("ERROR Writing out GEP File \"" + cmd + "\".");
              console.error(err);
              console.error("ERROR Writing out GEP File \"" + cmd + "\".");
              return;
            }
            ctrlTerminal.displayMessage("Saved GEP file to \"" + cmd + "\".");
            console.log("Saved GEP file to \"" + cmd + "\".");
          });
        });
      });
    };

    this.getFocus = function(){
      terminal.on("renderResize", onRenderResize);
      onRenderResize([terminal.columns, terminal.rows], null);
      keyboard.on("keydown", onKeyDown);
      keyboard.onCombo("ctrl+`", {on:onCtrlTildaCombo});
      ctrlEditor.activate(true);
      cur = new Cursor(terminal);
      cur.clear();
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
      //framecursor = null;

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
	/*if (redrawFrame === true){
	  redrawFrame = false;
	  RenderFrame(framecursor);
	}*/
        
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
