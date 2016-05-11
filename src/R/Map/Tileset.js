(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(['src/R/System/Emitter', 'src/R/Graphic/Color'], factory);
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

    def(root, "R.Graphics.Terminal", factory(
      root.R.System.Emitter,
      root.R.Graphics.Color
    ));
  }
})(this, function (Emitter, Color) {

  /*

    [
      {
        "id":"", // Unique string value (UUID)
        "name":"", // Very brief description of tile... Ex. "Wall" or "White Wall"
        "description":"", // A longer (2 line?) description of the tile... Ex. "It's a bloody white tile you git."
        "movability":0, // A number from 0 to 1 which determines the speed at which entities can move across the tile.
        "visibility":0, // A number from 0 to 1 which determines the distance an entity can "see" past this tile.
        "primeglyph":0, // A numerical index between 0 and 255 which identifies the primary glyph to use when rendering this tile.
        "betaglyph":0, // [OPTIONAL] A numerical index equal to or greater than 0 which identified the beta glyph to use when rendering this tile using extended glyph.
        "foregound":"#000000", // [OPTIONAL] A string containing a hexidecimal color value to be used as the tint/foreground glyph color.
        "background":"#000000" // [OPTIONAL] A string containing a hexidecimal color value to be used as the background color of the glyph.
      }, ...
    ]

   */

  function Tileset(){
    Emitter.call(this);

    var tlist = [];

    this.contains = function(id){
      return (tlist.filter(function(i){
        return i.id === id;
      }).length > 0;
    };

    this.set = function(id, name, desc, glyph, move, vis, fg, bg, bglyph){
      if (this.contains(id) === false){
        if (typeof(name) !== 'string' || name.length <= 0){
          throw new TypeError();
        }
        if (typeof(desc) !== 'string'){
          throw new TypeError();
        }
        if (typeof(glyph) !== 'number'){
          throw new TypeError();
        }
        if (glyph < 0 || glyph > 255){
          throw new RangeError();
        }
        if (typeof(move) !== 'number'){
          throw new TypeError();
        }
        if (typeof(vis) !== 'number'){
          throw new TypeError();
        }
        
        var obj = {
          id:id,
          name:name,
          description:desc,
          primeglyph:Math.floor(glyph),
          movability:Math.min(1.0, Math.max(0.0, move)),
          visibility:Math.min(1.0, Math.max(0.0, vis)),
          foreground:null,
          background:null,
          betaglyph:null
        };

        if (typeof(fg) !== 'undefined' && (typeof(fg) === 'string' || fg instanceof Color)){
          obj.foreground = new Color(fg);
        }
        if (typeof(bg) !== 'undefined' && (typeof(bg) === 'string' || bg instanceof Color)){
          obj.background = new Color(bg);
        }

        if (typeof(bglyph) === 'number'){
          if (bglyph < 0){
            throw new RangeError();
          }
          obj.betaglyph = bglyph;
        }

        tlist.push(obj);
      }
    };
  }
  Tileset.prototype.__proto__ = Emitter.prototype;
  Tileset.prototype.constructor = Tileset;
  
});




