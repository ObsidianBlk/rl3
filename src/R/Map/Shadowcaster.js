(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(['src/R/Map/Tilemap'], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/R/Map/Tilemap')
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
      "R.Map.Tilemap"
    ]) === false){
      throw new Error("Missing required object");
    }

    root.R.Browser.def(root, "R.Map.Shadowcaster", factory(
      root.R.Map.Tilemap
    ));
  }
})(this, function (Tilemap) {

  /* ---------------------------------------------------------------
    NOTE
    A lot of the design of the code below was inspired and/or borrowed from...
    http://journal.stuffwithstuff.com/2015/09/07/what-the-hero-sees/
   ---------------------------------------------------------------*/

  function shadow(start, end){
    Object.defineProperties(this, {
      "start":{
        enumerate: true,
        get:function(){return start;}
      },

      "end":{
        enumerate: true,
        get:function(){return end;}
      }
    });

    this.contains = function(other){
      return start >= other.start && end >= other.end;
    };

    this.overlaps = function(other){
      return ((start < other.start && end >= other.start && end <= other.end) || (end > other.end && start >= other.start && start <= other.end));
    };

    this.merged = function(other){
      return new shadow(Math.min(start, other.start), Math.max(end, other.end));
    };
  };
  shadow.prototype.constructor = shadow;


  function shadowline(){
    var shadows = [];
    this.add = function(s){
      if (this.inShadow(s) === true){return;}
      var index = 0;
      for (index=0; index < shadows.length; index++){
        if (shadows[index].start >= s.start){break;} // Found our insertion point.
      }
      if (index > 0 && shadows[index-1].overlaps(s)){
        s = s.merged(shadows[index-1]);
        shadows.splice(index-1, 1);
        index -= 1;
      }
      if (index < shadows.length && shadows[index].overlaps(s)){
        s = s.merged(shadows[index]);
        shadows.splice(index, 1);
      }
      shadows.splice(index, 0, s);
    };

    this.inShadow = function(s){
      for (var i=0; i < shadows.length; i++){
        if (shadows[i].contains(s)){
          return true;
        }
      }
      return false;
    };
  };
  shadowline.prototype.constructor = shadowline;
  
  

  function Shadowcaster(tmap){
    var fovmap = [];
    var mapsize = 0;
    var origin_c = 0;
    var origin_r = 0;
    var radius = 0;

    Object.defineProperties(this, {
      "col":{
        enumerate: true,
        get:function(){return origin_c;},
        set:function(col){
          if (typeof(col) !== 'number'){
            throw new TypeError("Expected a number value");
          }
          origin_c = col;
        }
      },

      "row":{
        enumerate: true,
        get:function(){return origin_r;},
        set:function(row){
          if(typeof(row) !== 'number'){
            throw new TypeError("Expected a number value");
          }
          origin_r = row;
        }
      },

      "radius":{
        enumerate: true,
        get:function(){return radius;},
        set:function(r){
          if(typeof(r) !== 'number'){
            throw new TypeError("Expected a number value");
          }
          if (r <= 0){
            throw new RangeError("Radius must be greater than zero.");
          }
          radius = r;
        }
      }
    });
    
    function OctantTransform(octant, row, col, setToOrigin){
      var or = radius;
      var oc = radius;
      if (setToOrigin === true){
        or = origin_r;
        oc = origin_c;
      }
      
      switch (octant) {
      case 0: return {col:oc + col, row:or - row};
      case 1: return {col:oc + row, row:or - col};
      case 2: return {col:oc + row,  row:or + col};
      case 3: return {col:oc + col,  row:or + row};
      case 4: return {col:oc - col,  row:or + row};
      case 5: return {col:oc - row,  row:or + col};
      case 6: return {col:oc - row, row:or - col};
      case 7: return {col:oc - col, row:or - row};
      }
      return null;
    }

    function ProjectTile(c, r){
      var topleft = c/(r+2);
      var bottomright = (c+1)/(r+1);
      return new shadow(topleft, bottomright);
    }

    function CalculateOctant(octant, c, r, radius){
      var sl = new shadowline();
      for (var row=1; row < radius+1; row++){
        for (var col = 0; col <= row; col++){
          var mpos = OctantTransform(octant, row, col, true);
          var spos = OctantTransform(octant, row, col);
          var tproj = ProjectTile(col, row);

          var findex = (spos.row*mapsize)+spos.col;

          var t = tmap.getTile(mpos.col, mpos.row);
          if (t !== null){
            if (sl.inShadow(tproj) === false){
              fovmap[findex] = 1;
            }
            if (t.visibility < 1){
              sl.add(tproj);
            }
          } else {
            fovmap[findex] = 0;
          }
        }
      }
    }


    this.generate = function(){
      var size = (radius*2)+1;
      mapsize = size*size;
      fovmap = [];
      for (var i=0; i < mapsize; i++){
        fovmap[i] = 0;
      }
      
      CalculateOctant(0, origin_c, origin_r, radius);
      CalculateOctant(1, origin_c, origin_r, radius);
      CalculateOctant(2, origin_c, origin_r, radius);
      CalculateOctant(3, origin_c, origin_r, radius);
      CalculateOctant(4, origin_c, origin_r, radius);
      CalculateOctant(5, origin_c, origin_r, radius);
      CalculateOctant(6, origin_c, origin_r, radius);
      CalculateOctant(7, origin_c, origin_r, radius);

      fovmap.forEach(function(v, i){
        var col = ((i%mapsize) - radius) + origin_c;
        var row = (Math.floor(i/mapsize) - radius) + origin_r;
        if (v === 1){
          tmap.markTileSeen(col, row, true);
        }
      });
    };

    this.isVisible = function(c, r){
      if (fovmap.length > 0){
        var col = (c -  origin_c) + radius;
        var row = (r - origin_r) + radius;
        var findex = (row*mapsize)+col;
        if (findex >= 0 && findex < fovmap.length){
          return (fovmap[findex] === 1);
        }
      }
      return false;
    };
  };
  Shadowcaster.prototype.constructor = Shadowcaster;

  return Shadowcaster;
});
