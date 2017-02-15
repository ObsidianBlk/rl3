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

    this.render = function(){
      RenderHistory();
    };

    function RenderHistory(){
      if (cursor === null){return;}
      // TODO: Figure out a faster way.
      cursor.clear();
      var r = 0;
      for (var i=hindex; i<(hindex + cursor.rows); i++){
        if (i >= history.length){break;}
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

    function OnDialog(msg, options){
      // WARNING: This method does not take into account resizing the terminal!!! Should store original messages seperately.

      if (cursor == null){return;}
      options = (typeof(options) === typeof({})) ? options : {};
      
      var lines = null;
      if (typeof(options.originator) === 'string'){
        lines = BreakMsg("[" + options.originator + "] " + msg);
      } else {
        lines = BreakMsg(msg);
      }

      // TODO: Test this is a valid RGB Hex color.
      var tint = (typeof(options.tint) === 'string') ? options.tint : "#FFF";

      for (var l=0; l < lines.length; l++){
        // TODO: THIS BETTER!
        var mo = {
          tint: tint,
          msg: lines[l]
        };
        history.splice(0, 0, mo);
        if (hindex > 0){
          hindex ++;
        }
      }

      RenderHistory();
    };
    
    world.on("dialog-message", OnDialog);
  }
  Dialog.prototype.constructor = Dialog;

  return Dialog;
});
