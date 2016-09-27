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

  function Shadowcaster(tmap){
    
  };
  Shadowcaster.prototype.constructor = Shadowcaster;

  return Shadowcaster;
});
