
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

      term.set(10, 5, "H".charCodeAt(0));
      term.set(10, 6, "e".charCodeAt(0));
      term.set(10, 7, "l".charCodeAt(0));
      term.set(10, 8, "l".charCodeAt(0));
      term.set(10, 9, "o".charCodeAt(0));

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
