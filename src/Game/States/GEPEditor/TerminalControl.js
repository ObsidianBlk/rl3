(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Emitter',
      'src/R/Graphics/Color',
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
        require('src/R/System/Emitter'),
        require('src/R/Graphics/Color'),
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
    if (typeof(root.States.GEPEditor) === 'undefined'){
      root.States.GEPEditor = {};
    }

    if (typeof(root.States.GEPEditor.PalControl) === 'undefined'){
      root.States.GEPEditor.PalControl = factory(
        root.R.System.Emitter,
        root.R.Graphics.Color,
	root.R.Graphics.Terminal,
	root.R.Graphics.Cursor,
	root.R.Input.Keyboard
      );
    }
  }
})(this, function (Emitter, Color, Terminal, Cursor, Keyboard) {

  function TerminalControl(keyboard){
    Emitter.call(this);
    var cur = null;
    var active = false;
    var dirty = true;

    var cmd = "";
    var error = null;
    var warning = null;
    var msg = null;

    function OnRegionResize(region){dirty = true;}

    Object.defineProperties(this, {
      "dirty":{get:function(){return dirty;}},
      "active":{get:function(){return active;}},
      "cursor":{
	get:function(){return cur;},
	set:function(c){
	  if (c === null || c instanceof Cursor){
	    if (cur !== c){
              if (cur !== null){
                cur.unlisten("regionresize", OnRegionResize);
              }

              cur = c;

              if (cur !== null){
                cur.on("regionresize", OnRegionResize);
                cur.clear();
              }
	      dirty = true;
	    }
	  }
	}
      }
    });


    var ProcessTerminalCommand = (function(){
      var args = null;
      var index = null;
      
      cmd = cmd.split(":");
      if (cmd.length === 1){
        switch(cmd[0]){
	case "\\pal16":
	  this.emit("setpalette16", "0");
	  break;
	case "\\gl":
	  this.emit("requestinfo", "glyph");
	  break;
        }
      } else if (cmd.length === 2){
        switch(cmd[0]){
        case "\\fg":
	  this.emit("switchpalettecolor", cmd[1], true);
          //ctrlPalette.processSwitchColorCMD(cmd[1], true);
          break;

        case "\\bg":
	  this.emit("switchpalettecolor", cmd[1], false);
          //ctrlPalette.processSwitchColorCMD(cmd[1]);
          break;
	case "\\pal16":
	  this.emit("setpalette16", cmd[1]);
	  break;
	case "\\gl":
	  index = parseInt(cmd[1]);
	  if (Number.isNaN(index) === true){
	    error = "Invalid argument value.";
	  }  else {
	    this.emit("switchglyphindex", index);
	  }
        }
      } else {
        warning = "Command not recognized.";
      }
    }).bind(this);


    function OnKeyDown(code){
      if (Keyboard.CodeSameAsName(code, "backspace") === true && cmd !== ""){
        cmd = cmd.substr(0, cmd.length-1);
        dirty = true;
      }
    }

    function OnPrintable(ch){
      msg = null;
      error = null;
      warning = null;
      if (ch !== "\t"){
        var finish = (ch === "\r" || ch === "\n");
        if (finish === false){
          cmd += ch;
        } else {
          ProcessTerminalCommand();
          cmd = "";
        }
        dirty = true;
      }
    }

    this.displayWarning = function(wmsg){
      warning = wmsg;
      dirty = true;
    };

    this.displayError = function(emsg){
      error = emsg;
      dirty = true;
    };

    this.displayMessage = function(m){
      msg = m;
      dirty = true;
    };

    this.activate = function(enable){
      enable = (enable === false) ? false : true;
      if (enable === active){return;}
      
      active = enable;
      if (active === true){
	this.emit("activating");
	keyboard.on("keydown", OnKeyDown);
	keyboard.on("printcode", OnPrintable);
      } else {
	keyboard.unlisten("keydown", OnKeyDown);
	keyboard.unlisten("printcode", OnPrintable);
      }
    };


    function ToPixCode(g, f, b){
      var pad = function(size, val){
	var s = "000000000" + val.toString();
	return s.substr(s.length-size);
      };

      var pix = pad(3, g) + ":";
      pix += ((f === null) ? "---" : pad(3, f)) + ":";
      pix += ((b === null) ? "---" : pad(3, b));
      return pix;
    }

    function RenderFrame(){
      cur.c = 0;
      cur.r = 0;
      // Upper Left
      cur.set(parseInt("DA", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
      cur.c = cur.columns-1;
      cur.r = 0;
      // Upper Right
      cur.set(parseInt("BF", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
      cur.c = 0;
      cur.r = cur.rows-1;
      // Lower Left
      cur.set(parseInt("C0", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
      cur.c = cur.columns - 1;
      cur.r = cur.rows - 1;
      // Lower Right
      cur.set(parseInt("D9", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});

      for (var r=0; r < cur.rows; r++){
        cur.r = r;
        if (r === 0 || r === cur.rows-1){
          cur.c = 1;
          for (var c=0; c < cur.columns-2; c++){
            cur.set(parseInt("C4", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
          }
        } else {
          cur.c = 0;
          cur.set(parseInt("B3", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
          cur.c = cur.columns-1;
          cur.set(parseInt("B3", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
        }
      }
    }


    this.render = function(gep){
      if (cur === null){return;}
      dirty = false;

      var glyphIndex = gep.glyphIndex;
      var fg = gep.foreground;
      var bg = gep.background;
      var fgi = gep.foregroundIndex;
      var bgi = gep.backgroundIndex;

      cur.clear();
      RenderFrame();

      cur.r = 1;
      cur.c = cur.columns - 16;
      cur.set(glyphIndex, Cursor.WRAP_TYPE_NOWRAP, {
        foreground: (fg !== null) ? fg.hex : null,
        background: (bg !== null) ? bg.hex : null
      });
      cur.textOut(" | ", {forground:null, background:null});
      cur.textOut(ToPixCode(glyphIndex, fgi, bgi), {foreground:null, background:null});

      cur.r = 1;
      cur.c = 1;
      if (error === null && warning === null && msg === null){
	if (active === true){
          cur.textOut("Terminal: ");
          cur.textOut(cmd, {foreground:"#FFFF00"});
	}
      } else if (error !== null){
        cur.textOut("ERROR: ", {background:"#FF0000"});
        cur.textOut(error, {foreground:"#FFFF00", background:"#FF0000"});
      } else if (warning !== null){
        cur.textOut("WARNING: ", {background:"#AAAA00"});
        cur.textOut(warning, {foreground:"#000000", background:"#AAAA00"});
      } else if (msg !== null){
        cur.textOut("MESSAGE: ", {foreground:"#0000FF"});
        cur.textOut(msg, {foreground:"#0000FF", background:"#00FFFF"});
      }
    };
  }
  TerminalControl.prototype.__proto__ = Emitter.prototype;
  TerminalControl.prototype.constructor = TerminalControl;

  return TerminalControl;
});
