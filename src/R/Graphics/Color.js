
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
    return (v < vmin) ? vmin : (v > vmax) ? vmax : v;
    //return Math.min(vmax, Math.max(vmin, v));
  }

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  var INV_COLOR = 1/255;
  
  function Color(s_or_o){

    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 255;

    Object.defineProperties(this, {
      "hex":{
        get:function(){return Color.RGBToHex(this.r, this.g, this.b);},
        set:function(hex){
          if (typeof(hex) === 'string'){
            var c = Color.HexToRGB(hex);
            if (c !== null){
              this.r = c.r;
              this.g = c.g;
              this.b = c.b;
            }
          }
        }
      },

      "rf":{
        get:function(){return this.r * INV_COLOR;},
        set:function(r){
          if (typeof(r) === 'number'){
            r = clamp(r, 0.0, 1.0);
            this.r = Math.floor(r*255);
          } 
        }
      },

      "gf":{
        get:function(){return this.g * INV_COLOR;},
        set:function(g){
          if (typeof(g) === 'number'){
            this.g = Math.floor(g*255);
          } 
        }
      },

      "bf":{
        get:function(){return this.b * INV_COLOR;},
        set:function(b){
          if (typeof(b) === 'number'){
            this.b = Math.floor(b*255);
          } 
        }
      },

      "af":{
        get:function(){return this.a * INV_COLOR;},
        set:function(a){
          if (typeof(a) === 'number'){
            this.a = Math.floor(a*255);
          } 
        }
      },

      "json":{
	get:function(){return JSON.stringify({r:this.r, g:this.g, b:this.b, a:this.a});},
	set:function(jsonstr){
	  try {
	    var co = JSON.parse(jsonstr);
	    if (typeof(co.r) === 'number'){
	      this.r = clamp(co.r, 0, 255);
	    }
	    if (typeof(co.g) === 'number'){
	      this.g = clamp(co.g, 0, 255);
	    }
	    if (typeof(co.b) === 'number'){
	      this.b = clamp(co.b, 0, 255);
	    }
	    if (typeof(co.a) === 'number'){
	      this.a = clamp(co.a, 0, 255);
	    }
	  } catch (e) {
	    throw new Error("Failed to parse Color from JSON string: " & e.message);
	  }
	}
      },

      "object":{
        get:function(){
          return {r:this.r, g:this.g, b:this.b, a:this.a};
        },
        set:function(obj){
          if (typeof(obj) === typeof({})){
            this.r = (typeof(obj.r) === 'number') ? clamp(Math.floor(obj.r), 0, 255) : 0;
            this.g = (typeof(obj.g) === 'number') ? clamp(Math.floor(obj.g), 0, 255) : 0;
            this.b = (typeof(obj.b) === 'number') ? clamp(Math.floor(obj.b), 0, 255) : 0;
            this.a = (typeof(obj.a) === 'number') ? clamp(Math.floor(obj.a), 0, 255) : 0;
          }
        }
      }
    });


    this.black = function(alpha){
      this.r = 0;
      this.g = 0;
      this.b = 0;
      this.a = (typeof(alpha) === 'number') ? clamp(Math.floor(alpha), 0, 255) : 255;
      return this;
    };

    this.white = function(alpha){
      this.r = 255;
      this.g = 255;
      this.b = 255;
      this.a = (typeof(alpha) === 'number') ? clamp(Math.floor(alpha), 0, 255) : 255;
      return this;
    };

    this.set = function(data){	
      if (data instanceof Color){
	this.r = data.r;
        this.g = data.g;
        this.b = data.b;
        this.a = data.a;
      } else {
        if (typeof(data) === 'string'){
          data = Color.HexToRGB(data);
        }
        if (typeof(data) === typeof({})){
	  this.r = (typeof(data.r) === 'number') ? clamp(Math.floor(data.r), 0, 255) : 0;
	  this.g = (typeof(data.g) === 'number') ? clamp(Math.floor(data.g), 0, 255) : 0;
	  this.b = (typeof(data.b) === 'number') ? clamp(Math.floor(data.b), 0, 255) : 0;
	  this.a = (typeof(data.a) === 'number') ? clamp(Math.floor(data.a), 0, 255) : 255;
        }
      }
      return this;
    };

    this.setRGBA = function(r, g, b, a){
      this.r = clamp(Math.floor(r), 0, 255);
      this.g = clamp(Math.floor(g), 0, 255);
      this.b = clamp(Math.floor(b), 0, 255);
      this.a = clamp(Math.floor(a), 0, 255);
      return this;
    };

    this.clone = function(){
      return new Color(this);
    };

    this.invert = function(){
      this.r = 255 - this.r;
      this.g = 255 - this.g;
      this.b = 255 - this.b;
      return this;
    };

    this.inverted = function(){
      return (new Color(this)).invert();
    };

    this.blend = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      var alpha = c.a*INV_COLOR;
      var ainv = 1.0 - alpha;

      this.r = clamp(Math.floor((((this.r*INV_COLOR)*ainv) + (c.r*INV_COLOR*alpha))*255), 0, 255);
      this.g = clamp(Math.floor((((this.g*INV_COLOR)*ainv) + (c.g*INV_COLOR*alpha))*255), 0, 255);
      this.b = clamp(Math.floor((((this.b*INV_COLOR)*ainv) + (c.b*INV_COLOR*alpha))*255), 0, 255);
      this.a = clamp(this.a + c.a, 0, 255);
      return this;
    };

    this.blended = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      var alpha = c.af;
      var ainv = 1.0 - alpha;

      return new Color({
	r: Math.floor((((this.r*INV_COLOR)*ainv) + (c.rf*alpha))*255),
	g: Math.floor((((this.g*INV_COLOR)*ainv) + (c.gf*alpha))*255),
	b: Math.floor((((this.b*INV_COLOR)*ainv) + (c.bf*alpha))*255),
	a: clamp(this.a + c.a, 0, 255)
      });
    };

    this.add = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      this.r = clamp(this.r + c.r, 0, 255);
      this.g = clamp(this.g + c.g, 0, 255);
      this.b = clamp(this.b + c.b, 0, 255);
      this.a =  clamp(this.a + c.a, 0, 255);
      return this;
    };

    this.added = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      return new Color({
	r: clamp(this.r + c.r, 0, 255),
	g: clamp(this.g + c.g, 0, 255),
	b: clamp(this.b + c.b, 0, 255),
	a: clamp(this.a + c.a, 0, 255)
      });
    };

    this.multiply = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      this.r = Math.floor(((this.r*INV_COLOR) * c.r*INV_COLOR) * 255);
      this.g = Math.floor(((this.g*INV_COLOR) * c.g*INV_COLOR) * 255);
      this.b = Math.floor(((this.b*INV_COLOR) * c.b*INV_COLOR) * 255);
      this.a = clamp(Math.floor(((this.a*INV_COLOR) * c.a*INV_COLOR) * 255), 0, 255);
      return this;
    };

    this.multiplied = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      return new Color({
	r: Math.floor(((this.r*INV_COLOR) * c.rf) * 255),
	g: Math.floor(((this.g*INV_COLOR) * c.gf) * 255),
	b: Math.floor(((this.b*INV_COLOR) * c.bf) * 255),
	a: clamp(Math.floor(((this.a*INV_COLOR) * c.af) * 255), 0, 255)
      });
    };

    this.scale = function(scale){
      scale = (typeof(scale) === 'number') ? clamp(scale, 0.0, 1.0) : 1.0;
      this.r = Math.floor(this.r * scale);
      this.g = Math.floor(this.g * scale);
      this.b = Math.floor(this.b * scale);
      return this;
    };

    this.scaled = function(scale){
      scale = (typeof(scale) === 'number') ? clamp(scale, 0.0, 1.0) : 1.0;
      return new Color({
	r: Math.floor(this.r * scale),
	g: Math.floor(this.g * scale),
	b: Math.floor(this.b * scale)
      });
    };

    this.eq = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      return (c.r === this.r && c.g === this.g && c.b === this.b && c.a === this.a);
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



