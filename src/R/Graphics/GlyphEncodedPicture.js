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
      },

      "paletteSize":{
	get:function(){return palette.length;}
      },

      "palette":{
        get:function(){
          if (palette.length > 0){
            return palette.map(function(item){
              return new Color(item);
            });
          }
          return [];
        }
      },

      "foreground":{
        get:function(){
          return (defaultFG !== null) ? new Color(palette[defaultFG]) : null;
        }
      },

      "foregroundIndex":{
        get:function(){return defaultFG;},
        set:function(fg){
          if (fg === null){
            defaultFG = null;
          } else if (typeof(fg) === 'number'){
            if (fg < 0 || fg >= palette.length){
              throw new RangeError("Palette index is out of bounds.");
            }
            defaultFG = Math.floor(fg);
          } else {
            throw new TypeError("Expected an integer index value.");
          }
        }
      },

      "background":{
        get:function(){
          return (defaultBG !== null) ? new Color(palette[defaultBG]) : null;
        }
      },

      "backgroundIndex":{
        get:function(){return defaultBG;},
        set:function(bg){
          if (typeof(bg) === 'number'){
            if (bg === null){
              defaultBG = bg;
            } else if (bg < 0 || bg >= palette.length){
              throw new RangeError("Palette index is out of bounds.");
            }
            defaultBG = Math.floor(bg);
          } else {
            throw new TypeError("Expected an integer index value.");
          }
        }
      },

      "glyphIndex":{
        get:function(){return defaultGlyph;},
        set:function(gi){
          if (typeof(gi) === 'number'){
            if (gi < 0){
              throw new RangeError("Glyph index is out of bounds.");
            }
            defaultGlyph = gi;
          } else {
            throw new TypeError("Expected an integer index value.");
          }
        }
      }
    });

    this.toString = function(embedPalette){
      var exp = {
	id: "GEP",
	version: "0.0.1",
	region: region,
	gdat: gdat,
	defaultGlyph: defaultGlyph,
	defaultFG: defaultFG,
	defaultBG: defaultBG
      };
      if (embedPalette === true && palette.length > 0){
	exp.palette = palette.map(function(item){
	  return item.object;
	});
      }

      return JSON.stringify(exp);
    };

    // This is just a wrapper for the getPaletteIndex function to add clarity.
    this.addPaletteColor = function(color){
      this.getPaletteIndex(color);
    };

    this.getPaletteIndex = function(color){
      color = (color instanceof Color) ? color : new Color(color);
      for (var i=0; i < palette.length; i++){
	if (palette[i].eq(color) === true){
	  return i;
	}
      }

      if (palette.length < 256){
        palette.push(color);
        return palette.length-1;
      }
      return -1;
    };


    this.getPaletteColor = function(index){
      if (index < 0 || index >= palette.length){
	throw new RangeError("Palette index is out of bounds.");
      }
      return palette[index];
    };


    this.replacePaletteColor = function(index, color){
      if (index < 0 || index >= palette.length){
        throw new RangeError("Palette index is out of bounds.");
      }
      color = (color instanceof Color) ? color : new Color(color);
      palette[index] = color;
    };

    this.storePalette = function(npal){
      if (!(npal instanceof Array)){
	throw new TypeError("Expected array of palette colors.");
      }

      var oldlength = palette.length;
      for (var i=0; i < npal.length; i++){
	if (i >= palette.length){
	  palette.push(new Color(npal[i]));
	} else {
	  palette[i] = new Color(npal[i]);
	}
      }

      if (npal.length < oldlength){
        if (defaultFG >= npal.length){
          defaultFG = null;
        }
        if (defaultBG >= npal.length){
          defaultBG = null;
        }
        
	palette.splice(npal.length, palette.length - npal.length);
	if (gdat.length > 0){
	  gdat.forEach(function(row){
	    for (var i=0; i < row.length; i++){
	      var pix = CodeToPix(row[i]);
	      if (pix[1] !== null && pix[1] >= palette.length){
		pix[1] = null;
	      }
	      if (pix[2] !== null && pix[2] >= palette.length){
		pix[2] = null;
	      }
	      row[i] = PixToCode(pix, true);
	    }
	  });
	}
      }
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
      if (pal !== null && typeof(pal) === typeof({})){
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


  GlyphEncodedPicture.FromString = function(gepjsonstr, palette){
    var jdat = null;
    try{
      jdat = JSON.parse(gepjsonstr);
    } catch (e){
      throw new TypeError("Argument <gepjsonstr> is not a JSON string.");
    }

    if (jdat instanceof Array){
      throw new TypeError("JSON is not in expected GEP format.");
    }

    if (typeof(jdat.id) !== 'string' || jdat.id !== "GEP"){
      throw new TypeError("GEP ID invalid.");
    }
    if (typeof(jdat.version) !== 'string'){
      throw new TypeError("GEP version missing or invalid data.");
    }
    if (jdat.version.split(".").length !== 3){
      throw new Error("GEP version number malformed.");
    }
    // TODO: Actually DO something with the version number.


    // --- Validate region
    if (typeof(jdat.region) !== typeof({})){
      throw new TypeError("GEP region data missing or malformed.");
    }
    if (typeof(jdat.region.left) !== 'number'){
      throw new TypeError("GEP region.left missing or malformed.");
    }
    if (typeof(jdat.region.top) !== 'number'){
      throw new TypeError("GEP region.top missing or malformed.");
    }
    if (typeof(jdat.region.right) !== 'number'){
      throw new TypeError("GEP region.right missing or malformed.");
    }
    if (typeof(jdat.region.bottom) !== 'number'){
      throw new TypeError("GEP region.bottom missing or malformed.");
    }

    if (jdat.region.right < jdat.region.left || jdat.region.bottom < jdat.region.top){
      throw new Error("GEP region values invalid.");
    }


    // --- Validate gdat
    if (typeof(jdat.gdat) === 'undefined'){
      throw new Error("GEP missing glyph data.");
    }
    if (!(jdat.gdat instanceof Array)){
      throw new TypeError("GEP glyph data malformed.");
    }


    // --- Check for palette
    if (typeof(jdat.palette) !== 'undefined'){
      if (!(jdat.palette instanceof Array)){
	throw new TypeError("GEP palette expected to be an array.");
      }
      palette = jdat.palette; // If one if stored in the image, ignore the palette given.
    } else if (typeof(palette) === 'undefined'){
      throw new Error("GEP missing palette.");
    }


    // --- Create the GEP and store the data.
    var width = (jdat.region.right - jdat.region.left) + 1;
    var height = (jdat.region.bottom - jdat.region.top) + 1;
    var gep = new GlyphEncodedPicture();
    gep.storePalette(palette);
    for (var r = 0; r < height; r++){
      for (var c = 0; c <= width; c++){
	var pix = null;
	try{
	  pix = CodeToPix(jdat.gdat[r][c]);
	} catch (e) {
	  throw new Error("GEP pixel data is malformed.");
	}
	gep.storePix(
	  c + jdat.region.left,
	  r + jdat.region.top,
	  pix[0],
	  pix[1],
	  pix[2]
	);
      }
    }
    return gep;
  };


  return GlyphEncodedPicture;

});
