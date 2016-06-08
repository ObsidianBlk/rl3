(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/System/Emitter',
      'src/R/Graphics/Color',
      'src/R/Graphics/Terminal',
      'src/R/Graphics/Cursor',
      'src/R/Input/Keyboard',
      'src/R/Graphics/GlyphEncodedPicture'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
        require('src/R/System/Emitter'),
        require('src/R/Graphics/Color'),
	require('src/R/Graphics/Terminal'),
	require('src/R/Graphics/Cursor'),
	require('src/R/Input/Keyboard'),
	require('src/R/Graphics/GlyphEncodedPicture')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.FSM) === 'undefined'){
      throw new Error("Missing required class 'FSM'.");
    }
    if (typeof(root.R) === 'undefined'){
      throw new Error("The R library has not been loaded.");
    }
    if (typeof(root.States) === 'undefined'){
      root.States = {};
    }

    if (typeof(root.States.GEPEditor) === 'undefined'){
      root.States.GEPEditor = {};
    }

    if (typeof(root.States.GEPEditor.EditorControl) === 'undefined'){
      root.States.GEPEditor.EditorControl = factory(
        root.R.System.Emitter,
        root.R.Graphics.Color,
	root.R.Graphics.Terminal,
	root.R.Graphics.Cursor,
	root.R.Input.Keyboard,
	root.R.Graphics.GlyphEncodedPicture
      );
    }
  }
})(this, function (Emitter, Color, Terminal, Cursor, Keyboard, GlyphEncodedPicture) {

  function EditorControl(keyboard){
    Emitter.call(this);
    
    var cur = null;
    var gep = null;
    var active = false;
    var dirty = true;

    var pos = {
      c: 0,
      r: 0
    };
    
    var cursorState = 0; // 0 = off | 1 = on ... surprise
    var elapsedTime = 0;
    var lastTimestamp = null;

    function OnRegionResize(region){dirty = true;}

    Object.defineProperties(this, {
      "dirty":{
	get:function(){return dirty;}
      },

      "active":{
	get:function(){return active;}
      },

      "cursor":{
	get:function(){return cur;},
	set:function(c){
	  if (c === null || c instanceof Cursor){
	    if (cur !== c){
              if (cur !== null){
                cur.unlisten("regionresize", OnRegionResize);
              }
              
	      cur = c;

              if (cur !== null){
                cur.on("regionresize", OnRegionResize);
              }
	      dirty = true;
	    }
	  }
	}
      },
      
      "gep":{
	get:function(){return gep;},
        set:function(g){
          if (g === null || g instanceof GlyphEncodedPicture){
            if (g !== gep){
              gep = g;
              dirty = true;
            }
          }
        }
      }
      
    });

    
    function OnKeyDown(code){

    }


    this.activate = function(enable){
      enable = (enable === false) ? false : true;
      if (enable === active){return;} // No state to change.
      active = enable;
      
      if (active === true){
	this.emit("activating");
	keyboard.on("keydown", OnKeyDown);
      } else {
	keyboard.unlisten("keydown", OnKeyDown);
      }

      dirty = true;
    };

    
    this.render = function(){
      if (cur === null || dirty === false){return;}
      dirty = false;

      if (gep !== null){
        // TODO: Render the GEP.
      }

      cur.c = pos.c;
      cur.r = pos.r;
      if (cursorState === 1){
        cur.set("|".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {foreground:"#FFFFFF", background:"#000000"});
      } else {
        cur.set(" ".charCodeAt(0), Cursor.WRAP_TYPE_NOWRAP, {foreground:null, background:null});
        // TODO: Should redraw GEP "pix" at this position.
      }
    };

    this.update = function(timestamp){
      elapsedTime = (lastTimestamp === null) ? 0 : timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      while (elapsedTime/1000 >= 1){
        elapsedTime -= 1000;
        if (cursorState === 0){
          cursorState = 1;
        } else {
          cursorState = 0;
        }
        dirty = true;
      }
    };
  }
  EditorControl.prototype.__proto__ = Emitter.prototype;
  EditorControl.prototype.constructor = EditorControl;


  return EditorControl;
});
