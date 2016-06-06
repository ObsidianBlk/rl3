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
	root.States.GEPEditor.EditorControl
      );
    }
  }
})(this, function (FSM, Color, Terminal, Cursor, Keyboard, GlyphEncodedPicture, PalControl, EditorControl) {



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

    var activeScreen = 1; // 0 = palette select | 1 = image painter | 2 = glyph select | 3 = terminal input (only accessible via CTRL+~ combo)

    var activeGlyph = 0;

    var ctrlPalette = new PalControl(keyboard);
    var ctrlEditor = new EditorControl(keyboard);

    var termcmd = null;
    var termmsg = null;
    var termwarning = null;
    var termerror = null;

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

    function ActiveScreen(screen){
      if (typeof(screen) === 'number'){
	if (screen >= 0 && screen < 3){
	  activeScreen = Math.floor(screen);
	  switch (activeScreen){
	    case 0:
	    ctrlEditor.activate(false);
	    ctrlPalette.activate(true); break;
	    case 1:
	    ctrlPalette.activate(false);
	    ctrlEditor.activate(true); break;
	  }; 
	} else if (activeScreen === 3){
	  ctrlPalette.activate(false);
	  ctrlEditor.activate(false);
	}
      }
      return activeScreen;
    }


    function processTerminalCommand(cmd){
      var args = null;
      var index = null;
      var r = 0;
      var g = 0;
      var b = 0;
      
      cmd = cmd.split(":");
      if (cmd.length === 1){
        switch(cmd[0]){
        case "\\i":
          termmsg = "Columns: " + gep.width.toString() + " | rows: " + gep.height.toString();
          break;
	case "\\pal16":
	  if (ctrlPalette.processGet16BitPaletteCMD() === true){
	    if (gep !== null){
	      gep.storePalette(ctrlPalette.palette);
	    }
	  }
        }
      } else if (cmd.length === 2){
        switch(cmd[0]){
        case "\\fg":
          ctrlPalette.processSwitchColorCMD(cmd[1], true);
          break;

        case "\\bg":
          ctrlPalette.processSwitchColorCMD(cmd[1]);
          break;
	case "\\pal16":
	  if (ctrlPalette.processGet16BitPaletteCMD(cmd[1]) === true){
	    if (gep !== null){
	      gep.storePalette(ctrlPalette.palette);
	    }
	  }
	  redrawPalette = true;
	  redrawImage = true;
	  break;
        }
      } else {
        termwarning = "Command not recognized.";
      }
    };

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
	  left: 3,
	  right: newres[0] - 4,
	  top: 1,
	  bottom: newres[1] - 4
	};
      }

      if (ctrlPalette.cursor !== null){
	ctrlPalette.cursor.region = {
	  left: 1,
	  right: 2,
	  top: 1,
	  bottom: newres[1] - 4
	};
      }

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

    function renderGlyphs(cur, index){
      var rows = cur.rows;
      var midrow = Math.floor(rows*0.5);
      var length = terminal.glyph.elements;
      if (index < 0 || index >= terminal.glyph.elements){return;} // Invalid data. Do nothing.

      var goffset = 0;
      if (index > midrow && index < length - midrow){
        goffset = index - midrow;
      } else if (length > midrow && index > length-midrow){
        goffset = length - rows;
      }

      for (var r=0; r < rows; r++){
        var gindex = r + goffset;
        if (gindex >= length){break;}
        
        cur.c = 0;
        cur.r = r;

        if (gindex === index){
          cur.set(gindex, Cursor.WRAP_TYPE_NOWRAP, {background:"#FFFF00"});
        } else {
          cur.set(gindex, Cursor.WRAP_TYPE_NOWRAP, {background:null});
        }
      }
    };


    function onKeyDown(code){
      if (Keyboard.CodeSameAsName(code, "escape") === true){
        if (termcmd === null){
	  fsm.activateState("MainMenuState");
        } else {
	  ActiveScreen(1);
          termcmd = null;
          termmsg = null;
          termerror = null;
          termwarning = null;
          redrawUI = true;
        }

	// Terminal trumps all over inputs...
      } else if (activeScreen === 3){ // Special case for Terminal.
        if (Keyboard.CodeSameAsName(code, "backspace") === true && termcmd !== null && termcmd !== ""){
          termcmd = termcmd.substr(0, termcmd.length-1);
          redrawUI = true;
        }

	// Check rest of input...
      } else {
	if (Keyboard.CodeSameAsName(code, "tab") === true){
	  activeScreen += 1;
	  if (activeScreen === 3){
	    activeScreen = 0;
	  }
	  ActiveScreen(activeScreen);
	} else if (keyboard.activeCombo("shift+tab") === true){
	  activeScreen -= 1;
	  if (activeScreen < 0){
	    activeScreen = 2;
	  }
	  ActiveScreen(activeScreen);
	}
      }
    };

    function onPrintableChar(ch){
      if (activeScreen === 3 && termcmd !== null){
	if (ch !== "\t"){
          var finish = (ch === "\r" || ch === "\n");
          if (finish === false){
            termcmd += ch;
          } else {
            processTerminalCommand(termcmd);
            termcmd = "";
          }
          redrawUI = true;
	}
      }
    };

    function onCtrlTildaCombo(){
      termcmd = "";
      ActiveScreen(3);
      redrawUI = true;
    };


    this.enter = function(){
      framecursor = new Cursor(terminal);
      ctrlEditor.cursor = new Cursor(terminal);
      ctrlPalette.cursor = new Cursor(terminal);
      glyphcursor = new Cursor(terminal);
      uicursor = new Cursor(terminal);
    };

    this.getFocus = function(){
      terminal.on("renderResize", onRenderResize);
      onRenderResize([terminal.columns, terminal.rows], null);
      if (gep === null){
	gep = new GlyphEncodedPicture();
        if (ctrlPalette.palette.length > 0){
          gep.storePalette(ctrlPalette.palette);
        }
      }
      keyboard.on("keydown", onKeyDown);
      keyboard.on("printcode", onPrintableChar);
      keyboard.onCombo("ctrl+`", {on:onCtrlTildaCombo});
      focus = true;
    };

    this.looseFocus = function(){
      terminal.unlisten("renderResize", onRenderResize);
      keyboard.unlisten("keydown", onKeyDown);
      keyboard.unlisten("printcode", onPrintableChar);
      keyboard.unlistenCombo("ctrl+`", {on:onCtrlTildaCombo});
      focus = false;
    };

    this.exit = function(){
      framecursor = null;
      ctrlEditor.cursor = null;
      ctrlPalette.cursor =  null;
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

        if (ctrlPalette.dirty === true || redrawPalette === true){
          redrawPalette = false;
          ctrlPalette.render();
        }

	if (ctrlEditor.dirty === true || redrawImage === true){
	  redrawImage = false;
	  ctrlEditor.render();
	}

        if (redrawUI === true){
	  var activeFG = ctrlPalette.foreground;
	  var activeBG = ctrlPalette.background;
          redrawUI = false;
          uicursor.clear();
          uicursor.c = 0;
          uicursor.set(activeGlyph, Cursor.WRAP_TYPE_NOWRAP, {
            foreground: (activeFG !== null) ? activeFG.hex : null,
            background: (activeBG !== null) ? activeBG.hex : null
          });

          uicursor.c = 2;
          if (termcmd !== null && termerror === null && termwarning === null && termmsg === null){
            uicursor.textOut("Terminal: ");
            uicursor.textOut(termcmd, {foreground:"#FFFF00"});
          } else if (termerror !== null){
            uicursor.textOut("ERROR: ", {background:"#FF0000"});
            uicursor.textOut(termerror, {foreground:"#FFFF00", background:"#FF0000"});
          } else if (termwarning !== null){
            uicursor.textOut("WARNING: ", {background:"#AAAA00"});
            uicursor.textOut(termwarning, {foreground:"#000000", background:"#AAAA00"});
          } else if (termmsg !== null){
            uicursor.textOut("MESSAGE: ", {foreground:"#0000FF"});
            uicursor.textOut(termmsg, {foreground:"#0000FF", background:"#00FFFF"});
          }
        }

	if (redrawGlyphs === true){
	  redrawGlyphs = false;
	  renderGlyphs(glyphcursor, activeGlyph);
	}
      }
    };


    FSM.State.call(this, "GEPEditorState", fsm, setActive);
  };
  GEPEditorState.prototype.__proto__ = FSM.State.prototype;
  GEPEditorState.prototype.constructor = GEPEditorState;

  return GEPEditorState;

});
