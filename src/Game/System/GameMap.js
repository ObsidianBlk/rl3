
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Emitter',
      'src/R/Graphics/Cursor',
      'src/R/Map/Tilemap',
      'src/R/ECS/World',
      'src/R/ECS/Entity',
      'src/R/ECS/Assembler'
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
        require('src/R/ECS/World'),
        require('src/R/ECS/Entity'),
        require('src/R/ECS/Assembler')
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
        root.R.ECS.World,
        root.R.ECS.Entity,
        root.R.ECS.Assembler
      );
    }
  }
})(this, function (Emitter, Cursor, Tilemap, World, Entity, Assembler) {


  function GameMap(world){
    Emitter.call(this);

    if (!(world instanceof World)){
      throw new TypeError("Expected World instance object.");
    }
    
    var tmap = null;
    var entities = {};
    var eactor = []; // TODO: Refactor eactor to be ephysical.
    var evis = [];

    var camC = 0;
    var camR = 0;

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
      },

      "cameraC":{
        enumerate: true,
        get:function(){return camC;},
        set:function(c){
          if (typeof(c) !== 'number'){
            throw new TypeError("Expected a number value.");
          }
          camC = c;
        }
      },

      "cameraR":{
        enumerate: true,
        get:function(){return camR;},
        set:function(r){
          if (typeof(r) !== 'number'){
            throw new TypeError("Expected a number value.");
          }
          camR = r;
        }
      }
    });

    this.getMoveability = function(c, r){
      var tile = tmap.getTile(c, r);
      if (tile !== null){
        var mv = tile.moveability;
        if (tile.moveability > 0){
          var ents = eactor.forEach(function(e){
            if (e.position.c === c && e.position.r === r && e.physical.moveability < 1){
              if (mv > e.physical.moveability){
                mv = e.physical.moveability;
              }
            }
          });
        }
        return mv;
      }
      return null;
    };

    this.getEntities = function(c, r){
      return evis.filter(function(e){
        return (e.position.c === c && e.position.r === r);
      });
    };

    this.draw = function(cursor){
      if (cursor instanceof Cursor){

        var hcurC = Math.floor(cursor.columns*0.5);
        var hcurR = Math.floor(cursor.rows*0.5);
        
        var offsetC = camC - hcurC;
        var offsetR = camR - hcurR;

        var vislist = evis.filter(function(e){
          if (e.position.c >= camC - hcurC && e.position.c <= camC + hcurC){
            if (e.position.r >= camR -hcurR && e.position.r <= camR + hcurR){
              return true;
            }
          }
          return false;
        });
        cursor.r = 0;
        cursor.c = 0;
        for (var r=0; r < cursor.rows; r++){
          cursor.r = r;
          for (var c=0; c < cursor.columns; c++){
            cursor.c = c;
            var tile = tmap.getTile(offsetC + c, offsetR + r);
            if (tile !== null){
              var gindex = tile.primeglyph;
              var opts = {};
              if (tile.foreground !== null){
                opts.foreground = tile.foreground;
              }
              if (tile.background !== null){
                opts.background = tile.background;
              }
              /*
                TODO
                This needs to be rewritten. Why filter through the already filtered vlist for every cell. This is bullsh*t.
               */
              var v = vislist.filter(function(e){
                if (e.position.c === offsetC+c && e.position.r === offsetR+r){
                  return true;
                }
                return false;
              });
              if (v.length > 0){  
                cursor.set(v[0].visual.primeglyph, Cursor.WRAP_TYPE_CHARACTER, {
                  foreground: v[0].visual.tint,
                  background: v[0].visual.background
                });
              } else {
                cursor.set(gindex, Cursor.WRAP_TYPE_CHARACTER, opts);
              }
              /*
                ---------------------------------------------
               */
              //cursor.set(gindex, Cursor.WRAP_TYPE_CHARACTER, opts);
            } else {
              cursor.del();
            }
          }
        }

        /*vislist.forEach(function(v){
          cursor.c = offsetC - (hcurC - v.position.c);
          cursor.r = offsetR - (hcurR - v.position.r);
          cursor.set(v.visual.primeglyph, Cursor.WRAP_TYPE_CHARACTER, {
            foreground: v.visual.tint,
            background: v.visual.background
          });
        });*/
      }
    };


    function RemoveEntity(e){
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
    }

    // ----------------
    // Registering to the world!
    world.registerSystem(this);
    world.on("add-entity", function(e){
      if (!(e.id in entities)){
        entities[e.id] = e;
        if (typeof(e.visual) === typeof({})){
          evis.push(e);
        }
        if (typeof(e.physical) === typeof({})){
          eactor.push(e);
        }
      }
    });

    world.on("remove-entity", RemoveEntity);

    world.on("camera-position", function(c, r){
      camC = c;
      camR = r;
    });
  }
  GameMap.prototype.__proto__ = Emitter.prototype;
  GameMap.prototype.constructor = GameMap;


  return GameMap;
});
