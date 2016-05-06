
requirejs.config({
  baseUrl:"./"
});
requirejs([
  'src/R/Graphics/Color',
  'src/R/Graphics/Glyph',
  'src/R/Graphics/Terminal',
], function(Color, Glyph, Terminal){

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


  // --------------------------------
  // App starts here :)
  ready(function(){
    var glyph = new Glyph();
    glyph.on("ready", function(){
      var term = new Terminal(document.getElementById("terminal"), {
        glyph:glyph,
        minRows: 60,
        window: window
      });

      term.set(10, 5, "H".charCodeAt(0), {foreground:"#FF0000"});
      term.set(10, 6, "e".charCodeAt(0), {foreground:"#00FF00", background:"#0000FF"});
      term.set(10, 7, "l".charCodeAt(0), {foreground:"#0000FF"});
      term.set(10, 8, "l".charCodeAt(0), {foreground:"#FF00FF"});
      term.set(10, 9, "o".charCodeAt(0), {background:"#FF00FF"});

      term.flip();
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
