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

    if (typeof(root.States.GEPEditor.EditorControl) === 'undefined'){
      root.States.GEPEditor.EditorControl = factory(
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

  function EditorControl(keyboard){
    Emitter.call(this);
    
    var cur = null;
    var gep = null;
    var active = false;
    var dirty = true;

    var pos = {
      c: 0,
      r: 0
    };

    var offset = {
      c: 0,
      r: 0
    };

    var undo = [];
    var maxUndo = 10;

    var shiftJumpSize = 10; // How far the cursor will jump if shift is down.
    
    var cursorState = 0; // 0 = off | 1 = on ... surprise
    var elapsedTime = 0;
    var lastTimestamp = null;

    function OnRegionResize(region){dirty = true;}

    function StoreUndo(c, r, pix){
      if (undo.length === maxUndo){
        undo.shift();
      }
      undo.push({
        c:c,
        r:r,
        pix:pix
      });
    }

    function DoUndo(){
      if (undo.length > 0){
        var info = undo.pop();
        if (info.pix !== null){
          var cglyph = gep.glyphIndex;
          gep.glyphIndex = info.pix[0];
          var cbg = gep.backgroundIndex;
          gep.backgroundIndex = info.pix[2];
          var cfg = gep.foregroundIndex;
          gep.foregroundIndex = info.pix[1];

          gep.setPix(info.c, info.r);
          gep.glyphIndex = cglyph;
          gep.backgroundIndex = cbg;
          gep.foregroundIndex = cfg;
        } else {
          // TODO: Remove the row/column
        }
      }
    }

    Object.defineProperties(this, {
      "dirty":{
	get:function(){return dirty;}
      },

      "active":{
	get:function(){return active;}
      },

      "maxUndoLevels":{
        get:function(){return maxUndo;},
        set:function(mu){
          if (typeof(mu) !== 'number'){
            throw new TypeError("Expecting a number.");
          } else if (mu <= 0){
            throw new RangeError("Value must be greater than zero.");
          }
          maxUndo = mu;
          if (undo.length > mu){
            undo.splice(0, undo.length - mu);
          }
        }
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
                cur.clear();
              }
	      dirty = true;
	    }
	  }
	}
      },
      
      "gep":{
	get:function(){return gep;},
        set:function(g){
          if (g === null || g instanceof GlyphEncodedPicture){
            if (g !== gep){
              gep = g;
	      offset.c = 0;
	      offset.r = 0;
              dirty = true;
            }
          }
        }
      },

      "shiftJumpSize":{
	get:function(){return shiftJumpSize;},
	set:function(size){
	  if (typeof(size) === 'number'){
	    if (size <= 0){throw new RangeError("Out of range.");}
	    shiftJumpSize = Math.floor(size);
	  } else {throw new TypeError("Number value expected.");}
	}
      }
      
    });

    
    function OnKeyDown(code){
      var shift = 1;
      var shiftActive = false;
      if (Keyboard.CodeSameAsName(code, "space") === true){
	if (gep !== null){
	  var c = pos.c - offset.c;
	  var r = pos.r - offset.r;
	  if (gep.width === 0 || gep.height === 0){
	    offset.c = pos.c;
	    offset.r = pos.r;
	  } else if (c < 0 || r < 0){
	    if (c < 0){
	      offset.c += c;
	    }
	    if (r < 0){
	      offset.r += r;
	    }
	  }
          if (c >= 0 && c < gep.width && r >= 0 && r < gep.height){
            StoreUndo(c, r, gep.getPix(c, r));
          } else {
            StoreUndo(c, r, null);
          }
	  gep.setPix(c, r);
	  dirty = true;
	}

      } else if (Keyboard.CodeSameAsName(code, "z") === true){
        if (keyboard.activeCombo("ctrl+z") === true){
          DoUndo();
        }
      } else if (Keyboard.CodeSameAsName(code, "up") === true){
	shiftActive = keyboard.activeCombo("shift+up");
	UnrenderCursor();
	elapsedTime = 0;
	if (pos.r > 0){
	  if (shiftActive){
	    shift = (pos.r - shiftJumpSize >= 0) ? shiftJumpSize : pos.r;
	  }
	  pos.r -= shift;
	} else if (gep !== null && gep.height > 0){
	  offset.r += (shiftActive) ? shiftJumpSize : shift;
          gep.dirty = true;
          dirty = true;
	}
	RenderCursor();


      } else if (Keyboard.CodeSameAsName(code, "down") === true){
	shiftActive = keyboard.activeCombo("shift+down");
	UnrenderCursor();
	elapsedTime = 0;
	if (pos.r < cur.rows-1){
	  if (shiftActive){
	    shift = (pos.r + shiftJumpSize < cur.rows) ? shiftJumpSize : (cur.rows-1) - pos.r;
	  }
	  pos.r += shift;
	} else if (gep !== null && gep.height > 0){
	  offset.r -= (shiftActive) ? shiftJumpSize : shift;
          gep.dirty = true;
          dirty = true;
	}
	RenderCursor();


      } else if (Keyboard.CodeSameAsName(code, "left") === true){
	shiftActive = keyboard.activeCombo("shift+left");
	UnrenderCursor();
	elapsedTime = 0;
	if (pos.c > 0){
	  if (shiftActive){
	    shift = (pos.c - shiftJumpSize >= 0) ? shiftJumpSize : pos.c;
	  }
	  pos.c -= shift;
	} else if (gep !== null && gep.width > 0){
	  offset.c += (shiftActive) ? shiftJumpSize : shift;
          gep.dirty = true;
          dirty = true;
	}
	RenderCursor();


      } else if (Keyboard.CodeSameAsName(code, "right") === true){
	shiftActive = keyboard.activeCombo("shift+right");
	UnrenderCursor();
	elapsedTime = 0;
	if (pos.c < cur.columns-1){
	  if (shiftActive){
	    shift = (pos.c + shiftJumpSize < cur.columns) ? shiftJumpSize : (cur.columns-1) - pos.c;
	  }
	  pos.c += shift;
	} else if (gep !== null && gep.width > 0){
	  offset.c -= (shiftActive) ? shiftJumpSize : shift;
          gep.dirty = true;
          dirty = true;
	}
	RenderCursor();
      }
    }


    this.activate = function(enable){
      enable = (enable === false) ? false : true;
      if (enable === active){return;} // No state to change.
      active = enable;
      
      if (active === true){
	this.emit("activating");
	keyboard.on("keydown", OnKeyDown);
      } else {
	keyboard.unlisten("keydown", OnKeyDown);
	cursorState = 0;
      }

      dirty = true;
    };


    var RenderCursor = (function(){
      var pix = [219, "#FFFF00", "#000000"];
      if (gep !== null){
	var c = pos.c - offset.c;
	var r = pos.r - offset.r;
	var gpix = null;
	try{
	  gpix = gep.getPix(c, r, true);
	} catch (e) {gpix = null; /* Nothing to do. */}
        
	if (gpix !== null && gpix[0] !== 0 && gpix[0] != " ".charCodeAt(0)){
	  pix[0] = gpix[0];
	}
      }

      cur.c = pos.c;
      cur.r = pos.r;
      cur.set(pix[0], Cursor.WRAP_TYPE_NOWRAP, {foreground:pix[1], background:pix[2]});
    }).bind(this);

    var UnrenderCursor = (function(){
      var pix = [0, null, null];
      if (gep !== null){
	var c = pos.c - offset.c;
	var r = pos.r - offset.r;
	var gpix = null;
	try{
	  gpix = gep.getPix(c, r, true);
	} catch (e) {gpix = null; /* Nothing to do. */}

	if (gpix !== null){
	  pix[0] = gpix[0];
	  pix[1] = (gpix[1] !== null) ? gep.getPaletteColor(gpix[1]).hex : null;
	  pix[2] = (gpix[2] !== null) ? gep.getPaletteColor(gpix[2]).hex : null;
	}
      }

      cur.c = pos.c;
      cur.r = pos.r;
      cur.set(pix[0], Cursor.WRAP_TYPE_NOWRAP, {foreground:pix[1], background:pix[2]});
    }).bind(this);

    
    this.render = function(){
      if (cur === null || dirty === false){return;}

      if (gep !== null && gep.dirty === true){
        gep.dirty = false;
	var width = gep.width;
	var height = gep.height;

        cur.clear();
        /*cur.clearRegion(
          (-offset.c >= 0) ? -offset.c : 0,
          (-offset.r >= 0) ? -offset.r : 0,
          width, height
        );*/

	for (var r = 0; r < height; r++){
	  for (var c = 0; c < width; c++){
            var pc = c + offset.c;
            var pr = r + offset.r;
	    if (pc >= 0 && pr >= 0 && pc < cur.columns && pr < cur.rows){
	      var pix = gep.getPix(c, r);
	      var fg = (pix[1] !== null) ? gep.getPaletteColor(pix[1]) : null;
	      var bg = (pix[2] !== null) ? gep.getPaletteColor(pix[2]) : null;
	      cur.c = pc;
	      cur.r = pr;
	      cur.set(pix[0], Cursor.WRAP_TYPE_NOWRAP, {foreground:fg, background:bg});
	    }
	  }
	}
      }

      if (active === true || dirty === true){
	if (cursorState === 1){
          RenderCursor();
	} else {
          UnrenderCursor();
	}
      }

      dirty = false;
    };


    this.forceRerender = function(){
      dirty = true;
    };


    this.update = function(timestamp){
      elapsedTime += (lastTimestamp === null) ? 0 : timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      //console.log(elapsedTime);
      if (active === true){
	while (elapsedTime/1000 >= 1){
          elapsedTime -= 1000;
          if (cursorState === 0){
            cursorState = 1;
          } else {
            cursorState = 0;
          }
          dirty = true;
	}
      }
    };
  }
  EditorControl.prototype.__proto__ = Emitter.prototype;
  EditorControl.prototype.constructor = EditorControl;


  return EditorControl;
});
