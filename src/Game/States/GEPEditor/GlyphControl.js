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
      'src/R/Graphics/GlyphEncodedPicture',
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
	require('src/R/Graphics/GlyphEncodedPicture'),
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
	root.R.Graphics.GlyphEncodedPicture,
	root.R.Input.Keyboard
      );
    }
  }
})(this, function (Emitter, Color, Terminal, Cursor, GlyphEncodedPicture, Keyboard) {

  function GlyphControl(terminal, keyboard){
    Emitter.call(this);

    var cur = null;
    var active = false;
    var dirty = true;

    var gep = null;

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
      },

      "gep":{
	get:function(){return gep;},
        set:function(g){
          if (g === null || g instanceof GlyphEncodedPicture){
            if (g !== gep){
              gep = g;
              dirty = true;
            }
          }
        }
      },

      "glyph":{
	get:function(){return (gep !== null) ? gep.glyphIndex : 0;},
	set:function(g){
	  if (gep !== null && typeof(g) === 'number'){
	    if (g >= 0 && g < terminal.glyph.elements && Math.floor(g) !== gep.glyphIndex){
	      gep.glyphIndex = Math.floor(g);
	      this.emit("glyphchange");
	      dirty = true;
	    }
	  }
	}
      }
    });

    var OnKeyDown = (function(code){
      if (gep === null){return;}

      if (Keyboard.CodeSameAsName(code, "up") === true){
        if (gep.glyphIndex - 16 > 0){
          gep.glyphIndex -= 16;
          this.emit("glyphchange");
	  dirty = true;
        }
      } else if (Keyboard.CodeSameAsName(code, "down") === true){
        if (gep.glyphIndex + 16 < terminal.glyph.elements){
          gep.glyphIndex += 16;
          this.emit("glyphchange");
	  dirty = true;
        }
      } else if (Keyboard.CodeSameAsName(code, "left") === true){
        if (gep.glyphIndex > 0){
	  gep.glyphIndex -= 1;
	  this.emit("glyphchange");
	  dirty = true;
	}
      } else if (Keyboard.CodeSameAsName(code, "right") === true){
        if (gep.glyphIndex+1 < terminal.glyph.elements){
	  gep.glyphIndex += 1;
	  this.emit("glyphchange");
	  dirty = true;
	}
      }
    }).bind(this);


    this.activate = function(enable){
      enable = (enable === false) ? false : true;
      if (active === enable){return;} // Nothing to change.      
      
      active = enable;
      if (active === true){
	this.emit("activating");
	keyboard.on("keydown", OnKeyDown);
      } else {
        cur.clear();
	keyboard.unlisten("keydown", OnKeyDown);
      }
      dirty = true;
    };


    this.render = function(){
      if (cur === null || dirty === false || gep === null || active === false){return;}
      dirty = false;

      cur.clear();
      cur.c = 0;
      cur.r = 0;
      cur.set(parseInt("C2", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
      cur.c = cur.columns-1;
      cur.r = 0;
      cur.set(parseInt("BF", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
      cur.c = 0;
      cur.r = cur.rows-1;
      cur.set(parseInt("C0", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
      cur.c = cur.columns - 1;
      cur.r = cur.rows - 1;
      cur.set(parseInt("B4", 16), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});

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

      var elcount = terminal.glyph.elements;
      if (elcount > 256){elcount = 256;}
      
      cur.r=1;
      cur.c=1;
      for (var i=0; i < elcount; i++){
        if (cur.c === cur.columns-1){
          cur.c = 1;
          cur.r += 1;
        }
        
        if (gep.glyphIndex === i){
          if (i === 0 || i === " ".charCodeAt(0)){
            cur.set(i, Cursor.WRAP_TYPE_CHARACTER, {foreground:null, background:"#FFFF00"});
          } else {
            cur.set(i, Cursor.WRAP_TYPE_CHARACTER, {foreground:"#FFFF00", background:null});
          }
        } else {
          cur.set(i, Cursor.WRAP_TYPE_CHARACTER, {foreground:null, background:null});
        }
      }
    };
  }
  GlyphControl.prototype.__proto__ = Emitter.prototype;
  GlyphControl.prototype.constructor = GlyphControl;

  return GlyphControl;
});
