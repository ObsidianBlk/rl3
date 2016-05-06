
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(['src/R/System/Emitter'], factory);
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
	require('src/R/System/Emitter.js')
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
    def(root, "R.Graphics.Glyph", factory(root.R.System.Emitter));
  }
})(this, function (Emitter) {

  function mergeObjectValues(dst, src){
    var key = Object.keys(dst);
    for (var i=0; i < key.length; i++){
      if (typeof(src[key[i]]) !== 'undefined'){
	dst[key[i]] = src[key[i]];
      }
    }
  }
  
  function Glyph(){
    Emitter.call(this);

    var info = {
      cell_width: 0,
      cell_height: 0,
      spacing_x:0,
      spacing_y:0,
      offset_x:0,
      offset_y:0
    };

    // An Image() object
    var img = null;

    // The number of "cells" contained in the image.
    var elementCount = 0;

    // The number of elements across
    var elementsAcross = 0;

    // The number of elements down
    var elementsDown = 0;

    // A canvas buffer.
    var buffer = null;

    // The 2D context of the above buffer.
    var buffer_context = null;

    // True if actively loading an image.
    var loading = false;

    this.load = function(src, options){
      if (loading === true || buffer !== null){return;}

      mergeObjectValues(info, (typeof(options) === typeof({})) ? options : {});
      if (info.cell_width <= 0 || info.cell_height <= 0){
	throw new RangeError("Cell size must be greater than 0.");
      }
      loading = true;

      img = new Image();
      img.onload = (function(){
	if (img.width < info.cell_width + info.offset_x || img.height < info.cell_height + info.offset_y){
	  img = null;
	  loading = false;
	  this.emit("error", new RangeError("Image too small for cell values."));
	} else {
	  buffer = document.createElement("canvas");
	  buffer.width = img.width;
	  buffer.height = img.height;
	  buffer_context = buffer.getContext('2d');
	  buffer_context.drawImage(img, 0, 0, img.width, img.height);
	  elementsAcross = (img.width - info.offset_x) / (info.cell_width + info.spacing_x);
	  if ((img.width - info.offset_x) - (elementsAcross * (info.cell_width + info.spacing_x)) >= info.cell_width){
	    elementsAcross += 1;
	  }
	  elementsDown = (img.height - info.offset_y) / (info.cell_height + info.spacing_y);
	  if ((img.height - info.offset_y) - (elementsDown * (info.cell_height + info.spacing_y)) >= info.cell_height){
	    elementsDown += 1;
	  }
	  elementCount = elementsDown*elementsAcross;
	  loading = false;
	  this.emit("ready");
	}
      }).bind(this);

      img.onerror = (function(err){
	loading = false;
	img = null;
	this.emit("error", err);
      }).bind(this);

      // This kicks the image loading into gear.
      img.src = src;
    };

    this.get = function(index){
      var obj = null;
      if (index >= 0 && index < elementCount){
        
        var x = info.offset_x + ((index%elementsAcross)*(info.cell_width+info.spacing_x));
        var y = info.offset_y + (Math.floor(index/elementsAcross)*(info.cell_height+info.spacing_y));
        var pixels = null;
        var self = this;

        obj = {};
        Object.defineProperties(obj, {
          "parent":{
            get:function(){return self;}
          },
          
          "x":{
            get:function(){return x;}
          },

          "y":{
            get:function(){return y;}
          },

          "w":{
            get:function(){return info.cell_width;}
          },

          "h":{
            get:function(){return info.cell_height;}
          },

          "index":{
            get:function(){return index;}
          },

          "pixels":{
            get:function(){
	      if (pixels === null){
	        pixels = buffer_context.getImageData(x, y, info.cell_width, info.cell_height);
	      }
	      var cpy = buffer_context.createImageData(pixels.width, pixels.height);
	      cpy.data.set(pixels.data);
	      return cpy;
	    }
          }
        });
      }
      return obj;
    };


    Object.defineProperties(this, {
      "src":{
        get:function(){return (img !== null) ? img.src : "";}
      },

      "loading":{
        get:function(){
          return loading;
        }
      },

      "loaded":{
        get:function(){
          return (loading === false && buffer !== null && img !== null);
        }
      },

      "cell_width":{
        get:function(){return info.cell_width;}
      },

      "cell_height":{
        get:function(){return info.cell_height;}
      },

      "elements":{
        get:function(){return elementCount;}
      }
    });
  }
  Glyph.prototype.__proto__ = Emitter.prototype;
  Glyph.prototype.constructor = Glyph;

  return Glyph;
});


