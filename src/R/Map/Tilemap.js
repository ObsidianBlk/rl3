(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(['src/R/System/Emitter', 'src/R/Graphics/Color', 'src/R/Map/Tileset'], factory);
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
	require('src/R/Map/Tileset')
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
      "R.Map.Tileset"
    ]) === false){
      throw new Error("Missing required object");
    }

    root.R.Browser.def(root, "R.Map.Tilemap", factory(
      root.R.System.Emitter,
      root.R.Graphics.Color,
      root.R.Map.Tileset
    ));
  }
})(this, function (Emitter, Color, Tileset) {

  function Tilemap(){
    Emitter.call(this);

    var id = null;
    var name = null;
    var width = 0;
    var height = 0;
    var map = null;
    var tile = null;
    
    Object.defineProperties(this, {
      "valid":{get:function(){return (width > 0 && height > 0 && map !== null && tile !== null);}},
      "id":{get:function(){return id;}},
      "name":{get:function(){return name;}},
      "width":{get:function(){return width;}},
      "height":{get:function(){return height;}},
      "tileCount":{get:function(){return (tile !== null) ? tile.length : 0;}}
    });

    this.initialize = function(_id, _name, w, h){
      if (map === null){
	if (w <= 0 || h <= 0){
	  throw new RangeError("Width and/or Height is out of range.");
	}

	id = _id;
	name = _name;

	map = [];
	for (var i=0; i < w*h; i++){
	  map.push({
	    index: -1,
	    seen: false
	  });
	}
	width = w;
	height = h;
      }
      return this;
    };


    this.useTile = function(t){
      if (!(t instanceof Tileset.Tile)){
	throw new TypeError("Expected Tileset.Tile instance.");
      }
      
      if (tile === null){
	tile = [];
	tile.push(t);
	return 0;
      } else {
	for (var i=0; i < tile.length; i++){
	  if (tile[i].id === t.id){
	    return i;
	  }
	}
	tile.push(t);
	return tile.length - 1;
      }

      return -1;
    };

    this.setTile = function(x, y, index_or_tile, markAsSeen){
      if (map === null){
	throw new Error("Map not initialized.");
      }
      if (x < 0 || y < 0 || x >= width || y >= height){
	throw new RangeError("Coordinates out of range.");
      }

      if (index_or_tile instanceof Tileset.Tile){
	index_or_tile = this.useTile(index_or_tile);
      }
      if (typeof(index_or_tile) === 'number'){
	if (index_or_tile < 0 || index_or_tile >= tile.length){
	  throw new RangeError("Tile index is out of range.");
	}

	var index = (width*y) + x;
	map[index].index = index_or_tile;
	if (markAsSeen === true){
	  map[index].seen = true;
	}
      } else {
	throw new TypeError("Expected an index number or Tileset.Tile instance");
      }
      return this;
    };

    this.setTiles = function(index_or_tile, poslist){
      if (map === null){
	throw new Error("Map not initialized.");
      }

      if (index_or_tile instanceof Tileset.Tile){
	index_or_tile = this.useTile(index_or_tile);
      }
      if (typeof(index_or_tile) === 'number'){
	if (index_or_tile < 0 || index_or_tile >= tile.length){
	  throw new RangeError("Tile index is out of range.");
	}
	if (poslist.length%2 > 0){
	  throw new RangeError("Expected an array of power 2.");
	}
	var pcount = Math.floor(poslist.length / 2);
	for (var i=0; i < pcount; i++){
	  var x = poslist[(i*2)];
	  var y = poslist[(i*2)+1];
	  if (x < 0 || y < 0 || x >= width || y >= height){
	    throw new RangeError("Coordinate out of bounds at index " + (i*2) + ".");
	  }
	  map[(y*width) + x].index = index_or_tile;
	}
      } else {
	throw new TypeError("Expected an index number or Tileset.Tile instance");
      }
      return this;
    };

    this.getTile = function(x, y){
      if (map === null){
	throw new Error("Map not initialized.");
      }
      if (x >= 0 && x < width && y >= 0 && y < height){
	var tindex = map[(y*width)+x].index;
	if (tindex >= 0 && tindex < tile.length){
	  return tile[tindex];
	}
      }

      return null;
    };


    this.markTileSeen = function(x, y, showTile){
      if (map === null){
	throw new Error("Map not initialized.");
      }
      if (x < 0 || y < 0 || x >= width || y >= height){
	throw new RangeError("Coordinates out of range.");
      }
      map[(width*y)+x].seen = (showTile === true) ? true : false;
      return this;
    };

    this.markTilesSeen = function(poslist, showTile){
      if (map === null){
	throw new Error("Map not initialized.");
      }
      if (poslist.length%2 > 0){
        throw new RangeError("Position list must be a power of 2.");
      }
      var pcount = poslist.length/2;
      for (var i=0; i < pcount; i++){
        var x = poslist[(i*2)];
        var y = poslist[(i*2)+1];
        if (x < 0 || y < 0 || x >= width || y >= height){
	  throw new RangeError("Coordinates out of range for position index " + (i*2) + ".");
        }
        map[(y*width)+x].seen = (showTile === false) ? false : true;
      }
      return this;
    };

    this.createRoom = function(x, y, w, h, floortile, walltile, onlyOverwriteEmpty){
      if (map === null){
	throw new Error("Map not initialized.");
      }
      if (x < 0 || y < 0 || x >= width || y >= height || x+w > width || y+h > height){
	throw new RangeError("Region out of bounds.");
      }

      if (floortile instanceof Tileset.Tile){
        floortile = this.useTile(floortile);
      }
      if (walltile instanceof Tileset.Tile){
        walltile = this.useTile(walltile);
      }

      if (typeof(floortile) !== 'number' || typeof(walltile) !== 'number'){
        throw new TypeError("Tile expected to be a Tileset.Tile instance or an integer.");
      }
      
      onlyOverwriteEmpty = (onlyOverwriteEmpty === true) ? true : false;
      if (floortile >= 0 && walltile >= 0 && floortile < tile.length && walltile < tile.length){
        for (var j=y; j < y+h; j++){
          var index = j * width;
          for (var i=x; i < x+w; i++){
            if (i===x || i === (x+w)-1 || j===y || j ===(y+h)-1){
              if (onlyOverwriteEmpty === false || (onlyOverwriteEmpty === true && map[index+i].index < 0)){
                map[index+i].index = walltile;
              }
            } else {
              if (onlyOverwriteEmpty === false || (onlyOverwriteEmpty === true && map[index+i].index < 0)){
                map[index+i].index = floortile;
              }
            }
          }
        }
      }
      return this;
    };

    
    this.createCorridor = function(x, y, length, dir, floortile, walltile){
      if (map === null){
	throw new Error("Map not initialized.");
      }
      if (x < 0 || y < 0 || x >= width || y >= height){
	throw new RangeError("Region out of bounds.");
      }

      if (floortile instanceof Tileset.Tile){
        floortile = this.useTile(floortile);
      }
      if (walltile instanceof Tileset.Tile){
        walltile = this.useTile(walltile);
      }

      if (typeof(floortile) !== 'number' || typeof(walltile) !== 'number'){
        throw new TypeError("Tile expected to be a Tileset.Tile instance or an integer.");
      }

      if (floortile >= 0 && walltile >= 0 && floortile < tile.length && walltile < tile.length){
        var index  = 0;
        if (dir === 0){ // Horizontal
          index  = width * y;
          if (x+length >= width){
            throw new RangeError("Region out of bounds.");
          }
          for (var i=x; i < x+length; i++){
            if(y > 0){
              map[(width*(y-1))+i].index = walltile;
            }
            map[index + i].index = floortile;
            if (y < height){
              map[(width*(y+1))+i].index = walltile;
            }
          }
        } else if (dir === 1){ // Verticle
          if (y+length >= height){
            throw new RangeError("Region out of bounds.");
          }
          for (var j=y; j < y+length; y++){
            index = (width*j) + x;
            if(x - 1 >= 0){
              map[index - 1].index = walltile;
            }
            map[index].index = floortile;
            if (index+1 < width*height){
              map[index+1].index = walltile;
            }
          }
        }
      }
    };
  }
  Tilemap.prototype.__proto__ = Emitter.prototype;
  Tilemap.prototype.constructor = Tilemap;

  return Tilemap;

});


