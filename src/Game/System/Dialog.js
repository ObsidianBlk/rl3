(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Emitter',
      'src/R/ECS/World',
      'src/R/ECS/Entity',
      'src/R/Graphics/Cursor'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
        require('src/R/System/Emitter'),
        require('src/R/ECS/World'),
        require('src/R/ECS/Entity'),
        require('src/R/Graphics/Cursor')
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
        root.R.ECS.World,
        root.R.ECS.Entity,
        root.R.Graphics.Cursor
      );
    }
  }
})(this, function (Emitter, World, Entity, Cursor) {


  function Dialog(world){

    var history = [];
    var hindex = 0;
    var cursor = null;

    Object.defineProperties(this, {
      "cursor":{
        enumerable: true,
        get:function(){return cursor;},
        set:function(c){
          if (c !== null && !(c instanceof Cursor)){
            throw new TypeError("Expected Cursor object instance or null.");
          }
          cursor = c;
        }
      }
    });

    function RenderHistory(){
      if (cursor === null){return;}
      // TODO: Figure out a faster way.
      cursor.clear();
      var r = 0;
      for (var i=hindex; i<(hindex + cursor.columns); i++){
        if (i >= history.length){break;}// Technically should never happen
        cursor.c = 0;
        cursor.r = r;
        if (typeof(history[i].originator) === 'string'){
          cursor.textOut("[" + history[i].originator + "] ", {foreground:"#FFF"});
        }
        cursor.textOut(history[i].msg, {foreground:history[i].tint});
        r++;
      }
    }

    function BreakMsg(msg){
      var words = msg.split(/\s/g);
      var lines = [];
      var line = "";

      words.forEach(function(word){
        var llength = line.length + word.length;
        if (line.length > 0){llength += 1;} // Add one for space between line and word.
        
        if (llength >= cursor.columns){
          if (line.length > 0){
            lines.push(line);
            line = "";
          }
        } else {
          line += ((line.length > 0) ? " " : "")  + word;
        }
      });
      if (line.length > 0){
        lines.push(line);
      }

      return lines;
    };

    function OnDialog(type, msg, originator){
      if (cursor == null){return;}
      var lines = null;
      if (originator === null){
        lines = BreakMsg(msg);
      } else {
        lines = BreakMsg("[" + originator + "] " + msg);
      }
      if (lines.length > 0 && originator !== null){
        lines[0] = lines[0].substr(originator.length+2);
      }

      var tint = "#fff";
      switch(type){
      case 1: // "NPC"
        tint = "#FF0"; break;
      case 2: // "Player"
        tint = "#06A";
      }

      for (var l=0; l < lines.length; l++){
        var mo = {
          tint: tint,
          msg: lines[l]
        };
        if (originator !== null){
          mo.originator = originator;
        }
        history.splice(0, 0, mo);
        if (hindex > 0){
          hindex ++;
        }
      }

      RenderHistory();
    };
    
    world.on("dialog-system", function(msg){OnDialog(0, msg, null);});
    world.on("dialog-npc", function(msg, originator){OnDialog(1, msg, originator);});
    world.on("dialog-player", function(msg, originator){OnDialog(2, msg, originator);});
  }
  Dialog.prototype.constructor = Dialog;

  return Dialog;
});
