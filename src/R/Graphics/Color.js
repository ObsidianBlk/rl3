
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
    
    def(root, "R.Graphics.Color", factory());
  }
})(this, function () {


  function clamp(v, vmin, vmax){
    return Math.min(vmax, Math.max(vmin, v));
  }

  // ------------------------------------------------------
  // NOTE: The following block of functions borrowed from - http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb

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
    
    if (typeof(s_or_o) === 'string'){
      // Decode hex
      s_or_o = Color.HexToRPG(s_or_o);
    } else if (s_or_o instanceof Color){
      s_or_o = s_or_o.object;
    }

    if (typeof(s_or_o) === typeof({})){
      color.r = (typeof(s_or_o.r) === 'number') ? clamp(Math.floor(s_or_o.r), 0, 255) : 0;
      color.g = (typeof(s_or_o.g) === 'number') ? clamp(Math.floor(s_or_o.g), 0, 255) : 0;
      color.b = (typeof(s_or_o.b) === 'number') ? clamp(Math.floor(s_or_o.b), 0, 255) : 0;
      color.a = (typeof(s_or_o.a) === 'number') ? clamp(Math.floor(s_or_o.a), 0, 255) : 0;
    }

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



    this.blend = function(c){
      c = (!(c instanceof Color)) ? new Color(c) : c;
      var alpha = c.af;
      var ainv = 1.0 - alpha;

      color.r = clamp(Math.floor((((color.r*INV_COLOR)*ainv) + ((c.rf)*alpha))*255), 0, 255);
      color.g = clamp(Math.floor((((color.g*INV_COLOR)*ainv) + ((c.gf)*alpha))*255), 0, 255);
      color.b = clamp(Math.floor((((color.b*INV_COLOR)*ainv) + ((c.bf)*alpha))*255), 0, 255);
      color.a = clamp(color.a + c.a, 0, 255);
      return this;
    };

    this.blended = function(c){

    };
  }
  Color.prototype.constructor = Color;

  
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
  
});



