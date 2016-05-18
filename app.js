
requirejs.config({
  baseUrl:"./"
});
requirejs([
  'src/R/Graphics/Color',
  'src/R/Graphics/Glyph',
  'src/R/Graphics/Terminal',
  'src/R/Graphics/Cursor',
  'src/R/Map/Tileset',
  'src/R/Map/Tilemap'
], function(Color, Glyph, Terminal, Cursor, Tileset, Tilemap){

  // --------------------------------
  // Defining a "Document Ready" function. This is only garanteed to work on Chrome at the moment.
  function ready(callback){
    if (document.readyState === "complete"){
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', function (){
	callback();
      });
    }
  }


  function Monitor(monitor_size){
    var size = (monitor_size > 0) ? monitor_size : 60;
    var frame = 0;
    var elapsed = 0;
    var fpssnap = 0;

    Object.defineProperties(this, {
      "fps":{
	get:function(){return fpssnap;}
      }
    });

    this.add = function(etime){
      if (frame+1 <= 60){
	elapsed += etime;
	frame += 1;
      } else {
	fpssnap = Math.floor((frame/(elapsed*0.001)));
	frame = 1;
	elapsed = etime;
      }
    };
  };
  Monitor.prototype.constructor = Monitor;


  // --------------------------------
  // App starts here :)
  ready(function(){
    var glyph = new Glyph();
    glyph.on("ready", function(){
      var term = new Terminal(document.getElementById("terminal"), {
        glyph:glyph,
        minRows: 60,
        window: window,
	terminalToWindow: true
      });


      // --------------------------------------------------------------------
      // Temporary map setup code.

      var ts = new Tileset("demo");
      ts.set("floor", {
        name:"Wood Floor",
	description: "This is a wood floor you sassy buster you.",
	primeglyph: parseInt("F0", 16),
	betaglyph: -1,
	movability: 1.0,
	visibility: 1.0,
	foreground: "#a58740",
	background: null
      });
      ts.set("wall", {
        name:"Wooden Wall",
	description: "This is a wooden wall... Sooo grainey",
	primeglyph: parseInt("DB", 16),
	betaglyph: -1,
	movability: 1.0,
	visibility: 1.0,
	foreground: "#a58740",
	background: null
      });

      var map = new Tilemap();
      var findex = map.useTile(ts.get("floor"));
      var windex = map.useTile(ts.get("wall"));
      map.initialize("map", "map", 200, 200);
      map.createRoom(0, 0, 15, 15, findex, windex);
      map.createRoom(14, 5, 10, 3, findex, windex);
      map.createRoom(23, 0, 10, 30, findex, windex);

      // --------------------------------------------------------------------


      var cursor = new Cursor(term);
      var RenderCursorText = function(newres, oldres){
	cursor.region = {
	  left: 0,
	  top: 0,
	  right: newres[0]-1,
	  bottom: newres[1]-1
	};

	cursor.c = 0;
	cursor.r = 0;
	cursor.textOut("Hello\n\tWorld!", {foreground:"#FF00FF", background:"#00FF00"});
	cursor.c = 0;
	cursor.r = cursor.rows - 1;
	cursor.textOut("Frames Per Second:");

        var mapinfo = map.getRegionTileInfo(0, 0, 35, 30, false);
        Object.keys(mapinfo).forEach(function(key){
          var tile = mapinfo[key].tile;
          var opts = {};
          if (tile.foreground !== null){
            opts.foreground = tile.foreground;
          }
          if (tile.background !== null){
            opts.background = tile.background;
          }
          var coordCount = mapinfo[key].coord.length%2;
          for (var i=0; i < coordCount; i++){
            cursor.c = mapinfo[key].coord[i*2];
            cursor.r = mapinfo[key].coord[(i*2)+1] + 4; // The +4 is an explicit shift down.
            cursor.set(tile.primeglyph, Cursor.WRAP_TYPE_CHARACTER, opts);
          }
        });
      };
      term.on("renderResize", RenderCursorText);
      //RenderCursorText();


      var fpsmonitor = new Monitor(10);
      var lastTime = null;
      var lastDigitSize = 0;
      var running = true;
      var heartbeat = function(timestamp){
	var elapsed = (lastTime === null) ? 0 : timestamp - lastTime;
	lastTime = timestamp;
	fpsmonitor.add(elapsed);

	if (lastDigitSize > 0){
	  cursor.clearRegion(19, cursor.rows - 1, lastDigitSize, 1);
	}
	cursor.c = 19;
	cursor.r = cursor.rows - 1;
	cursor.textOut(fpsmonitor.fps.toString());
	lastDigitSize = fpsmonitor.fps.toString().length;

	term.flip();

	if (running){
	  // Keep revving the pig...
	  window.requestAnimationFrame(heartbeat);
	}
      };

      // This kicks the pig into gear!
      window.requestAnimationFrame(heartbeat);
    });

    glyph.on("error", function(){
      alert("You're an idiot!");
    });

    glyph.load("data/graphics/10x10/RogueObsidian_10x10.png", {
      cell_width: 10,
      cell_height: 10
    });
  });
});

/*document.addEventListener("DOMContentLoaded", function(event) {
  if (!(window.Game instanceof Object)){
    throw new Error("Missing the 'Game' object.");
  }
  if (typeof(window.Game.application) === 'undefined'){
    throw new Error("Missing 'Game.application'.");
  }

  window.Game.application.init(window, "terminal", "rogue", {
    fonts: [
      {name:"rogue", width:10, height:10, uri:"data/graphics/10x10/RogueObsidian_10x10.png"}
    ],
    screen: window.Game.Screen.game,
    minColumns: 60,
    minRows: 42
  });
  window.Game.application.start();
});*/
