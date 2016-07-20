
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory();
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.R.Browser) === 'undefined'){
      throw new Error("Missing R initilization.");
    }
    root.R.Browser.def (root, "R.System.VarState", factory());
  }
})(this, function () {

  var CONTAINER = {};

  function VarState(){
    this.add = function(name, v){
      if (!(name in CONTAINER)){
        CONTAINER[name] = v;
      }
    };

    this.remove = function(name){};
  }
  VarState.prototype.constructor = VarState;
  
});
