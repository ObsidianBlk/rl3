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
      'src/R/Graphics/GlyphEncodedPicture'
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
        root.R.Graphics.Color,
	root.R.Graphics.Terminal,
	root.R.Graphics.Cursor,
	root.R.Input.Keyboard,
	root.R.Graphics.GlyphEncodedPicture
      );
    }
  }
})(this, function (FSM, Color, Terminal, Cursor, Keyboard, GlyphEncodedPicture) {

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

    var palette = [];

    var activeScreen = 1; // 0 = palette select | 1 = image painter | 2 = glyph select | 3 = terminal input (only accessible via CTRL+~ combo)

    var activeGlyph = 0;
    var activeFG = null;
    var activeBG = null;

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

    function paletteIndexFromColor(color){
      for (var i=0; i < palette.length; i++){
        if (palette[i].eq(color) === true){
          return i;
        }
      }
      if (palette.length < 256){
        palette.push(color);
        return palette.length - 1;
      }
      return -1;
    };

    function PaletteCMD(args, fg){
      fg = (fg === true) ? true : false;
      var index = null;
      var r = 0;
      var g = 0;
      var b = 0;

      args = args.split(",");
      if (args.length === 1){
        args[0] = args[0].trim();
        if (args[0].startsWith("#") && args[0].length === 7){
          index = paletteIndexFromColor(new Color(args[0]));
          if (index < 0){
            termerror = "Palette at max size.";
          } else {
            if (fg === true){
              activeFG = index;
            } else {
              activeBG = index;
            }
            redrawPalette = true;
          }
        } else {
          index = parseInt(args[0]);
          if (Number.isNaN(index)){
            termerror = "Command argument invalid.";
          } else {
            if (index < 0){
              if (fg === true){
                activeFG = null;
              } else {
                activeBG = null;
              }
              redrawPalette = true;
            } else if (index < palette.length){
              if (fg === true){
                activeFG = index;
              } else {
                activeBG = true;
              }
              redrawPalette = true;
            } else {
              termerror = "Index out of bounds.";
            }
          }
        }
      } else if (args.length === 3){
        r = parseInt(args[0].trim());
        g = parseInt(args[1].trim());
        b = parseInt(args[2].trim());
        if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)){
          termerror = "Command arguments invalid.";
        } else {
          if (r > 255 || g > 255 || b > 255){
            termerror = "Value out of bounds.";
          } else {
            index = paletteIndexFromColor(new Color({r:r, g:g, b:b}));
            if (index < 0){
              termerror = "Palette at max size.";
            } else {
              if (fg === true){
                activeFG = index;
              } else {
                activeBG = index;
              }
              redrawPalette = true;
            }
          }
        }
      }
    };

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
        }
      } else if (cmd.length === 2){
        switch(cmd[0]){
        case "\\fg":
          PaletteCMD(cmd[1], true);
          break;

        case "\\bg":
          PaletteCMD(cmd[1]);
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

    function RenderPalette(cur, col, index){
      var rows = cur.rows-2;
      var midrow = Math.floor((rows-2)*0.5);
      if (col < 0 || col >= cur.columns){return;} // Invalid data. Do nothing.

      // Render the standard information.
      if (col === 0){
        cur.c = 0;
        cur.r = 0;
        if (index === null){
          cur.set("F".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {foreground:"#FFFF00"});
        } else {
          cur.set("F".charCodeAt(0));
        }
      } else if (col === 1){
        cur.c = 1;
        cur.r = 0;
        if (index === null){
          cur.set("B".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {foreground:"#FFFF00"});
        } else {
          cur.set("B".charCodeAt(0));
        }
      }
      cur.c = col;
      cur.r = 1;
      cur.set("-".charCodeAt(0));


      if (index !== null && (index < 0 || index >= palette.length)){return;} // Invalid data. Do nothing.

      var paloffset = 0;
      if (index !== null){
        if (index > midrow && index < palette.length - midrow){
          paloffset = index - midrow;
        } else if (palette.length > midrow && index > palette.length-midrow){
          paloffset = palette.length - (rows-2);
        }
      }

      if (palette.length > 0){
        for (var r=0; r < (rows-2); r++){
          var pindex = r + paloffset;
          if (pindex >= palette.length){break;}
          
          cur.c = col;
          cur.r = r + 2;

          if (pindex === index){
            cur.set(9, Cursor.WRAP_TYPE_NOWRAP, {foreground:"#FFFF00", background:palette[pindex].hex});
          } else {
            cur.set(" ".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {background:palette[pindex].hex});
          }
        }
      }
    };


    function onKeyDown(code){
      if (Keyboard.CodeSameAsName(code, "escape") === true){
        if (termcmd === null){
	  fsm.activateState("MainMenuState");
        } else {
          termcmd = null;
          termmsg = null;
          termerror = null;
          termwarning = null;
          activeScreen = 1;
          redrawUI = true;
        }
      } else if (activeScreen === 3){ // Special case for Terminal.
        if (Keyboard.CodeSameAsName(code, "backspace") === true && termcmd !== null && termcmd !== ""){
          termcmd = termcmd.substr(0, termcmd.length-1);
          redrawUI = true;
        }
      } else if (activeScreen === 0){ // Handle Palette selection

      } else if (activeScreen === 2){ // Handle Glyph selection

      } else if (activeScreen === 1){ // Handle drawing

      }
    };

    function onPrintableChar(ch){
      if (activeScreen === 3 && termcmd !== null){
        var finish = (ch === "\r" || ch === "\n");
        if (ch !== "\t" && finish === false){
          termcmd += ch;
        } else if (finish){
          processTerminalCommand(termcmd);
          termcmd = "";
        }
        redrawUI = true;
      }
    };

    function onCtrlTildaCombo(){
      termcmd = "";
      activeScreen = 3;
      redrawUI = true;
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
        if (palette.length > 0){
          gep.storePalette(palette);
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
        if (redrawPalette === true){
          redrawPalette = false;
          RenderPalette(palcursor, 0, activeFG);
          RenderPalette(palcursor, 1, activeBG);
        }
        if (redrawUI === true){
          redrawUI = false;
          uicursor.clear();
          uicursor.c = 0;
          uicursor.set(activeGlyph, Cursor.WRAP_TYPE_NOWRAP, {
            foreground: (activeFG !== null) ? palette[activeFG].hex : null,
            background: (activeBG !== null) ? palette[activeBG].hex : null
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
      }
    };


    FSM.State.call(this, "GEPEditorState", fsm, setActive);
  };
  GEPEditorState.prototype.__proto__ = FSM.State.prototype;
  GEPEditorState.prototype.constructor = GEPEditorState;

  return GEPEditorState;

});
