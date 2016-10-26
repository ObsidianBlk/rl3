(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(['src/Game/System/GameMap'], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/Game/System/GameMap')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.R) === 'undefined' || typeof(root.R.Browser === 'undefined')){
      throw new Error("Missing R initilization.");
    }

    if (root.R.Browser.exists(root, [
      "Game.System.GameMap"
    ]) === false){
      throw new Error("Missing required object");
    }

    root.R.Browser.def(root, "Game.System.FOV.Shadowcaster", factory(
      root.Game.System.GameMap
    ));
  }
})(this, function (GameMap) {

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
      return start <= other.start && end >= other.end;
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
  
  

  function Shadowcaster(map){
    GameMap.FOV.call(this, map);
    var self = this;
    var fovmap = [];
    //var origin_c = 0;
    //var origin_r = 0;
    //var radius = 0;
    
    
    function OctantTransform(octant, row, col, setToOrigin){
      var or = self.radius;
      var oc = self.radius;
      if (setToOrigin === true){
        or = self.row;
        oc = self.col;
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

    function CalculateOctant(octant){
      var sl = new shadowline();
      var radius = self.radius;
      //var tmap = map.tilemap;
      for (var row=1; row < radius+1; row++){
        for (var col = 0; col <= row; col++){
          var mpos = OctantTransform(octant, row, col, true);
          var spos = OctantTransform(octant, row, col);
          var tproj = ProjectTile(col, row);

          var findex = (spos.row*((radius*2)+1))+spos.col;

          var vis = map.getVisibility(mpos.col, mpos.row);
          if (vis !== null){
            if (sl.inShadow(tproj) === false){
              fovmap[findex] = 1;
            }
            if (vis < 1){
              sl.add(tproj);
            }
          }
        }
      }
    }


    this.generate = function(){
      var size = (this.radius*2)+1;
      var mapsize = size*size;
      fovmap = [];
      for (var i=0; i < mapsize; i++){
        fovmap.push(0);
      }
      
      CalculateOctant(0);
      CalculateOctant(1);
      CalculateOctant(2);
      CalculateOctant(3);
      CalculateOctant(4);
      CalculateOctant(5);
      CalculateOctant(6);
      CalculateOctant(7);
    };

    this.markMapSeen = function(){
      if (fovmap.length <=0 && this.radius > 0){return;}
      var size = (this.radius*2)+1;
      fovmap.forEach(function(v, i){
        if (v === 1){
          var col = ((i%size) - self.radius) + self.col;
          var row = (Math.floor(i/size) - self.radius) + self.row;
          map.tilemap.markTileSeen(col, row, true);
        }
      });
    };

    this.isVisible = function(c, r){
      if (fovmap.length > 0){
        var size = (this.radius*2)+1;
        var col = (c -  this.col) + this.radius;
        var row = (r - this.row) + this.radius;
        
        if (col >= 0 && col < size && row >= 0 && row < size){
          var findex = (row*((this.radius*2)+1))+col;
          if (findex >= 0 && findex < fovmap.length){
            return (fovmap[findex] === 1);
          }
        }
      }
      return false;
    };
  };
  Shadowcaster.prototype.__proto__ = GameMap.FOV.prototype;
  Shadowcaster.prototype.constructor = Shadowcaster;

  return Shadowcaster;
});
