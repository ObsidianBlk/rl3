
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(['src/R/ECS/Entity'], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/R/ECS/Entity')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.R.Browser) === 'undefined'){
      throw new Error("Missing R initilization.");
    }

    if (root.R.Browser.exists(root, "R.ECS.Entity") === false){
      throw new Error("Missing required object");
    }
    root.R.Browser.def (root, "R.ECS.ComponentDB", factory());
  }
})(this, function (Entity) {


  function ComponentDB(){
    var definition = {};
  }

  return ComponentDB;

});
