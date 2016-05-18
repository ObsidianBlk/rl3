(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(['src/R/System/Emitter', 'src/R/Graphics/Color', 'src/R/Graphics/Terminal'], factory);
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
	require('src/R/Graphics/Color'),
	require('src/R/Graphics/Terminal')
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
      "R.Graphics.Terminal"
    ]) === false){
      throw new Error("Missing required object");
    }
    
    root.R.Browser.def(root, "R.Graphics.Cursor", factory(
      root.R.System.Emitter,
      root.R.Graphics.Color,
      root.R.Graphics.Terminal
    ));
  }
})(this, function (Emitter, Color, Terminal) {

  function Cursor(term){
    if (!(term instanceof Terminal)){
      throw new TypeError();
    }

    var top = 0;
    var left = 0;
    var bottom = term.rows;
    var right = term.columns;

    var width = right - left;
    var height = bottom - top;

    var pos_c = 0;
    var pos_r = 0;

    var foreground = null;
    var background = null;

    var text_wrap_type = Cursor.WRAP_TYPE_WORD;
    var data_wrap_type = Cursor.WRAP_TYPE_CHARACTER;

    var tab_size = 4; // Number of white spaces to use if a tab code is being rendered.
    var tab_as_spaces = true; // TABs are rendered as spaces. If true, background colors will be rendered out as they are with space characters.
    var nl_auto_cr = true; // Automatically include a carriage return when a newline is seen.

    // -----------------------------------------------
    // Helper function for rendering strings to the terminal.
    var PaintString = (function(str, wrap, ops){
      // NOTE: This function will treat every character in the given string as a valid code.
      for (var i=0; i < str.length; i++){
	term.set(left + pos_c, top + pos_r, str.charCodeAt(i), ops);
	if (this.shiftC(1, wrap === Cursor.WRAP_TYPE_CHARACTER) === false){
	  return false;
	}
      }
      return true;
    }).bind(this);

    // -----------------------------------------------

    Object.defineProperties(this, {
      "terminal":{
	get:function(){return term;}
      },

      "foreground":{
	get:function(){return (foreground !== null) ? new Color(foreground) : null;},
	set:function(fg){
	  if (typeof(fg) === 'undefined' || fg === null){
	    foreground = null;
	  } else if (typeof(fg) === 'string' || fg instanceof Color){
	    foreground = new Color(fg);
	  }
	}
      },

      "background":{
	get:function(){return (background !== null) ? new Color(background) : null;},
	set:function(bg){
	  if (typeof(bg) === 'undefined' || bg === null){
	    background = null;
	  } else if (typeof(bg) === 'string' || bg instanceof Color){
	    background = new Color(bg);
	  }
	}
      },

      "tabSize":{
	get:function(){return tab_size;},
	set:function(size){
	  if (typeof(size) === 'number' && size >= 1){
	    tab_size = Math.floor(size);
	  }
	}
      },

      "tabAsSpaces":{
	get:function(){return tab_as_spaces;},
	set:function(enable){
	  tab_as_spaces = (typeof(enable) === 'boolean') ? enable : tab_as_spaces;
	}
      },

      "nlAutoCr":{
	get:function(){return nl_auto_cr;},
	set:function(enable){
	  nl_auto_cr = (typeof(enable) === 'boolean') ? enable : nl_auto_cr;
	}
      },

      "region":{
	get:function(){
	  return {
	    top:top,
	    left:left,
	    bottom:bottom,
	    right:right
	  };
	},
	set:function(reg){
	  if (typeof(reg) === typeof({})){
	    var _left = left;
	    var _top = top;
	    var _right = right;
	    var _bottom = bottom;

	    if (typeof(reg.top) === 'number' && reg.top >= 0 && reg.top < term.rows){
	      _top = Math.floor(reg.top);
	    }
	    if (typeof(reg.left) === 'number' && reg.left >= 0 && reg.left < term.columns){
	      _left = Math.floor(reg.left);
	    }
	    if (typeof(reg.bottom) === 'number' && reg.bottom >= 0 && reg.bottom < term.rows){
	      _bottom = Math.floor(reg.bottom);
	    }
	    if (typeof(reg.right) === 'number' && reg.right >= 0 && reg.right < term.columns){
	      _right = Math.floor(reg.right);
	    }

	    var tmp = 0;
	    if (_right < _left){
	      tmp = _left;
	      _left = _right;
	      _right = tmp;
	    }
	    if (_right - _left <= 0){
	      throw new RangeError();
	    }
	    width = (_right - _left)+1;

	    if (_bottom < _top){
	      tmp = _bottom;
	      _bottom = _top;
	      _top = tmp;
	    }
	    if (_bottom - _top <= 0){
	      throw new RangeError();
	    }
	    height = (_bottom - _top)+1;

	    left = _left;
	    right = _right;
	    top = _top;
	    bottom = _bottom;
	  }
	}
      },

      "columns":{
	get:function(){return width;}
      },

      "rows":{
	get:function(){return height;}
      },

      "c":{
	get:function(){return pos_c;},
	set:function(c){
	  if (typeof(c) === 'number'){
	    if (c >= 0 && c < width){
	      pos_c = Math.floor(c);
	    }
	  }
	}
      },

      "r":{
	get:function(){return pos_r;},
	set:function(r){
	  if (typeof(r) === 'number'){
	    if (r >= 0 && r < height){
	      pos_r = Math.floor(r);
	    }
	  }
	}
      }
    });

    this.cr = function(){
      pos_c = 0;
    };

    this.nl = function(autoCR){
      if (pos_r + 1 >= height){
	return false;
      }
      pos_r += 1;

      if (autoCR === true || nl_auto_cr === true){
	pos_c = 0;
      }
      return true;
    };

    this.shiftR = function(amount){
      amount = (typeof(amount) === 'number') ? Math.floor(amount) : 1;

      var res = true;
      var r = pos_r + amount;
      if (r < 0){
	r = 0;
	res = false;
      } else if (r >= height){
	r = height - 1;
	res = false;
      }

      pos_r = r;
      return res;
    };

    this.shiftC = function(amount, wrap){
      wrap = (wrap === true) ? true : false;
      amount = (typeof(amount) === 'number') ? Math.floor(amount) : 1;

      var res = true;
      var ramount = 0;
      var c = pos_c + amount;
      if (c >= width){
	if (wrap === true){
	  ramount = Math.floor(c/width); // How many rows must shift
	  c = c%width;
	} else {
	  c = width-1;
	  res = false;
	}
      } else if (c < 0){
	if (wrap === true){
	  ramount = Math.floor(c/width); // How many rows must shift
	  c = width + c; // remember, c is negative, so, this is a subtraction.
	} else {
	  c = 0;
	  res = false;
	}
      }

      // Check to see if we need to change rows...
      if (ramount !== 0){
	var r = pos_r + ramount;
	if (r < 0){ // If we try to shift past the top of the region, then columns gets set to 0
	  r = 0;
	  c = 0;
	} else if (r >= height){ // If we try to shift past the bottom of the region, columns gets set to width-1
	  r = height - 1;
	  c = width - 1;
	}

	// Setting the new pos_r value.
	pos_r = r;
      }

      // Finally setting the new pos_c value.
      pos_c = c;
      return res;
    };

    this.del = function(){
      term.clearCell(left + pos_c, top + pos_r);
    };

    this.backspace = function(amount, wrap){
      wrap = (wrap === true) ? true : false;
      amount = (typeof(amount) === 'number') ? Math.abs(Math.floor(amount)) : 1;
      if (pos_c === 0 && pos_r === 0){return;}

      for (var i=0; i < amount; i++){
	if (this.shiftC(-1, wrap) === true){
	  term.clearCell(left + pos_c, top + pos_r);
	} else {break;}
      }
    };

    this.clear = function(){
      term.clearRegion(left, top, width, height);
    };

    this.clearRegion = function(c, r, w, h){
      var _c = c;
      if (_c < 0){
	_c = 0;
      } else if (_c >= width){
	_c = width - 1;
      }

      var _r = r;
      if (_r < 0){
	_r = 0;
      } else if (_r >= height){
	_r = height - 1;
      }

      var _w = (_c + w < width) ? w : width - _c;
      var _h = (_r + h < height) ? h : height - _r;

      term.clearRegion(_c+left, _r+top, _w, _h);
    };

    this.set = function(code, wrap_type, options){
      var wrap = (wrap_type === Cursor.WRAP_TYPE_NOWRAP || wrap_type === Cursor.WRAP_TYPE_CHARACTER) ? wrap_type : Cursor.WRAP_TYPE_NOWRAP;
      term.set(left + pos_c, top + pos_r, code, options);
      return this.shiftC(1, wrap);
    };

    this.dataOut = function(data, options){
      if (typeof(data) === 'string'){
	data = data.split('').map(function(i){
	  return i.charCodeAt(0);
	});
      } else if (typeof(data) === 'number' && data >= 0){
	data = [Math.floor(data)];
      }
      if (!(data instanceof Array)){
	throw new TypeError();
      }

      options = (typeof(options) === typeof({})) ? options : {};
      var outop = {};
      if (typeof(options.foreground) !== 'undefined'){
	if (typeof(options.foreground) === 'string' || options.foreground instanceof Color){
	  outop.foreground = new Color(options.foreground);
	}
      }
      if (typeof(options.background) !== 'undefined'){
	if (typeof(options.background) === 'string' || options.background instanceof Color){
	  outop.background = new Color(options.background);
	}
      }
      var wrap = data_wrap_type;
      if (typeof(options.wrap_type) === 'number'){
	if (options.wrap_type === Cursor.WRAP_TYPE_NOWRAP || options.wrap_type === Cursor.WRAP_TYPE_CHARACTER){
	  wrap = options.wrap_type;
	}
      }

      var dlen = data.length;
      for (var i=0; i < dlen; i++){
	term.set(left + pos_c, top + pos_r, data[dlen], outop);
	if (this.shiftC(1, wrap === Cursor.WRAP_TYPE_CHARACTER) === false){
	  break;
	}
      }
    };

    this.textOut = function(text, options){
      if (typeof(text) !== 'string'){
	throw new TypeError();
      }
      options = (typeof(options) === typeof({})) ? options : {};
      var outop = {};
      if (typeof(options.foreground) !== 'undefined'){
	if (typeof(options.foreground) === 'string' || options.foreground instanceof Color){
	  outop.foreground = new Color(options.foreground);
	}
      }
      if (typeof(options.background) !== 'undefined'){
	if (typeof(options.background) === 'string' || options.background instanceof Color){
	  outop.background = new Color(options.background);
	}
      }
      var wrap = text_wrap_type;
      if (typeof(options.wrap_type) === 'number'){
	if (options.wrap_type === Cursor.WRAP_TYPE_NOWRAP || options.wrap_type === Cursor.WRAP_TYPE_CHARACTER || options.wrap_type === Cursor.WRAP_TYPE_WORD){
	  wrap = options.wrap_type;
	}
      }

      var words = text.split(/\s/g);
      var pos = 0;
      for (var w=0; w < words.length; w++){
	var word = words[w];
	var wrap_type = wrap;

	if (wrap_type === Cursor.WRAP_TYPE_WORD){
	  if (word.length > width){
	    wrap_type = Cursor.WRAP_TYPE_CHARACTER;
	  } else if (pos_c + word.length > width){
	    if (this.nl(true) === false){
	      break; // If we couldn't move down a line, we're done.
	    }
	  }
	}
	if (PaintString(word, wrap_type, outop) === false){
	  break; // If the word couldn't be fully painted... we're done.
	}
	// Reset the wrap type if it was changed.
	wrap_type = wrap;

	// Time to handle white space!
	var spacecode = text.charCodeAt(pos+word.length);
	pos += word.length; // Set position to the beginning of the next "word".

	if (spacecode === Cursor.SP_CODE){ // A single space
	  if (this.set(spacecode, wrap_type, outop) === false){break;}
	} else if (spacecode === Cursor.NL_CODE){ // Newline
	  if (wrap_type === Cursor.WRAP_TYPE_NOWRAP || this.nl(nl_auto_cr) === false){break;}
	} else if (spacecode === Cursor.CR_CODE){ // Carriage Return
	  if (pos < text.length && text.charCodeAt(pos+1) === Cursor.NL_CODE){ // Check for an immediately following newline
	    // If one exists, ignore the nl_auto_cr and just do both together (this should allow text to flow as expected whether it's in
	    // windows or postix style).
	    pos += 1;
	    if (wrap_type === Cursor.WRAP_TYPE_NOWRAP || this.nl(true) === false){break;}
	  } else {
	    this.cr();
	  }
	} else if (spacecode === Cursor.TAB_CODE){ // Tab space
	  if (tab_as_spaces === true){
	    for (var i=0; i < tab_size; i++){
	      var breakTextLoop = false;
	      if (this.set(Cursor.SP_CODE, Cursor.WRAP_TYPE_NOWRAP, outop) === false){
		if (wrap_type !== Cursor.WRAP_TYPE_NOWRAP){
		  if (this.nl(true) === false){
		    breakTextLoop = true;
		  }
		  break;
		}
	      }
	    }
	    if (breakTextLoop === true){break;}
	  } else {
	    if (this.shiftC(tab_size, wrap_type) === false){break;}
	  }
	}
	pos += 1;
      }
    };



  }
  Cursor.prototype.constructor = Cursor;

  Cursor.WRAP_TYPE_NOWRAP = 0;
  Cursor.WRAP_TYPE_CHARACTER = 1;
  Cursor.WRAP_TYPE_WORD = 2;

  Cursor.NL_CODE = "\n".charCodeAt(0);
  Cursor.CR_CODE = "\r".charCodeAt(0);
  Cursor.TAB_CODE = "\t".charCodeAt(0);
  Cursor.SP_CODE = " ".charCodeAt(0);

  return Cursor;
});



