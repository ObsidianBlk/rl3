
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory();
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.R.Browser) === 'undefined'){
      throw new Error("Missing R initilization.");
    }
    root.R.Browser.def(root, "R.Graphics.Color", factory());
  }
})(this, function () {


  function clamp(v, vmin, vmax){
    return Math.min(vmax, Math.max(vmin, v));
  }

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  var INV_COLOR = 1/255;
  
  function Color(s_or_o){

    var color = {
      r: 0,
      g: 0,
      b: 0,
      a: 255
    };

    Object.defineProperties(this, {
      "hex":{
        get:function(){return Color.RGBToHex(color.r, color.g, color.b);},
        set:function(hex){
          if (typeof(hex) === 'string'){
            var c = Color.HexToRGB(hex);
            if (c !== null){
              color.r = c.r;
              color.g = c.g;
              color.b = c.b;
            }
          }
        }
      },
      
      "r":{
        get:function(){return color.r;},
        set:function(r){
          if (typeof(r) === 'number'){
            color.r = clamp(Math.floor(r), 0, 255);
          }
        }
      },

      "rf":{
        get:function(){return color.r * INV_COLOR;},
        set:function(r){
          if (typeof(r) === 'number'){
            r = clamp(r, 0.0, 1.0);
            color.r = clamp(Math.floor(r*255), 0, 255);
          } 
        }
      },

      "g":{
        get:function(){return color.g;},
        set:function(g){
          if (typeof(g) === 'number'){
            color.g = clamp(Math.floor(g), 0, 255);
          }
        }
      },

      "gf":{
        get:function(){return color.g * INV_COLOR;},
        set:function(g){
          if (typeof(g) === 'number'){
            g = clamp(g, 0.0, 1.0);
            color.g = clamp(Math.floor(g*255), 0, 255);
          } 
        }
      },

      "b":{
        get:function(){return color.b;},
        set:function(b){
          if (typeof(b) === 'number'){
            color.b = clamp(Math.floor(b), 0, 255);
          }
        }
      },

      "bf":{
        get:function(){return color.b * INV_COLOR;},
        set:function(b){
          if (typeof(b) === 'number'){
            b = clamp(b, 0.0, 1.0);
            color.b = clamp(Math.floor(b*255), 0, 255);
          } 
        }
      },

      "a":{
        get:function(){return color.a;},
        set:function(a){
          if (typeof(a) === 'number'){
            color.a = clamp(Math.floor(a), 0, 255);
          }
        }
      },

      "af":{
        get:function(){return color.a * INV_COLOR;},
        set:function(a){
          if (typeof(a) === 'number'){
            a = clamp(a, 0.0, 1.0);
            color.a = clamp(Math.floor(a*255), 0, 255);
          } 
        }
      },

      "json":{
	get:function(){return JSON.stringify(color);},
	set:function(jsonstr){
	  try {
	    var co = JSON.parse(jsonstr);
	    if (typeof(co.r) === 'number'){
	      color.r = clamp(co.r, 0, 255);
	    }
	    if (typeof(co.g) === 'number'){
	      color.g = clamp(co.g, 0, 255);
	    }
	    if (typeof(co.b) === 'number'){
	      color.b = clamp(co.b, 0, 255);
	    }
	    if (typeof(co.a) === 'number'){
	      color.a = clamp(co.a, 0, 255);
	    }
	  } catch (e) {
	    throw new Error("Failed to parse Color from JSON string: " & e.message);
	  }
	}
      },

      "object":{
        get:function(){
          return JSON.parse(JSON.stringify(color));
        },
        set:function(obj){
          if (typeof(obj) === typeof({})){
            color.r = (typeof(obj.r) === 'number') ? clamp(Math.floor(obj.r), 0, 255) : 0;
            color.g = (typeof(obj.g) === 'number') ? clamp(Math.floor(obj.g), 0, 255) : 0;
            color.b = (typeof(obj.b) === 'number') ? clamp(Math.floor(obj.b), 0, 255) : 0;
            color.a = (typeof(obj.a) === 'number') ? clamp(Math.floor(obj.a), 0, 255) : 0;
          }
        }
      }
    });


    this.black = function(alpha){
      color.r = 0;
      color.g = 0;
      color.b = 0;
      color.a = (typeof(alpha) === 'number') ? clamp(Math.floor(alpha), 0, 255) : 255;
      return this;
    };

    this.white = function(alpha){
      color.r = 255;
      color.g = 255;
      color.b = 255;
      color.a = (typeof(alpha) === 'number') ? clamp(Math.floor(alpha), 0, 255) : 255;
      return this;
    };

    this.set = function(data){
      if (typeof(data) === 'string'){
	// Decode hex
	data = Color.HexToRGB(data);
      } else if (data instanceof Color){
	data = data.object;
      }

      if (typeof(data) === typeof({})){
	color.r = (typeof(data.r) === 'number') ? clamp(Math.floor(data.r), 0, 255) : 0;
	color.g = (typeof(data.g) === 'number') ? clamp(Math.floor(data.g), 0, 255) : 0;
	color.b = (typeof(data.b) === 'number') ? clamp(Math.floor(data.b), 0, 255) : 0;
	color.a = (typeof(data.a) === 'number') ? clamp(Math.floor(data.a), 0, 255) : 255;
      }
      return this;
    };

    this.setRGBA = function(r, g, b, a){
      color.r = clamp(Math.floor(r), 0, 255);
      color.g = clamp(Math.floor(g), 0, 255);
      color.b = clamp(Math.floor(b), 0, 255);
      color.a = clamp(Math.floor(a), 0, 255);
      return this;
    };

    this.clone = function(){
      return (new Color()).setRGBA(color.r, color.g, color.b, color.a);
    };

    this.blend = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      var alpha = c.af;
      var ainv = 1.0 - alpha;

      color.r = clamp(Math.floor((((color.r*INV_COLOR)*ainv) + (c.rf*alpha))*255), 0, 255);
      color.g = clamp(Math.floor((((color.g*INV_COLOR)*ainv) + (c.gf*alpha))*255), 0, 255);
      color.b = clamp(Math.floor((((color.b*INV_COLOR)*ainv) + (c.bf*alpha))*255), 0, 255);
      color.a = clamp(color.a + c.a, 0, 255);
      return this;
    };

    this.blended = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      var alpha = c.af;
      var ainv = 1.0 - alpha;

      return new Color({
	r: Math.floor((((color.r*INV_COLOR)*ainv) + (c.rf*alpha))*255),
	g: Math.floor((((color.g*INV_COLOR)*ainv) + (c.gf*alpha))*255),
	b: Math.floor((((color.b*INV_COLOR)*ainv) + (c.bf*alpha))*255),
	a: clamp(color.a + c.a, 0, 255)
      });
    };

    this.add = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      color.r = clamp(color.r + c.r, 0, 255);
      color.g = clamp(color.g + c.g, 0, 255);
      color.b = clamp(color.b + c.b, 0, 255);
      color.a =  clamp(color.a + c.a, 0, 255);
      return this;
    };

    this.added = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      return new Color({
	r: clamp(color.r + c.r, 0, 255),
	g: clamp(color.g + c.g, 0, 255),
	b: clamp(color.b + c.b, 0, 255),
	a: clamp(color.a + c.a, 0, 255)
      });
    };

    this.multiply = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      color.r = Math.floor(((color.r*INV_COLOR) * c.rf) * 255);
      color.g = Math.floor(((color.g*INV_COLOR) * c.gf) * 255);
      color.b = Math.floor(((color.b*INV_COLOR) * c.bf) * 255);
      color.a = clamp(Math.floor(((color.a*INV_COLOR) * c.af) * 255), 0, 255);
      return this;
    };

    this.multiplied = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      return new Color({
	r: Math.floor(((color.r*INV_COLOR) * c.rf) * 255),
	g: Math.floor(((color.g*INV_COLOR) * c.gf) * 255),
	b: Math.floor(((color.b*INV_COLOR) * c.bf) * 255),
	a: clamp(Math.floor(((color.a*INV_COLOR) * c.af) * 255), 0, 255)
      });
    };

    this.scale = function(scale){
      scale = (typeof(scale) === 'number') ? clamp(scale, 0.0, 1.0) : 1.0;
      color.r = Math.floor(color.r * scale);
      color.g = Math.floor(color.g * scale);
      color.b = Math.floor(color.b * scale);
      return this;
    };

    this.scaled = function(scale){
      scale = (typeof(scale) === 'number') ? clamp(scale, 0.0, 1.0) : 1.0;
      return new Color({
	r: Math.floor(color.r * scale),
	g: Math.floor(color.g * scale),
	b: Math.floor(color.b * scale)
      });
    };


    // Now that everything is setup, we finally set to the s_or_o passed in :)
    if (typeof(s_or_o) !== 'undefined' && s_or_o !== null){
      this.set(s_or_o);
    }
  }
  Color.prototype.constructor = Color;


  // ------------------------------------------------------
  // NOTE: The following block of functions borrowed from - http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb

  Color.RGBToHex = function(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  };

  Color.HexToRGB = function(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };


  return Color;
  
});



