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
      "movability": {
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
      "movability",
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

  
  /*

    [
      {
        "id":"", // Unique string value (UUID)
        "name":"", // Very brief description of tile... Ex. "Wall" or "White Wall"
        "description":"", // A longer (2 line?) description of the tile... Ex. "It's a bloody white tile you git."
	"tags":["string",...], // [OPTIONAL] An array of strings that can be used to identify the purpose or catagory of the tile.
        "moveability":0, // A number from 0 to 1 which determines the speed at which entities can move across the tile.
        "visibility":0, // A number from 0 to 1 which determines the distance an entity can "see" past this tile.
        "primeglyph":0, // A numerical index between 0 and 255 which identifies the primary glyph to use when rendering this tile.
        "betaglyph":0, // [OPTIONAL] A numerical index equal to or greater than 0 which identified the beta glyph to use when rendering this tile using extended glyph.
        "foregound":"#000000", // [OPTIONAL] A string containing a hexidecimal color value to be used as the tint/foreground glyph color.
        "background":"#000000" // [OPTIONAL] A string containing a hexidecimal color value to be used as the background color of the glyph.
      }, ...
    ]

   */


  // Helper Functions!
  function HasTag(tile, tag, ignoreCase){
    if (tag.length > 0 && tile.tag !== null){
      var lctag = tag.toLowerCase();
      for (var i=0; i < tile.tag.length; i++){
	if (ignoreCase === true && tile.tag[i].toLowerCase() === lctag){
	  return true;
	} else if (tile.tag[i] === tag){
	  return true;
	}
      }
    }
    return false;
  }

  function AddTag(tile, tag){
    if (tag.length > 0){
      if (tile.tag === null){
	tile.tag = [];
      }
      if (HasTag(tile, tag, true) === false){
	tile.tag.push(tag);
	return true;
      }
    }
    return false;
  }

  function RemoveTag(tile, tag){
    if (tag.length > 0 && tile.tag !== null){
      var lctag = tag.toLowerCase();
      for (var i=0; i < tile.tag.length; i++){
	if (tile.tag[i].toLowerCase() === lctag){
	  tile.tag.splice(i, 1);
	  return true;
	}
      }
    }
    return false;
  }

  // -------------------------------


  function Tileset(name){
    if (name in TILESETS){
      throw new Error("Tileset with name '" + name + "' already exists.");
    }
    Emitter.call(this);
    TILESETS[name] = this;

    var tlist = [];

    Object.defineProperties(this, {
      "name":{
	get:function(){return name;}
      },
      "tileCount":{
	get:function(){return tlist.length;}
      }
    });

    function GetTileInfoObject(id){
      for (var i=0; i < tlist.length; i++){
	if (tlist[i].data.id === id){
	  return tlist[i];
	}
      }
      return null;
    }

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
        var tile = GetTileInfoObject(data.id);
        if (tile === null){
          tlist.push({data:data});
        } else {
          this.set(data.id, data);
        }
      }
    };

    this.contains = function(id){
      return (tlist.filter(function(i){
        return i.id === id;
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

    this.set = function(id, info){
      var tile = GetTileInfoObject(id);
      if (tile === null){
	tile = {
	  data: {
	    id:id,
	    name:"tile",
	    description:"",
	    primeglyph: 0,
	    betaglyph: -1,
	    moveability: 0.0,
	    visibility: 0.0,
	    foreground: null,
	    background: null,
	    tag: null
	  }
	};
	tile.handler = new Tileset.Tile(this, tile.data);
	// If this is a new tile, confirm all of the required information is present.
	if (typeof(info.name) !== 'string' || info.name.length <= 0){
          throw new TypeError();
        }
        if (typeof(info.description) !== 'string'){
          throw new TypeError();
        }
        if (typeof(info.primeglyph) !== 'number'){
          throw new TypeError();
        }
        if (info.primeglyph < 0 || info.primeglyph > 255){
          throw new RangeError();
        }
        if (typeof(info.moveability) !== 'number'){
          throw new TypeError();
        }
        if (typeof(info.visibility) !== 'number'){
          throw new TypeError();
        }
	tlist.push(tile);
      }

      if (typeof(info.name) === 'string' && info.name.length > 0){
	tile.data.name = info.name;
      }
      if (typeof(info.description) === 'string'){
	tile.data.description = info.description;
      }
      if (typeof(info.primeglyph) === 'number' && info.primeglyph >= 0 && info.primeglyph < 256){
	tile.data.primeglyph = Math.floor(info.primeglyph);
      }
      if (typeof(info.betaglyph) === 'number' && info.betaglyph >= -1){
	tile.data.betaglyph = Math.floor(info.betaglyph);
      }
      if (typeof(info.moveability) === 'number'){
	tile.data.moveability = Math.min(1.0, Math.max(0.0, info.moveability));
      }
      if (typeof(info.visibility) === 'number'){
	tile.data.visibility = Math.min(1.0, Math.max(0.0, info.visibility));
      }
      if (typeof(info.foreground) !== 'undefined' && (typeof(info.foreground) === 'string' || info.foreground instanceof Color)){
        tile.data.foreground = new Color(info.foreground);
      }
      if (typeof(info.background) !== 'undefined' && (typeof(info.background) === 'string' || info.background instanceof Color)){
        tile.data.background = new Color(info.background);
      }
      if (typeof(info.tag) !== 'undefined' && info.tag instanceof Array){
	if (info.tag.length > 0){
	  for (var i=0; i < info.tag.length; i++){
	    AddTag(tile.data, info.tag);
	  }
	}
      }
    };

    this.get = function(id){
      var tile = GetTileInfoObject(id);
      return (tile !== null) ? tile.handler : null;
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
    } else {
      if (Tileset.Exists(data.name) === false){
        var ts = new Tileset(data.name);
        data.tiles.forEach(function(t){
          ts.add(t);
        });
      } else {
        throw new Error("Tileset '" + data.name + "' already defined.");
      }
    }
  };



  /* ----------------------------------------------------------------------------------------------------------------------------------------------
     
     --------------------------------------------------------------------------------------------------------------------------------------------*/

  Tileset.Tile = function(tileset, obj){
    Emitter.call(this);

    if (!(tileset instanceof Tileset)){
      throw new TypeError("Expected a tileset.");
    }

    this.hasTag = function(tag, ignoreCase){
      if (obj.id === null){throw new Error("Tile Handler Invalid");}
      return HasTag(obj, tag, ignoreCase);
    };

    this.addTag = function(tag){
      if (obj.id === null){throw new Error("Tile Handler Invalid");}
      if (AddTag(obj, tag) === true){
	this.emit("changed", "tag", tag, false);
      }
    };

    this.removeTag = function(tag, ignoreCase){
      if (obj.id === null){throw new Error("Tile Handler Invalid");}
      if (RemoveTag(obj, tag, ignoreCase) === true){
	this.emit("changed", "tag", tag, true);
      }
    };

    /*this.set = function(info){
      if (obj.id === null){throw new Error("Tile Handler Invalid");}
      var changed = [];
      if (typeof(info.name) === 'string' && info.name.length > 0){
	obj.name = info.name;
	changed.push("name");
      }
      if (typeof(info.description) === 'string'){
	obj.description = info.description;
	changed.push("description");
      }
      if (typeof(info.primeglyph) === 'number' && info.primeglyph >= 0 && info.primeglyph < 256){
	obj.primeglyph = Math.floor(info.primeglyph);
	changed.push("primeglyph");
      }
      if (typeof(info.betaglyph) === 'number' && info.betaglyph >= -1){
	obj.betaglyph = Math.floor(info.betaglyph);
	changed.push("betaglyph");
      }
      if (typeof(info.moveability) === 'number'){
	obj.moveability = Math.min(1.0, Math.max(0.0, info.movability));
	changed.push("movability");
      }
      if (typeof(info.visibility) === 'number'){
	obj.visibility = Math.min(1.0, Math.max(0.0, info.visibility));
	changed.push("visibility");
      }
      if (typeof(info.foreground) !== 'undefined' && (typeof(info.foreground) === 'string' || info.foreground instanceof Color)){
        obj.foreground = new Color(info.foreground);
	changed.push("foreground");
      }
      if (typeof(info.background) !== 'undefined' && (typeof(info.background) === 'string' || info.background instanceof Color)){
        obj.background = new Color(info.background);
	changed.push("background");
      }
      if (typeof(info.tag) !== 'undefined' && info.tag instanceof Array){
	if (info.tag.length > 0){
	  var found = false;
	  for (var i=0; i < info.tag.length; i++){
	    if (AddTag(obj, info.tag) === true && found === false){
	      found = true;
	      changed.push("tag");
	    }
	  }
	}
      }

      if (changed.length > 0){
	this.emit("changed", changed);
      }
    };*/

    Object.defineProperties(this, {
      "valid":{
	get:function(){return obj.id !== null;}
      },
      "tileset":{
	get:function(){return tileset;}
      },
      "id":{
	get:function(){return obj.id;}
      },
      "name":{
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
	get:function(){return obj.betaglyph;},
	set:function(g){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
	  if (typeof(g) !== 'number'){
	    throw new TypeError("Expecting Number Type.");
	  }
	  if (g < 0){
	    throw new RangeError("Value out of range.");
	  }
	  obj.betaglyph = Math.floor(g);
	  this.emit("changed", "betaglyph");
	}
      },
      "foreground":{
	get:function(){
	  return (obj.foreground === null) ? null : obj.foreground.clone();
	},
	set:function(fg){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
	  if (fg === null){
	    obj.foreground = null;
	  } else if (typeof(fg) === 'string'){
	    obj.foreground = new Color(fg);
	  } else if (fg instanceof Color){
	    obj.foreground = fg.clone();
	  } else {
	    throw new TypeError("Expecting null, string, or Color type.");
	  }
	  this.emit("changed", "foreground");
	}
      },
      "background":{
	get:function(){
	  return (obj.background === null) ? null : obj.background.clone();
	},
	set:function(bg){
	  if (obj.id === null){throw new Error("Tile Handler Invalid");}
	  if (bg === null){
	    obj.background = null;
	  } else if (typeof(bg) === 'string'){
	    obj.background = new Color(bg);
	  } else if (bg instanceof Color){
	    obj.background = bg.clone();
	  } else {
	    throw new TypeError("Expecting null, string, or Color type.");
	  }
	  this.emit("changed", "background");
	}
      },
      "tag":{
	get:function(){
	  return (obj.tag !== null) ? JSON.parse(JSON.stringify(obj.tag)) : [];
	}
      },
      "tagCount":{
	get:function(){
	  return (obj.tag !== null) ? obj.tag.length : 0;
	}
      }
    });
  };
  Tileset.Tile.prototype.__proto__ = Emitter.prototype;
  Tileset.Tile.prototype.constructor = Tileset.Tile;


  return Tileset;
  
});




