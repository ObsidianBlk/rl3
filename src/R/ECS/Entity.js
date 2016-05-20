
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
    root.R.Browser.def (root, "R.ECS.Entity", factory());
  }
})(this, function () {

  var EntityDB = {};

  function Entity(id, type){
    if (typeof(id) !== 'string' || id.length <= 0){
      throw new Error("Invalid id value.");
    }
    if (typeof(type) !== 'string' || type.length <= 0){
      throw new Error("Invalid type value.");
    }
    if (Entity.exists(id)){
      throw new Error("Entity already exists with the ID \"" + id + "\".");
    }

    // Store the entity in our little database.
    if (!(type in EntityDB)){
      EntityDB[type] = {};
    }
    EntityDB[type][id] = this;

    Object.defineProperties(this, {
      "valid":{
	enumerable:false,
	get:function(){
	  if (type in EntityDB){
	    return (id in EntityDB[type]);
	  }
	  return false;
	}
      },

      "id":{
	value:id,
	writable:false,
	enumerable:true
      },

      "type":{
	value:type,
	writable:false,
	enumerable:true
      }
    });
  }
  Entity.prototype.constructor = Entity;

  // TODO: Not sure if this is the best way to manage the database.
  //   Especially the serialization.
  Entity.exists = function(id){
    var keys = Object.keys(EntityDB);
    for (var key in keys){
      if (id in EntityDB[key]){
	return true;
      }
    }
    return false;
  };

  Entity.get = function(id, type){
    var e = null;
    if (typeof(type) === 'string'){
      if (id in EntityDB[type]){
	e = EntityDB[type][id];
      }
    } else if (type instanceof Array){
      var keys = Object.keys(EntityDB);
      for (var key in keys){
	if (id in EntityDB[type]){
	  e = EntityDB[type][id];
	  break;
	}
      }
    }

    return e;
  };

  Entity.remove = function(id, type){
    var e = Entity.get(id, type);
    if (e !== null){
      delete EntityDB[e.type][e.id];
    }
  };

  Entity.serialize = function(){
    return JSON.stringify(EntityDB);
  };

  return Entity;

});
