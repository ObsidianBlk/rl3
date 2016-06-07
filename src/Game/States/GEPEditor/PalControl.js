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
      'src/R/Input/Keyboard',
      'src/R/Graphics/GlyphEncodedPicture'
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
    if (typeof(root.States.GEPEditor) === 'undefined'){
      root.States.GEPEditor = {};
    }

    if (typeof(root.States.GEPEditor.PalControl) === 'undefined'){
      root.States.GEPEditor.PalControl = factory(
        root.R.System.Emitter,
        root.R.Graphics.Color,
	root.R.Graphics.Terminal,
	root.R.Graphics.Cursor,
	root.R.Input.Keyboard,
	root.R.Graphics.GlyphEncodedPicture
      );
    }
  }
})(this, function (Emitter, Color, Terminal, Cursor, Keyboard, GlyphEncodedPicture) {


  function TermPalette(id){
    if (typeof(id) !== 'number'){
      id = 0;
    } else if (id < 0 || id > 5){
      id = 0;
    }

    if (id === 1){ // Windows XP terminal
      return [
	new Color({r:0, g:0, b:0}),
	new Color({r:128, g:0, b:0}),
	new Color({r:0, g:128, b:0}),
	new Color({r:128, g:128, b:0}),
	new Color({r:0, g:0, b:128}),
	new Color({r:128, g:0, b:128}),
	new Color({r:0, g:128, b:128}),
	new Color({r:192, g:192, b:192}),
	new Color({r:128, g:128, b:128}),
	new Color({r:255, g:0, b:0}),
	new Color({r:0, g:255, b:0}),
	new Color({r:255, g:255, b:0}),
	new Color({r:0, g:0, b:255}),
	new Color({r:255, g:0, b:255}),
	new Color({r:0, g:255, b:255}),
	new Color({r:255, g:255, b:255}),
      ];
    } else if (id === 2){ // Terminal.app
      return [
	new Color({r:0, g:0, b:0}),
	new Color({r:194, g:54, b:33}),
	new Color({r:37, g:188, b:36}),
	new Color({r:173, g:173, b:39}),
	new Color({r:73, g:46, b:225}),
	new Color({r:211, g:56, b:211}),
	new Color({r:51, g:187, b:200}),
	new Color({r:203, g:204, b:205}),
	new Color({r:129, g:131, b:131}),
	new Color({r:252, g:57, b:31}),
	new Color({r:49, g:231, b:34}),
	new Color({r:234, g:236, b:35}),
	new Color({r:88, g:51, b:255}),
	new Color({r:249, g:53, b:248}),
	new Color({r:20, g:240, b:240}),
	new Color({r:233, g:235, b:235}),
      ];
    } else if (id === 3){ // PuTTY
      return [
	new Color({r:0, g:0, b:0}),
	new Color({r:187, g:0, b:0}),
	new Color({r:0, g:187, b:0}),
	new Color({r:187, g:187, b:0}),
	new Color({r:0, g:0, b:187}),
	new Color({r:187, g:0, b:187}),
	new Color({r:0, g:187, b:187}),
	new Color({r:187, g:187, b:187}),
	new Color({r:85, g:85, b:85}),
	new Color({r:255, g:85, b:85}),
	new Color({r:85, g:255, b:85}),
	new Color({r:255, g:255, b:85}),
	new Color({r:85, g:85, b:255}),
	new Color({r:255, g:85, b:255}),
	new Color({r:85, g:255, b:255}),
	new Color({r:255, g:255, b:255}),
      ];
    } else if (id === 4){ // mIRC
      return [
	new Color({r:0, g:0, b:0}),
	new Color({r:127, g:0, b:0}),
	new Color({r:0, g:147, b:0}),
	new Color({r:252, g:127, b:0}),
	new Color({r:0, g:0, b:127}),
	new Color({r:156, g:0, b:156}),
	new Color({r:0, g:147, b:147}),
	new Color({r:210, g:210, b:210}),
	new Color({r:127, g:127, b:127}),
	new Color({r:255, g:0, b:0}),
	new Color({r:0, g:252, b:0}),
	new Color({r:255, g:255, b:0}),
	new Color({r:0, g:0, b:252}),
	new Color({r:255, g:0, b:255}),
	new Color({r:0, g:255, b:255}),
	new Color({r:255, g:255, b:255}),
      ];
    } else if (id === 5){ // XTerm
      return [
	new Color({r:0, g:0, b:0}),
	new Color({r:205, g:0, b:0}),
	new Color({r:0, g:205, b:0}),
	new Color({r:205, g:205, b:0}),
	new Color({r:0, g:0, b:238}),
	new Color({r:205, g:0, b:205}),
	new Color({r:0, g:205, b:205}),
	new Color({r:229, g:229, b:299}),
	new Color({r:127, g:127, b:127}),
	new Color({r:255, g:0, b:0}),
	new Color({r:0, g:255, b:0}),
	new Color({r:255, g:255, b:0}),
	new Color({r:92, g:92, b:255}),
	new Color({r:255, g:0, b:255}),
	new Color({r:0, g:255, b:255}),
	new Color({r:255, g:255, b:255}),
      ];
    }

    // Standard VGA Colors.
    return [
      new Color({r:0, g:0, b:0}),
      new Color({r:170, g:0, b:0}),
      new Color({r:0, g:170, b:0}),
      new Color({r:170, g:85, b:0}),
      new Color({r:0, g:0, b:170}),
      new Color({r:170, g:0, b:170}),
      new Color({r:0, g:170, b:170}),
      new Color({r:170, g:170, b:170}),
      new Color({r:85, g:85, b:85}),
      new Color({r:255, g:85, b:85}),
      new Color({r:85, g:255, b:85}),
      new Color({r:255, g:255, b:85}),
      new Color({r:85, g:85, b:255}),
      new Color({r:255, g:85, b:255}),
      new Color({r:85, g:255, b:255}),
      new Color({r:255, g:255, b:255}),
    ];
  };




  function PalControl(keyboard){
    Emitter.call(this);
    var cur = null;
    var palette = [];

    var active = false;
    var dirty = true;

    var activeFG = null;
    var activeBG = null;

    var palctrl = 0;

    var cmdError = null;
    var cmdWarning = null;

    function OnRegionResize(region){dirty = true;}

    Object.defineProperties(this, {
      "dirty":{
	get:function(){return dirty;}
      },

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
              }
	      dirty = true;
	    }
	  }
	}
      },
      
      "palette":{
	get:function(){return palette;}
      },

      "active":{
	get:function(){return active;}
      },

      "background":{
	get:function(){
	  return (activeBG !== null) ? palette[activeBG] : null;
	}
      },
      "backgroundIndex":{get:function(){return activeBG;}},

      "foreground":{
	get:function(){
	  return (activeFG !== null) ? palette[activeFG] : null;
	}
      },
      "foregroundIndex":{get:function(){return activeFG;}}
    });


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


    function RenderPalCol(col, index){
      if (cur === null){return;}
      var rows = cur.rows-2;
      var midrow = Math.floor((rows-2)*0.5);
      if (col < 0 || col >= cur.columns){return;} // Invalid data. Do nothing.

      // Render the standard information.
      if (col === 0){
        cur.c = 1;
        cur.r = 0;
        if (index === null){
          cur.set("F".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {foreground:"#FFFF00"});
        } else {
          cur.set("F".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {foreground:null});
        }
      } else if (col === 1){
        cur.c = 2;
        cur.r = 0;
        if (index === null){
          cur.set("B".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {foreground:"#FFFF00"});
        } else {
          cur.set("B".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {foreground:null});
        }
      }

      cur.c = col+1;
      cur.r = 1;
      if (active === true && palctrl === col){
	if (index === null){
	  cur.set(parseInt("1E", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:"#FFFF00"});
	} else {
	  cur.set(parseInt("1F", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:"#FFFF00"});
	}
      } else {
	cur.set("-".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {foreground:null});
      }


      if (index !== null && (index < 0 || index >= palette.length)){return;} // Invalid data. Do nothing.

      var paloffset = 0;
      if (index !== null){
        if (index > midrow && index < palette.length - midrow){
          paloffset = index - midrow;
        } else if (palette.length > midrow && index >= palette.length-midrow){
          paloffset = palette.length - (rows-2);
        }
      }

      if (palette.length > 0){
        for (var r=0; r < (rows-2); r++){
          var pindex = r + paloffset;
          if (pindex >= palette.length){break;}

          if (pindex === index){
	    if (col === 0){
	      cur.r = r + 2;
	      cur.c = 0;
              cur.set(16, Cursor.WRAP_TYPE_NOWRAP, (active===true) ? {foreground:"#FFFF00"} : {foreground:null});
	    } else if (col === 1){
	      cur.r = r + 2;
	      cur.c = 3;
	      cur.set(17, Cursor.WRAP_TYPE_NOWRAP, (active===true) ? {foreground:"#FFFF00"} : {foreground:null});
	    }
          } else {
	    cur.r = r + 2;
	    cur.c = (col === 0) ? 0 : 3;;
	    cur.set(" ".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
	  }
	  cur.r = r + 2;
	  cur.c = (col === 0) ? 1 : 2;
          cur.set(" ".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {background:palette[pindex].hex});
        }
      }
    };


    var OnKeyDown = (function(code){
      if (Keyboard.CodeSameAsName(code, "up") === true){
	if (palctrl === 0){
	  if (activeFG !== null){
	    if (activeFG === 0){
	      activeFG = null;
	      this.emit("fgchange");
	      dirty = true;
	    } else {
	      activeFG -= 1;
	      this.emit("fgchange");
	      dirty = true;
	    }
	  }
	} else {
	  if (activeBG !== null){
	    if (activeBG === 0){
	      activeBG = null;
	      this.emit("bgchange");
	      dirty = true;
	    } else {
	      activeBG -= 1;
	      this.emit("bgchange");
	      dirty = true;
	    }
	  }
	}
      } else if (Keyboard.CodeSameAsName(code, "down") === true){
	if (palette.length <= 0){return;} // Nothing to do without a palette :p
	if (palctrl === 0){
	  if (activeFG === null){
	    activeFG = 0;
	    this.emit("fgchange");
	    dirty = true;
	  } else if (activeFG < palette.length - 1){
	    activeFG += 1;
	    this.emit("fgchange");
	    dirty = true;
	  }
	} else {
	  if (activeBG === null){
	    activeBG = 0;
	    this.emit("bgchange");
	    dirty = true;
	  } else if (activeBG < palette.length - 1){
	    activeBG += 1;
	    this.emit("bgchange");
	    dirty = true;
	  }
	}
      } else if (Keyboard.CodeSameAsName(code, "left") === true){
	if (palctrl > 0){
	  palctrl -= 1;
	  dirty = true;
	}
      } else if (Keyboard.CodeSameAsName(code, "right") === true){
	if (palctrl === 0){
	  palctrl = 1;
	  dirty = true;
	}
      }
    }).bind(this);




    this.activate = function(enable){
      enable = (enable === false) ? false : true;
      if (active === enable){return;} // Do nothing if we're not changing active state.

      active = enable;
      if (active === true){
	this.emit("activating");
	keyboard.on("keydown", OnKeyDown);
      } else {
	keyboard.unlisten("keydown", OnKeyDown);
      }
      dirty = true;
    };


    this.processGet16BitPaletteCMD = function(arg){
      if (typeof(arg) === 'undefined'){
	palette = TermPalette(0);
      } else {
	if (arg === "vga" || arg === "0"){
	  palette = TermPalette(0);
	} else if (arg === 'windows' || arg === "1"){
	  palette = TermPalette(1);
	} else if (arg === 'terminal' || arg === "2"){
	  palette = TermPalette(2);
	} else if (arg === 'putty' || arg === "3"){
	  palette = TermPalette(3);
	} else if (arg === 'mirc' || arg === "4"){
	  palette = TermPalette(4);
	} else if (arg === 'xterm' || arg === "5"){
	  palette = TermPalette(5);
	} else {
	  cmdWarning = "16Color Palette '" + arg + "' unknown.";
	  return false;
	}
      }
      dirty = true;
      this.emit("palettechange");
      return true;
    };

    this.processSwitchColorCMD = function(args, fg){
      fg = (fg === true) ? true : false;
      var index = null;
      cmdError = null;
      cmdWarning = null;

      var palsize = palette.length;
      args = args.split(",");
      if (args.length === 1){
        args[0] = args[0].trim();
        if (args[0].startsWith("#") && args[0].length === 7){
          index = paletteIndexFromColor(new Color(args[0]));
        } else {
          index = parseInt(args[0]);
          if (Number.isNaN(index)){
            cmdError = "Command argument invalid.";
          }
        }
      } else if (args.length === 3){
        var r = parseInt(args[0].trim());
        var g = parseInt(args[1].trim());
        var b = parseInt(args[2].trim());
        if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)){
          cmdError = "Command arguments invalid.";
        } else {
          if (r > 255 || g > 255 || b > 255){
            cmdError = "Value out of bounds.";
          } else {
            index = paletteIndexFromColor(new Color({r:r, g:g, b:b}));
          }
        }
      }

      if (palette.length !== palsize){
        this.emit("palettechange");
      }
      
      if (cmdError === null && cmdWarning === null){
        if (index < 0){
          dirty = true;
          if (fg === true){
            activeFG = null;
            this.emit("fgchange");
          } else {
            activeBG = null;
            this.emit("bgchange");
          }
          return true;
        } else if (index < palette.length){
          if (fg === true){
            activeFG = index;
            this.emit("fgchange");
          } else {
            activeBG = index;
            this.emit("bgchange");
          }
	  dirty = true;
          return true;
        } else {
          cmdError = "Index out of bounds.";
        }
      }
      return false;
    };


    this.render = function(){
      if (cur === null || dirty === false){return;}
      dirty = false;
      RenderPalCol(0, activeFG);
      RenderPalCol(1, activeBG);
    };
  };
  PalControl.prototype.__proto__ = Emitter.prototype;
  PalControl.prototype.constructor = PalControl;


  return PalControl;
});


