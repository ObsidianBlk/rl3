
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
    root.R.Browser.def (root, "R.ECS.ComponentDB", factory(root.R.ECS.Entity));
  }
})(this, function (Entity) {

  

  function ComponentDB(){
    var definition = {};

    Object.defineProperties(this, {
      "componentCount":{
	get:function(){return Object.keys(definition).length;}
      },

      "components":{
	get:function(){
	  return Object.keys(definition);
	}
      }
    });

    this.isDefined = function(name){
      return (name in definition);
    };

    this.componentsDefined = function(names, delimiter){
      if (typeof(names) === 'string'){
	names = names.split((typeof(delimiter) === 'string') ? delimiter : ",");
      }
      if (names instanceof Array){
	if (names.length <= 0){return false;}
	for (var i=0; i < names.length; i++){
	  var name = names[i].trim();
	  if (!(name in definition)){
	    return false;
	  }
	}
      } else {
	throw new TypeError();
      }
      return true;
    };


    this.defineComponent = function(name, compobj){
      if (!(name in definition)){
	if (name === "id" || name === "type"){
	  throw new Error("Component name '" + name + "' is reserved.");
	}
	if (typeof(compobj) !== typeof({}) || compobj.constructor !== Object){
	  throw new TypeError("Component needs to be an Object instance type.");
	}

	var def = {};

	for (var key in compobj){
	  var keytype = typeof(compobj[key]);
	  var isnull = compobj[key] === null;
	  var deepCopy = (isnull === false && (compobj[key] instanceof Array || compobj[key] instanceof Object));

	  if (keytype === 'function'){
	    throw new Error("Illegal function. Component must be a pure data object.");
	  } else if (isnull || keytype === 'number' || keytype === 'string' || keytype === 'boolean') {
	    def.obj[key] = compobj[key];
	  } else if (deepCopy === true){
	    def.obj[key] = JSON.parse(JSON.stringify(compobj[key]));
	  }
	}
	definition[name] = def;
      }
    };

    this.addToEntity = function(e, name){
      if (!(e instanceof Entity)){
	throw new TypeError("Invalid Entity Object.");
      }
      if (!(name in definition)){
	throw new Error("Undefined component name \"" + name + "\".");
      }
      e[name] = JSON.parse(JSON.stringify(definition[name]));
    };

    this.removeFromEntity = function(e, name){
      if (!(e instanceof Entity)){
	throw new TypeError("Invalid Entity Object.");
      }
      if (!(name in definition)){
	throw new Error("Undefined component name \"" + name + "\".");
      }

      if (name in e){
	delete e[name];
      }
    };
  }

  return ComponentDB;
});
