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
    if (typeof(root.R.Browser) === 'undefined'){
      throw new Error("Missing R initilization.");
    }
    
    if (root.R.Browser.exists(root, [
      "R.System.Emitter",
      "R.Graphics.Color",
      "R.Graphics.Glyph"
    ]) === false){
      throw new Error("Missing required object");
    }
    
    root.R.Browser.def(root, "R.Graphics.Terminal", factory(
      root.R.System.Emitter,
      root.R.Graphics.Glyph,
      root.R.Graphics.Color
    ));
  }
})(this, function (Emitter, Glyph, Color) {

  // UTILITY FUNCTION... WILL BE MOVED LATER!!
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
	fn.apply(context, args);
      }, delay);
    };
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
    var softClear = false;

    this.set = function(g, options){
      options = (typeof(options) === typeof({})) ? options : {};
      if (this.glyph !== g){
	this.glyph = g;
      }
      if (typeof(options.background) !== 'undefined'){
	this.background = options.background;
      }
      if (typeof(options.foreground) !== 'undefined'){
	this.foreground = options.foreground;
      }
    };

    this.resetDirtyState = function(){
      dirty = false;
      if (softClear === true){
        this.clear(true);
      }
    };

    this.clear = function(ignoreDirty, hardClear){
      if (hardClear === true || softClear === true){
        softClear = false;
        if (glyph !== null || foreground !== null || background !== null){
          dirty = (ignoreDirty === true) ? false : true;
          glyph = null;
          foreground = null;
          background = null;
        }
      } else {
        softClear = true;
      }
    };

    Object.defineProperties(this, {
      "dirty":{
	get:function(){return dirty || softClear;}
      },

      "softClear":{
        get:function(){return softClear;}
      },

      "empty":{
	get:function(){
	  return (glyph === null && foreground === null && background === null);
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
          softClear = false;
	}
      },

      "glyphCode":{
	get:function(){
	  return (glyph !== null) ? glyph.index : null;
	}
      },

      "foreground":{
	get:function(){return foreground;},
	set:function(fg){
	  if (foreground !== fg){
            if (foreground === null){
              foreground = new Color(fg);
              dirty = true;
            } else if (fg === null){
              foreground = null;
              dirty = true;
            } else if (foreground.eq(fg) === false){
              foreground.set(fg);
              dirty = true;
            }
	  }
          softClear = false;
	}
      },

      "background":{
	get:function(){return background;},
	set:function(bg){
          if (background !== bg){
            if (background === null){
              background = new Color(bg);
              dirty = true;
            } else if (bg === null){
              background = null;
              dirty = true;
            } else if (background.eq(bg) === false){
              background.set(bg);
              dirty = true;
            }
	  }
          softClear = false;
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
    var renderWidth = canvas.width;
    var renderHeight = canvas.height;
    
    var window = null;
    var fitToWindow = (options.terminalToWindow === true) ? true : false;
    var winResizeCallback = null;
    
    var glyph = null;//(typeof(options.glyph) !== 'undefined' && options.glyph instanceof Glyph) ? options.glyph : null;
    var cells = [];
    var dcells = [];
    
    var minColumns = (typeof(options.minColumns) === 'number' && options.minColumns > 0) ? Math.floor(options.minColumns) : 80;
    var minRows = (typeof(options.minRows) === 'number' && options.minRows > 0) ? Math.floor(options.minRows) : 80;
    var rows = 0;
    var columns = 0;

    // ----------------------------------------------------------
    // Internal system for managing sub-glyphs.
    var sglyph = {};

    function GetSubGlyph(code){
      var sg = null;
      if (code in sglyph){
	sglyph[code].ref += 1;
	sg = sglyph[code].subglyph;
      } else if (code >= 0 && code < glyph.elements){
	sg = glyph.get(code);
	sglyph[code] = {
	  ref: 1,
	  subglyph: sg
	};
      }
      return sg;
    }

    function DropSubGlyph(code, all){
      if (code in sglyph){
	if (sglyph[code].ref - 1 <= 0 || all === true){
	  delete sglyph[code];
	} else {
	  sglyph[code].ref -= 1;
	}
      }
    }


    // ----------------------------------------------------------
    // Internal helper functions.

    var UpdateTerminalSize = (function(){
      var old = [columns, rows];
      context.clearRect(0, 0, canvas.width, canvas.height);
      sglyph = {};
      if (glyph !== null){
	columns = Math.max(minColumns, Math.floor(renderWidth/glyph.cell_width));
	rows = Math.max(minRows, Math.floor(renderHeight/glyph.cell_height));

	canvas.width = Math.max(renderWidth, columns*glyph.cell_width);
	canvas.height = Math.max(renderHeight, rows*glyph.cell_height);
      }

      var oldCellCount = cells.length;
      var newCellCount = rows*columns;
      if (oldCellCount > newCellCount){
	// Remove extra cells... if there are any.
	cells.splice(newCellCount, oldCellCount-newCellCount);
      } 
      for (var i=0; i < newCellCount; i++){
	if (i < oldCellCount){
	  cells[i].clear(true, true);
	} else if (i >= oldCellCount){
	  // Add new cell.
	  cells.push(new Cell(i));
	}
      }
      this.emit("renderResize", [columns, rows], old);
    }).bind(this);


    // ----------------------------------------------------------
    // Property Definitions

    Object.defineProperties(this, {
      "element":{
	get:function(){return canvas;}
      },

      "context":{
	get:function(){return context;}
      },

      "window":{
	get:function(){return window;},
	set:function(win){
	  // NOTE: It is assumed win is either null or a Browser Window object.
	  if (window !== null && window !== win){
	    window.removeEventListener("resize", winResizeCallback);
	    winResizeCallback = null;
	    window = null;
	  }

	  if (win !== null){ // If it is null, there's nothing more to do.
	    window = win;
	    winResizeCallback = debounce((function(){
	      if (fitToWindow === true){
		renderWidth = window.innerWidth;
		renderHeight = window.innerHeight;
		canvas.style.width = window.innerWidth + "px";
		canvas.style.height = window.innerHeight + "px";
	      }
	      UpdateTerminalSize();
	      this.emit("resize");
	    }).bind(this), 300).bind(this);
	    window.addEventListener("resize", winResizeCallback);
	    winResizeCallback(); // Calling the callback. This should connect everything once.
	  }
	}
      },

      "terminalToWindow":{
	get:function(){return fitToWindow;},
	set:function(ftw){fitToWindow = (ftw === true) ? true : false;}
      },

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
      },

      "columns":{
	get:function(){return columns;}
      },

      "rows":{
	get:function(){return rows;}
      },

      "width":{
	get:function(){return canvas.width;}
      },

      "height":{
	get:function(){return canvas.height;}
      }
    });


    // Setting the glyph and/or window if given. Do it here for... reasons.
    if (typeof(options.window) !== 'undefined'){
      this.window = options.window;
    }
    if (typeof(options.glyph) !== 'undefined' && options.glyph instanceof Glyph){
      this.glyph = options.glyph;
    }


    // ----------------------------------------------------------
    // Primary Methods!

    this.set = function(c, r, code, options){
      if (glyph !== null){
	if (c >= 0 && c < columns && r >= 0 && r < rows){
	  var index = (columns*r)+c;
	  if (cells[index].glyphCode !== code){
	    if (cells[index].glyphCode !== null){
	      DropSubGlyph(cells[index].glyphCode);
	    }
	  }
	  var sg = GetSubGlyph(code);
	  cells[index].set(sg, options);
          if (cells[index].dirty === true){
            dcells.push(cells[index]);
          }
	}
      }
    };

    this.clearCell = function(c, r){
      if (c >= 0 && c < columns && r >= 0 && r < rows){
	var index = (columns*r)+c;
	if (cells[index].glyphCode !== null){
	  DropSubGlyph(cells[index].glyphCode);
	  cells[index].clear();
          if (cells[index].dirty === true){
            dcells.push(cells[index]);
          }
	}
      }
    };

    this.clearRegion = function(c, r, w, h){
      if (glyph !== null && w > 0 && h > 0){
	if (c >= 0 && c < columns && r >= 0 && r < rows){
	  for (var cr = r; cr < r+h; cr++){
	    for (var cc = c; cc < c+w; cc++){
	      if (cc < columns && cr < rows){
		var index = (cr*columns)+cc;
		var code = cells[index].glyphCode;
		if (code !== null){
		  DropSubGlyph(code);
		  cells[index].clear();
                  if (cells[index].dirty === true){
                    dcells.push(cells[index]);
                  }
		}
	      }
	    }
	  }
	}
      }
    };

    this.clearRow = function(r, w){
      if (glyph !== null && r >= 0 && r < rows){
	w = (typeof(w) === 'number') ? Math.max(1, Math.min(Math.floor(w), columns)) : columns;
	var row = (r*columns);
	for (var c=0; c < w; c++){
	  var index = row+c;
	  var code = cells[index].glyphCode;
	  if (code !== null){
	    DropSubGlyph(code);
	    cells[index].clear();
            if (cells[index].dirty === true){
              dcells.push(cells[index]);
            }
	  }
	}
      }
    };

    this.clearColumn = function(c, h){
      if (glyph !== null && c >= 0 && c < columns){
	h = (typeof(h) === 'number') ? Math.max(1, Math.min(Math.floor(h), rows)) : rows;
	for (var r=0; r < h; r++){
	  var index = (r*columns)+c;
	  var code = cells[index].glyphCode;
	  if (code !== null){
	    DropSubGlyph(code);
	    cells[index].clear();
            if (cells[index].dirty === true){
              dcells.push(cells[index]);
            }
	  }
	}
      }
    };

    this.clear = function(){
      this.clearRegion(0, 0, columns, rows);
    };

    this.flip = function(){
      if (glyph === null){return;}
      var dclen = dcells.length;
      if (dclen <= 0){return;}
      /*dcells.sort(function(ca, cb){
        var cag = (ca.glyphCode === null) ? -1 : ca.glyphCode;
        var cbg = (cb.glyphCode === null) ? -1 : cb.glyphCode;
        return cag - cbg;
      });*/

      var defaultBG = new Color();
      
      var cw = glyph.cell_width;
      var ch = glyph.cell_height;

      var tint = new Color();
      var color = new Color();
      var mcolor = new Color();

      var pixels = null;
      var bpixels = null;
      var pcount = 0;
      var lastGlyphCode = null;
      for (var c=0; c < dclen; c++){
	var cell = dcells[c];
	cell.resetDirtyState();

	var x = (cell.index%columns)*cw;
	var y = Math.floor(cell.index/columns)*ch;

	if (cell.glyphCode !== null){ // Check to see if there's something to render.
          if (cell.glyphCode !== lastGlyphCode){
	    pixels = cell.glyph.pixels;
            if (bpixels === null){
              bpixels = cell.glyph.pixels;
            }
	    pcount = Math.floor(pixels.data.length/4);
            lastGlyphCode = cell.glyphCode;
          }
          
	  
	  /*if (cell.background !== null){
	    var old = context.fillStyle;
	    context.fillStyle = cell.background.hex;
	    context.fillRect(x, y, cw, ch);
	    context.fillStyle = old;
	  } else {
	    // If there's no background for this cell, and it's been changed, let's clear the old pixels out.
	    context.clearRect(x, y, cw, ch);
	  }

	  var cpixels = context.getImageData(x, y, cw, ch);*/
          
          var hasbg = cell.background !== null;
	  if (cell.foreground !== null){
            if (tint.eq(cell.foreground) === false){
	      tint = new Color(cell.foreground);
            }
	  } else {tint.white();}


	  for (var p=0; p < pcount; p++){
            var index = p*4;
	    color.set(
              (hasbg) ? cell.background : defaultBG
            ).blend(
	      mcolor.setRGBA(
		pixels.data[index],
		pixels.data[index+1],
		pixels.data[index+2],
		pixels.data[index+3]
	      ).multiply(tint)
	    );

	    bpixels.data[index] = color.r;
	    bpixels.data[index+1] = color.g;
	    bpixels.data[index+2] = color.b;
	    bpixels.data[index+3] = color.a;
	  }

	  // Output the pixels
          context.putImageData(bpixels, x, y);
	} else {
	  // If there's no glyphCode, then this cell is empty. Simply clear it!
	  context.clearRect(x, y, cw, ch);
	}
      }
      dcells.splice(0, dcells.length);
    };
  }
  Terminal.prototype.__proto__ = Emitter.prototype;
  Terminal.prototype.constructor = Terminal;

  return Terminal;
});
