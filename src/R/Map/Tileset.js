(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'tv4',
      'src/R/System/Emitter',
      'src/R/Graphics/Color'
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
        require('tv4'),
	require('src/R/System/Emitter'),
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
      "tv4",
      "R.System.Emitter",
      "R.Graphics.Color"
    ]) === false){
      throw new Error("Missing required object");
    }

    root.R.Browser.def(root, "R.Map.Tileset", factory(
      root.tv4,
      root.R.System.Emitter,
      root.R.Graphics.Color
    ));
  }
})(this, function (tv4, Emitter, Color) {

  var TILE_SCHEMA = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "id":{
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "primeglyph": {
        "type": "integer",
        "minimum":0,
        "maximum":255
      },
      "betaglyph": {
        "type": "integer",
        "minimum":0
      },
      "moveability": {
        "type": "number",
        "minimum":0.0,
        "maximum":1.0
      },
      "visibility": {
        "type": "number",
        "minimum":0.0,
        "maximum":1.0
      },
      "foreground": {
        "type": ["string", "null"]
      },
      "background": {
        "type": ["string", "null"]
      }
    },
    "required": [
      "name",
      "description",
      "primeglyph",
      "moveability",
      "visibility",
      "foreground",
      "background"
    ]
  };

  var TILESET_SCHEMA = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "description":{
        "type": "string"
      },
      "tiles": {
        "type": "array",
        "items": TILE_SCHEMA
      }
    },
    "required": [
      "name",
      "tiles"
    ]
  };


  var TILESETS = {};

  // -------------------------------


  function Tileset(name, description){
    if (name in TILESETS){
      throw new Error("Tileset with name '" + name + "' already exists.");
    }
    Emitter.call(this);
    TILESETS[name] = this;

    description = (typeof(description) === 'string') ? description : "";
    var tlist = [];

    Object.defineProperties(this, {
      "name":{
	get:function(){return name;}
      },

      "description":{
        enumerable:true,
        get:function(){return description;}
      },
      
      "tileCount":{
	get:function(){return tlist.length;}
      }
    });

    this.add = function(data){
      if (typeof(data) === 'string'){
        try{
          data = JSON.parse(data);
        } catch (e) {
          console.error(e.message);
          return;
        }
      }

      var valid = tv4.validate(data, TILE_SCHEMA);
      if (valid === false){
        console.error(tv4.error);
      } else {
        var tile = this.get(data.id);
        if (tile === null){
          tlist.push({data:data, tile:new Tileset.Tile(this, data)});
        } else {
          throw new Error("Tile with id '" + data.id + "' already in tileset.");
        }
      }
    };

    this.contains = function(id){
      return (tlist.filter(function(i){
        return i.data.id === id;
      })).length > 0;
    };

    this.remove = function(id){
      for (var i=0; i < tlist.length; i++){
	if (tlist[i].data.id === id){
	  tlist[i].data.id = null; // This will invalidate any handlers being used.
	  tlist.splice(i, 1);
	  break;
	}
      }
    };

    this.get = function(id){
      for (var i=0; i < tlist.length; i++){
	if (tlist[i].data.id === id){
	  return tlist[i].tile;
	}
      }
      return null;
    };

    this.json = function(){
      return JSON.stringify({
        name:name,
        description:description,
        tiles:tlist.map(function(i){
          return i.data;
        })
      });
    };
  }
  Tileset.prototype.__proto__ = Emitter.prototype;
  Tileset.prototype.constructor = Tileset;

  Tileset.Exists = function(name){
    return (name in TILESETS);
  };

  Tileset.Get = function(name){
    if (name in TILESETS){
      return TILESETS[name];
    }
    return null;
  };

  Tileset.FromJSON = function(data){
    if (typeof(data) === 'string'){
      try{
        data = JSON.parse(data);
      } catch (e) {
        console.error(e.message);
        throw new Error("String failed to parse as JSON.");
      }
    }

    var valid = tv4.validate(data, TILESET_SCHEMA);
    if (valid === false){
      console.error(tv4.error);
      throw new Error("JSON data does not match Tileset schema.");
    }

    var ts = null;
    if (Tileset.Exists(data.name) === false){
      ts = new Tileset(data.name);
      data.tiles.forEach(function(t){
        ts.add(t);
      });
    } else {
      throw new Error("Tileset '" + data.name + "' already defined.");
    }
    return ts;
  };



  /* ----------------------------------------------------------------------------------------------------------------------------------------------
     
     --------------------------------------------------------------------------------------------------------------------------------------------*/

  Tileset.Tile = function(tileset, obj){
    Emitter.call(this);

    if (!(tileset instanceof Tileset)){
      throw new TypeError("Expected a tileset.");
    }

    Object.defineProperties(this, {
      "valid":{
        enumerable:true,
	get:function(){return obj.id !== null;}
      },
      "tileset":{
        enumerable:true,
	get:function(){return tileset;}
      },
      "id":{
        enumerable:true,
	get:function(){return obj.id;}
      },
      "name":{
        enumerable:true,
	get:function(){return obj.name;},
	set:function(name){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
	  if (typeof(name) !== 'string'){
	    throw new TypeError("Expecting String Type.");
	  }
	  if (name.length <= 0){
	    throw new Error("Zero length string not allowed.");
	  }
	  obj.name = name;
	  this.emit("changed", "name");
	}
      },
      "description":{
        enumerable:true,
	get:function(){return obj.description;},
	set:function(desc){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
	  if (typeof(desc) !== 'string'){
	    throw new TypeError("Expecting String Type.");
	  }
	  obj.description = desc;
	  this.emit("changed", "description");
	}
      },
      "moveability":{
        enumerable:true,
	get:function(){return obj.moveability;},
	set:function(m){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
	  if (typeof(m) !== 'number'){
	    throw new TypeError("Expecting Number Type.");
	  }
	  obj.moveability = Math.min(1.0, Math.max(0.0, m));
	  this.emit("changed", "moveability");
	}
      },
      "visibility":{
        enumerable:true,
	get:function(){return obj.visibility;},
	set:function(v){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
	  if (typeof(v) !== 'number'){
	    throw new TypeError("Expecting Number Type.");
	  }
	  obj.visibility = Math.min(1.0, Math.max(0.0, v));
	  this.emit("changed", "visibility");
	}
      },
      "primeglyph":{
        enumerable:true,
	get:function(){return obj.primeglyph;},
	set:function(g){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
	  if (typeof(g) !== 'number'){
	    throw new TypeError("Expecting Number Type.");
	  }
	  if (g < 0 || g >= 256){
	    throw new RangeError("Value out of range.");
	  }
	  obj.primeglyph = Math.floor(g);
	  this.emit("changed", "primeglyph");
	}
      },
      "betaglyph":{
        enumerable:true,
	get:function(){return (typeof(obj.betaglyph) === 'undefined') ? null : obj.betaglyph;},
	set:function(g){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
          if (g === null){
            delete obj.betaglyph;
          } else {
	    if (typeof(g) !== 'number'){
	      throw new TypeError("Expecting Number Type.");
	    }
	    if (g < 0){
	      throw new RangeError("Value out of range.");
	    }
	    obj.betaglyph = Math.floor(g);
          }
          this.emit("changed", "betaglyph");
	}
      },
      "foreground":{
        enumerable:true,
	get:function(){
	  return (obj.foreground === null) ? null : new Color(obj.foreground);
	},
	set:function(fg){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
	  if (fg === null){
	    obj.foreground = null;
	  } else if (typeof(fg) === 'string'){
	    obj.foreground = new fg;
	  } else if (fg instanceof Color){
	    obj.foreground = fg.hex;
	  } else {
	    throw new TypeError("Expecting null, string, or Color type.");
	  }
	  this.emit("changed", "foreground");
	}
      },
      "background":{
        enumerable:true,
	get:function(){
	  return (obj.background === null) ? null : new Color(obj.background);
	},
	set:function(bg){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
	  if (bg === null){
	    obj.background = null;
	  } else if (typeof(bg) === 'string'){
	    obj.background = new bg;
	  } else if (bg instanceof Color){
	    obj.background = bg.hex;
	  } else {
	    throw new TypeError("Expecting null, string, or Color type.");
	  }
	  this.emit("changed", "background");
	}
      }
    });
  };
  Tileset.Tile.prototype.__proto__ = Emitter.prototype;
  Tileset.Tile.prototype.constructor = Tileset.Tile;


  return Tileset;
  
});




