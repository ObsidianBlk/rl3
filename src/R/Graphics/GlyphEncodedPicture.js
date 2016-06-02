(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/Graphics/Color',
      'src/R/Graphics/Cursor'
    ], factory);
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
	require('src/R/Graphics/Color'),
	require('src/R/Graphics/Cursor')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.R.Browser) === 'undefined'){
      throw new Error("Missing R initilization.");
    }

    if (root.R.Browser.exists(root, [
      "R.Graphics.Color",
      "R.Graphics.Cursor"
    ]) === false){
      throw new Error("Missing required object");
    }
    
    root.R.Browser.def(root, "R.Graphics.GlyphEncodedPicture", factory(
      root.R.Graphics.Color,
      root.R.Graphics.Cursor
    ));
  }
})(this, function (Color, Cursor) {

  function GlyphEncodedPicture(){
    var region = {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    };

    var palette = [];
    var gdat = [];

    var defaultGlyph = 0;
    var defaultFG = null;
    var defaultBG = null;

    function PixToCode(pix, compressed){
      var n = pix;
      if (compressed === true){
	var n = [pix[0]];
	if (pix[1] !== null){
	  n.push(pix[1]);
	}
	if (pix[2] !== null){
	  n.push(pix[2]);
	}
      }
      return n.join(":");
    }

    function CodeToPix(code){
      var pix = code.split(":");
      if (pix.length <= 0 || pix.length > 3){
	throw new RangeError("Pixel code \"" + code + "\" contains incorrect number of components.");
      }
      for (var i=0; i < pix.length; i++){
	if (pix[i] === ""){
	  if (i === 0){
	    throw new TypeError("Pixel code \"" + code + "\" invalid. Missing required glyph index.");
	  }
	  pix[i] = null;
	} else {
	  pix[i] = parseInt(pix[i]);
	  if (Number.isNaN(pix[i]) === true){
	    throw new TypeError("Pixel code \"" + code + "\" invalid. Expecting integer value.");
	  }
	}
      }
      return pix;
    };

    function NewColumn(){
      var width = this.width;
      var pixcode = CodeToPix([defaultGlyph, defaultFG, defaultBG], true);
      var col = [];
      for (var i=0; i < width; i++){
	col.push(pixcode);
      }
      return col;
    }

    function XTendColumns(amount, pre){
      if (amount > 0 && gdat.length > 0){
	var pixcode = CodeToPix([defaultGlyph, defaultFG, defaultBG], true);
	for (var r=0; r < gdat.length; r++){
	  for (var i=0; i < amount; i++){
	    if (pre === true){
	      gdat[r].unshift(pixcode);
	    } else {
	      gdat[r].push(pixcode);
	    }
	  }
	}
      }
    }

    function XTendRows(amount, pre){
      if (amount > 0 && gdat.length > 0){
	for (var i=0; i < amount; i++){
	  if (pre === true){
	    gdat.unshift(NewColumn());
	  } else {
	    gdat.push(NewColumn());
	  }
	}
      }
    }

    Object.defineProperties(this, {
      "anchor":{
	get:function(){
	  // NOTE: I'm returning the negative value of the actual anchor point.
	  // This effectively returns the offset from the 0,0 origin of the image data.
	  return {
	    c: - region.left,
	    r: - region.top
	  };
	}
      },

      "width":{
	get:function(){return (gdat.length > 0) ? (region.right - region.left) + 1 : 0;}
      },

      "height":{
	get:function(){return (gdat.length > 0) ? (region.bottom - region.top) + 1 : 0;}
      }
    });

    this.getPaletteIndex = function(color){
      color = (color instanceof Color) ? color : new Color(color);
      for (var i=0; i < palette.length; i++){
	if (palette[i].eq(color) === true){
	  return i;
	}
      }
      palette.push(color);
      return palette.length-1;
    };


    this.getPaletteColor = function(index){
      if (index < 0 || index >= palette.length){
	throw new RangeError("Palette index is out of bounds.");
      }
      return palette[index];
    };

    
    this.setPix = function(c, r, glyph, fg, bg){
      if (typeof(fg) === 'undefined'){
	fg = null;
      } else if (fg instanceof Color || typeof(fg) === 'string'){
	fg = this.getPaletteIndex(fg);
      } else if (typeof(fg) === 'number'){
	fg = Math.floor(fg);
	if (fg < 0 || fg >= palette.length){
	  throw new RangeError("Foreground palette index is out of range.");
	}
      } else if (fg !== null){
	throw new TypeError("Foreground must be a Color instance, a string, a palette index value, or null.");
      }

      if (typeof(bg) === 'undefined'){
	bg = null;
      } else if (bg instanceof Color || typeof(bg) === 'string'){
	bg = this.getPaletteIndex(bg);
      } else if (typeof(fg) === 'number'){
	bg = Math.floor(bg);
	if (bg < 0 || bg >= palette.length){
	  throw new RangeError("Background palette index is out of range.");
	}
      } else if (bg !== null){
	throw new TypeError("Background must be a Color instance, a string, a palette index value, or null.");
      }

      if (c < region.left){
	if (this.width > 0){
	  XTendColumns(region.left - c, true);
	}
	region.left = c;
      } else if (c > region.right){
	if (this.width > 0){
	  XTendColumns(c - region.right);
	}
	region.right = c;
      }

      if (r < region.top){
	if (this.height > 0){
	  XTendRows(region.top - r, true);
	}
	region.top = r;
      } else if (r > region.bottom){
	if (this.height > 0){
	  XTendRows(r - region.bottom);
	}
	region.bottom = r;
      }

      if (gdat.length === 0){
	gdat.push([PixToCode([glyph, fg, bg], true)]);
      } else {
	c += region.left;
	r += region.top;

	gdat[r][c] = PixToCode([glyph, fg, bg], true);
      }
    };

    this.setPixColor = function(c, r, pal, coordExact){
      if (coordExact !== true){
	c += region.left;
	r += region.top;
      }
      if (c < 0 || c >= this.width || r < 0 || r >= this.height){
	throw new RangeError("Coordinates out of range.");
      }

      var pix = CodeToPix(gdat[r][c]);
      if (typeof(pal) === typeof({})){
	if (typeof(pal.fg) !== 'undefined'){
	  if (typeof(pal.fg) === 'number'){
	    pix[1] = Math.floor(pal.fg);
	    if (pix[1] < 0 || pix[1] >= palette.length){
	      throw new RangeError("Foreground palette index out of range.");
	    }
	  } else if (pal.fg === null){
	    pix[1] = null;
	  }
	}

	if (typeof(pal.bg) !== 'undefined'){
	  if (typeof(pal.bg) === 'number'){
	    pix[2] = Math.floor(pal.bg);
	    if (pix[2] < 0 || pix[2] >= palette.length){
	      throw new RangeError("Background palette index out of range.");
	    }
	  } else if (pal.bg === null){
	    pix[2] = null;
	  }
	}
      }
      gdat[r][c] = PixToCode(pix, true);
    };


    this.getPix = function(c, r, coordExact){
      if (coordExact !== true){
	c += region.left;
	r += region.top;
      }

      if (c < 0 || c >= this.width || r < 0 || r >= this.height){
	throw new RangeError("Coordinates out of range.");
      }
      return CodeToPix(gdat[r][c]);
    };
  }
  GlyphEncodedPicture.prototype.constructor = GlyphEncodedPicture;


  return GlyphEncodedPicture;

});
