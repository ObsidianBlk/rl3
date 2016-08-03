
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Emitter',
      'src/R/Graphics/Cursor',
      'src/R/Map/Tilemap',
      'src/R/ECS/Entity'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
        require('src/R/System/Emitter'),
	require('src/R/Graphics/Cursor'),
        require('src/R/Map/Tilemap'),
        require('src/R/ECS/Entity')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.R) === 'undefined'){
      throw new Error("The R library has not been loaded.");
    }
    if (typeof(root.System) === 'undefined'){
      root.System = {};
    }
    if (typeof(root.System.GameMap) === 'undefined'){
      root.System.GameMap = factory(
        root.R.System.Emitter,
	root.R.Graphics.Cursor,
        root.R.Map.Tilemap,
        root.R.ECS.Entity
      );
    }
  }
})(this, function (Emitter, Cursor, Tilemap, Entity) {


  function GameMap(){
    Emitter.call(this);

    var tmap = null;
    var target = null;
    var entities = {};
    var eactor = [];
    var evis = [];

    Object.defineProperties(this, {
      "tilemap":{
        enumerate:true,
        get:function(){return tmap;},
        set:function(tm){
          if (!(tm === null || tm instanceof Tilemap)){
            throw new TypeError("Expected Tilemap instance object or null.");
          }
          tmap = tm;
          // TODO: Maybe clear out the entities?? IDK... just a thought.
        }
      },

      "actors":{
        enumerate:true,
        get:function(){
          return eactor.map(function(i){return i;});
        }
      }
    });

    this.addEntity = function(e){
      if (!(e instanceof Entity)){
        throw new TypeError("Expected Entity instance object.");
      }
      if (!(e.id in entities)){
        entities[e.id] = e;
        if (typeof(e.visual) === typeof({})){
          evis.push(e);
        }
        if (typeof(e.actor) === typeof({})){
          eactor.push(e);
        }
      }
    };

    this.removeEntity = function(e){
      if (e instanceof Entity){
        if (e.id in entities){
          delete entities[e.id];
          evis = evis.filter(function(i){
            return !(i.id === e.id);
          });
          eactor = eactor.filter(function(i){
            return !(i.id === e.id);
          });
        }
      }
    };

    this.setTarget = function(e){
      if (!(e instanceof Entity)){
        throw new TypeError("Expected Entity instance object.");
      }
      if (typeof(e.actor) === typeof({})){
        if (!(e.id in entities)){
          this.addEntity(e);
        }
        if (target !== e){
          target = e;
        }
      }
    };

    this.draw = function(cursor){
      if (cursor instanceof Cursor){

        var hcurC = Math.floor(cursor.columns*0.5);
        var hcurR = Math.floor(cursor.rows*0.5);
        
        var offsetC = 0;
        var offsetR = 0;
        if (target !== null){
          offsetC = target.position.c - hcurC;
          offsetR = target.position.r - hcurR;
        }

        var vislist = evis.filter(function(e){
          if (e.position.c >= target.position.c - hcurC && e.position.c <= target.position.c + hcurC){
            if (e.position.r >= target.position.r -hcurR && e.position.r <= target.position.r + hcurR){
              return true;
            }
          }
          return false;
        });
        var mapinfo = tmap.getRegionTileInfo(offsetC, offsetR, cursor.columns, cursor.rows, false);
        mapinfo.forEach(function(row){
          for (var c = 0; c < row.length; c++){
            cursor.c = row[c].c - offsetC;
            cursor.r = row[c].r - offsetR;
            if (row[c].tile !== null){
              var tile = row[c].tile;
	      var gindex = tile.primeglyph;
              var opts = {};
              if (tile.foreground !== null){
                opts.foreground = tile.foreground;
              }
              if (tile.background !== null){
                opts.background = tile.background;
              }
              var v = vislist.filter(function(e){
                if (e.position.c === row[c].c && e.position.r === row[c].r){
                  return true;
                }
                return false;
              });
              if (v.length > 0){
                cursor.set(v[0].visual.primeglyph, Cursor.WRAP_TYPE_CHARACTER, {
                  foreground: v[0].visual.foreground,
                  background: v[0].visual.background
                });
              } else {
                cursor.set(gindex, Cursor.WRAP_TYPE_CHARACTER, opts);
              }
            } else {
              cursor.del();
            }
          }
        });
        /*Object.keys(mapinfo).forEach(function(key){
          var tile = mapinfo[key].tile;
	  var gindex = tile.primeglyph;
          var opts = {};
          if (tile.foreground !== null){
            opts.foreground = tile.foreground;
          }
          if (tile.background !== null){
            opts.background = tile.background;
          }
	  var coords = mapinfo[key].coord;
          var coordCount = coords.length/2;
          for (var i=0; i < coordCount; i++){
            cursor.c = coords[i*2] - offsetC;
            cursor.r = (coords[(i*2)+1] -offsetR)+ 4; // The +4 is an explicit shift down.
            var v = vislist.filter(function(e){
              if (e.position.c === coords[i*2] && e.position.r === coords[(i*2) + 1]){
                return true;
              }
              return false;
            });
            if (v.length > 0){
              cursor.set(v[0].visual.primeglyph, Cursor.WRAP_TYPE_CHARACTER, {
                foreground: v[0].visual.foreground,
                background: v[0].visual.background
              });
            } else {
              cursor.set(gindex, Cursor.WRAP_TYPE_CHARACTER, opts);
            }
          }
        });*/
      }
    };
  }
  GameMap.prototype.__proto__ = Emitter.prototype;
  GameMap.prototype.constructor = GameMap;


  return GameMap;
});
