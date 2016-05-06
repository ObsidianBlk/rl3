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
    if (exists(root, "R.Graphics.Terminal") === false){
      throw new Error("Missing required object");
    }
    def(root, "R.Graphics.Terminal", factory(
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
      "region":{
	get:function(){
	  return {
	    top:top,
	    left:left,
	    bottom:bottom,
	    right:right
	  };
	}
      }
    });


    this.position = function(c, r){
      if (typeof(c) === 'number'){
	if (c >= 0 && c < width){
	  pos_c = Math.floor(c);
	}
      }
      if (typeof(r) === 'number'){
	if (r >= 0 && r < height){
	  pos_r = Math.floor(r);
	}
      }
      return {c:pos_c, r:pos_r};
    };

    this.cr = function(){
      pos_c = 0;
    };

    this.nl = function(autoCR){
      if (pos_r + 1 >= height){
	return false;
      }
      pos_r += 1;

      if (autoCR === true){
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

    this.set = function(code, options){
      options = (typeof(options) === typeof({})) ? options : null;
      var outop = {};
      if (typeof(options.foreground) === 'string' || options.foreground instanceof Color){
	outop.foreground = new Color(options.foreground);
      }
      if (typeof(options.background) === 'string' || options.background instanceof Color){
	outop.background = new Color(options.background);
      }
      var wrap = data_wrap_type;
      if (typeof(options.wrap_type) === 'number'){
	if (options.wrap_type === Cursor.WRAP_TYPE_NOWRAP || options.wrap_type === Cursor.WRAP_TYPE_CHARACTER){
	  wrap = options.wrap_type;
	}
      }

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

      options = (typeof(options) === typeof({})) ? options : null;
      var outop = {};
      if (typeof(options.foreground) === 'string' || options.foreground instanceof Color){
	outop.foreground = new Color(options.foreground);
      }
      if (typeof(options.background) === 'string' || options.background instanceof Color){
	outop.background = new Color(options.background);
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
      options = (typeof(options) === typeof({})) ? options : null;
      var outop = {};
      if (typeof(options.foreground) === 'string' || options.foreground instanceof Color){
	outop.foreground = new Color(options.foreground);
      }
      if (typeof(options.background) === 'string' || options.background instanceof Color){
	outop.background = new Color(options.background);
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
	  if (typeof(outop.background) !== 'undefined'){
	    this.set(spacecode, outop);
	  }
	} else if (spacecode === Cursor.NL_CODE){ // Newline
	  
	} else if (spacecode === Cursor.CR_CODE){ // Carriage Return

	} else if (spacecode === Cursor.TAB_CODE){ // Tab space

	}
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



