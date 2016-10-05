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
      /*
	!!!! WARNING !!!!
	This object uses the browser context class Image() as well as the document object for a lot of it's work. As such,
	this object may not be importable using node's require() method... unless you know how to make those items global in this context.
	Have fun!
       */
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
      if (this.inShadows(s) === true){return;}
      var index = 0;
      for (index=0; index < shadows.length; index++){
        if (this._shadows[index].start >= s.start){break;} // Found our insertion point.
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
      }
    });
    
    function OctantTransform(octant, row, col){
      switch (octant) {
      case 0: return {col:col, row:-row};
      case 1: return {col:row, row:-col};
      case 2: return {col:row,  row:col};
      case 3: return {col:col,  row:row};
      case 4: return {col:-col,  row:row};
      case 5: return {col:-row,  row:col};
      case 6: return {col:-row, row:-col};
      case 7: return {col:-col, row:-row};
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
          var pos = OctantTransform(octant, row, col);
          var tproj = ProjectTile(col, row);

          var fcol = pos.col + radius;
          var frow = pos.row + radius;
          var findex = (frow*mapsize)+fcol;
          fovmap[findex] = sl.inShadow(tproj) ? 0 : 1;
          
          var t = tmap.getTile(pos.col + c, pos.row + r);
          if (t !== null && t.visibility < 1){
            sl.add(tproj);
          }
        }
      }
    }


    this.generate = function(radius){
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
        tmap.markTileSeen(col, row, true);
      });
    };

    this.isVisible = function(c, r){
      if (fovmap.length > 0){
        // TODO: Can I see the tile at c, r.
      }
      return false;
    };
  };
  Shadowcaster.prototype.constructor = Shadowcaster;

  return Shadowcaster;
});
