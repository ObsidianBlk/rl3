(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(['src/R/System/Emitter', 'src/R/Graphics/Glyph', 'src/R/Graphics/Color'], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      /*
	!!!! WARNING !!!!
	This object uses the browser context class Image() as well as the document object for a lot of it's work. As such,
	this object may not be importable using node's require() method... unless you know how to make those items global in this context.
	Have fun!
       */
      module.exports = factory(
	require('src/R/System/Emitter'),
	require('src/R/Graphics/Glyph'),
	require('src/R/Graphics/Color')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    var exists = function(r, path){
      var pos = path.indexOf(".");
      if (pos < 0){
	return (typeof(r[path]) !== 'undefined');
      }

      var spath = path.substr(0, pos);
      if (typeof(r[spath]) === typeof({})){
	return exists(r[spath], path.substr(pos+1));
      }
      return false;
    };

    var def = function(r, path, item){
      var pos = path.indexOf(".");
      if (pos < 0){
	r[path] = item;
      }

      var spath = path.substr(0, pos);
      if (typeof(r[spath]) !== typeof({})){
	r[spath] = {};
      }
      def (r[spath], path.substr(pos+1), item);
    };
    
    if (exists(root, "R.System.Emitter") === false){
      throw new Error("Missing required object");
    }
    if (exists(root, "R.Graphics.Color") === false){
      throw new Error("Missing required object");
    }
    if (exists(root, "R.Graphics.Glyph") === false){
      throw new Error("Missing required object");
    }
    def(root, "R.Graphics.Terminal", factory(
      root.R.System.Emitter,
      root.R.Graphics.Glyph,
      root.R.Graphics.Color
    ));
  }
})(this, function (Emitter, Glyph, Color) {

  /* ---------------------------------------------------
     Glyph Helper Functions and tracker.
     We only want 1 copy of any sub-glyph at a time.
     ---------------------------------------------------*/
  var GlyphStore = {};

  function GetGlyph(glyph, index){
    var g = null; // Assume there is no glyph
    if (index >= 0 && index < glyph.elements){ // If the index is out of bounds, we don't do anything.
      var store = null;
      if (glyph.src in GlyphStore){ // If the glyph.src is already in use...
	store = GlyphStore[glyph.src];
	for (var i=0; i < store.length; i++){ // Check to see if we're using this sub-glyph already. 
	  if (store[i].index === index){
	    g = store[i]; break; // So it seems we are!
	  }
	}

	if (g === null){
	  g = glyph.get(index);
	  if (g !== null){
	    store.push(g);
	  }
	}
      } else {
	g = glyph.get(index);
	if (g !== null){
	  store = [];
	  store.push(g);
	  GlyphStore[glyph.src] = store;
	}
      }
    }
    return g;
  }

  function DropGlyph(glyph, index){
    if (glyph.src in GlyphStore){
      var store = GlyphStore[glyph.src];
      for (var i=0; i < store.length; i++){
	if (store[i].index === index){
	  store.splice(i, 1); break;
	}
      }
    }
  }

  function DropAllGlyphs(glyph){
    if (glyph.src in GlyphStore){
      var store = GlyphStore[glyph.src];
      store.splice(0, store.length);
    }
  }

  /* ---------------------------------------------------
     Cell class
     Manage and identify a terminal cell's glyph and dirty state.
   --------------------------------------------------- */

  function Cell(index){
    var glyph = null;
    // null set for either *grounds means untinted no background.
    var foreground = null; // Foreground color (will tint the glyph)
    var background = null; // Background color (will autofill all transparent areas with this color)
    // NOTE: If the glyph itself is fully opaque, then background will have no visible effect (though it will still be "rendered").
    var dirty = false;

    this.resetDirtyState = function(){
      dirty = false;
    };

    this.clear = function(){
      glyph = null;
      foreground = null;
      background = null;
      dirty = true;
    };

    Object.defineProperties(this, {
      "dirty":{
	get:function(){return dirty;}
      },

      "empty":{
	get:function(){
	  return (glyph !== null || foreground !== null || background !== null);
	}
      },

      "glyph":{
	get:function(){return glyph;},
	set:function(g){
	  // We're going to assume g is null or a sub-glyph object.
	  if (g !== glyph){
	    glyph = g;
	    dirty = true;
	  }
	}
      },

      "foreground":{
	get:function(){return new Color(foreground);},
	set:function(fg){
	  // NOTE: I don't bother checking for type. Color will deal with that.
	  foreground = new Color(fg);
	  dirty = true;
	}
      },

      "background":{
	get:function(){return new Color(background);},
	set:function(bg){
	  background = new Color(bg);
	  dirty = true;
	}
      },

      "index":{
	get:function(){return index;}
      }
    });
  };
  Cell.prototype.constructor = Cell;


  /* ---------------------------------------------------
     Terminal class
     Using a given Canvas element, handles the rendering of Glyphs.
   --------------------------------------------------- */

  function Terminal(canvas, options){
    Emitter.call(this);
    // nodeName is a property of an HTMLElement, so I use it to see if we're given a canvas... otherwise, panic!
    if (typeof(canvas.nodeName) === 'undefined' || canvas.nodeName !== 'CANVAS'){
      throw new TypeError("Expected a DOM element of type '<canvas>'.");
    }
    options = (typeof(options) === typeof({})) ? options : {};

    var context = canvas.getContext('2d');
    var glyph = (typeof(options.glyph) !== 'undefined' && options.glyph instanceof Glyph) ? options.glyph : null;
    var minColumns = (typeof(options.minColumns) === 'number' && options.minColumns > 0) ? Math.floor(options.minColumns) : 80;
    var minRows = (typeof(options.minRows) === 'number' && options.minRows > 0) ? Math.floor(options.minRows) : 80;
    var rows = 0;
    var columns = 0;

    // ----------------------------------------------------------
    // Internal helper functions.
    var UpdateTerminalSize = function(){
      // Calculate terminal size changes...
    };

    // ----------------------------------------------------------
    Object.defineProperties(this, {
      "glyph":{
	get:function(){return glyph;},
	set:function(g){
	  if (g !== null && !(g instanceof Glyph)){
	    throw new TypeError();
	  }

	  if (g !== glyph){
	    glyph = g;
	    UpdateTerminalSize();
	  }
	}
      }
    });
  }
  Terminal.prototype.__proto__ = Emitter.prototype;
  Terminal.prototype.constructor = Terminal;

  return Terminal;
});
