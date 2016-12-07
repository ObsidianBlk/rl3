
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
    if (typeof(root.FSM) === 'undefined'){
      throw new Error("Missing required class 'FSM'.");
    }
    if (typeof(root.R) === 'undefined'){
      throw new Error("The R library has not been loaded.");
    }
    root.R.Browser.def (root, "R.System.Loader", factory());
  }
})(this, (function () {

  if (typeof(require) === 'function'){ // --- Assume NodeJS context.
    return (function(){
      function Loader(){
        var fs = require('fs');
        var path = require('path');

        Object.defineProperties(this, {
          "type":{
            enumerable: true,
            value: "NodeJS",
            writable: false
          }
        });

        this.load = function(url, callback){
          fs.readFile(url, callback);
        };
      }
      Loader.prototype.constructor = Loader;

      return Loader;
    })();

  } else { // --- Assume Browser context
    // -------------------------------------------------------------------------------------------------------

    return (function(){
      function Loader(){
        Object.defineProperties(this, {
          "type":{
            enumerable: true,
            value: "Browser",
            writable: false
          }
        });

        
        this.load = function(url, callback){
          var httpRequest = new XMLHttpRequest();

          if (!httpRequest) {
            throw new Error("Failed to create XMLHTTP instance.");
          }
          
          httpRequest.onreadystatechange = function(){
            if (httpRequest.readyState === XMLHttpRequest.DONE && httpRequest.status === 200) {
              callback(null, httpRequest.responseText);
            } else {
              callback(new Error("Request failed."));
            }
          };
          
          httpRequest.open('GET', url);
          httpRequest.send();
        };
      }
      Loader.prototype.constructor = Loader;

      return Loader;
    })();
  }
  
}).bind(this));
