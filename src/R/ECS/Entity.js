
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

  var EntityDB = {
    _ids:[],
    _default:{}
  };

  function Entity(id, type){
    if (typeof(id) !== 'string' || id.length <= 0){
      throw new Error("Invalid id value.");
    }
    if (typeof(type) !== 'string' || type.length <= 0){
      throw new Error("Invalid type value.");
    }
    if (Entity.Exists(id)){
      throw new Error("Entity already exists with the ID \"" + id + "\".");
    }

    // Store the entity in our little database.
    if (!(type in EntityDB._default)){
      EntityDB._default[type] = {};
    }
    EntityDB._default[type][id] = this;

    var container = "_default";

    Object.defineProperties(this, {
      "valid":{
	enumerable:false,
	get:function(){
          if (container in EntityDB && type in EntityDB[container]){
	    return (id in EntityDB[type]);
	  }
	  return false;
	}
      },

      "_container":{
        enumerable:false,
        get:function(){
          return container;
        },
        set:function(ncontainer){
          if (typeof(ncontainer) === 'undefined' || ncontainer === ""){
            ncontainer = "";
          }
          if (ncontainer.substr(0,1) === "_"){
            throw new Error("Names starting with underscores are reserved.");
          }
          if (ncontainer === ""){
            ncontainer = "_default";
          }
          if (container === ncontainer){return;}

          
          if (!(ncontainer in EntityDB)){
            EntityDB[ncontainer] = {};
          }
          delete EntityDB[container][type][id];
          if (!(type in EntityDB[ncontainer])){
            EntityDB[ncontainer][type] = {};
          }
          EntityDB[ncontainer][type][id] = this;
          container = ncontainer;
        }
      },

      "id":{
	value:id,
	writable:false,
	enumerable:false
      },

      "type":{
	value:type,
	writable:false,
	enumerable:false
      }
    });
  }
  Entity.prototype.constructor = Entity;

  function ObjToObjValueCopy(dst, src){
    // Function assumes dst and src are both Object instances.
    // NOTE: NO value can be set to NULL!
    for (var key in dst){
      var keytype = typeof(dst[key]);
      if (src.hasOwnProperty(key) === true && src[key] !== null){
	if (typeof(dst[key]) === typeof(src[key])){
	  if (keytype === typeof({})) {
	    ObjToObjValueCopy(dst[key], src[key]);
	  } else if (keytype === typeof([])){
	    dst[key] = JSON.parse(JSON.stringify(src[key]));
	  } else if (keytype === 'number' || keytype === 'string' || keytype === 'boolean'){
	    dst[key] = src[key];
	  }
	}
      }
    }
  }

  Entity.SetValues = function(e, vdata){
    if (!(e instanceof Entity)){
      throw new TypeError("Operation requires an Entity object instance.");
    }
    if (typeof(vdata) !== typeof({})){
      throw new TypeError("Argument <vdata> expected to be an Object instance.");
    }

    for (var key in e){
      if (key !== "id" && key !== "type" && key !== "valid" && key !== "container"){
	if (vdata.hasOwnProperty(key) && vdata[key] !== null && typeof(vdata[key]) === typeof({})){
	  ObjToObjValueCopy(e[key], vdata[key]);
	}
      }
    }
  };

  Entity.Exists = function(id){
    return (EntityDB._ids.filter(function(eid){return eid === id;}).length > 0);
  };

  Entity.Get = function(container, id, type){
    if (typeof(container) === 'string' && typeof(type) === 'string' && typeof(id) === 'string'){
      if (container in EntityDB){
        if (type in EntityDB[container]){
          if (id in EntityDB[container][type]){
            return EntityDB[container][type][id];
          }
        }
      }
    }

    return null;
  };

  Entity.Remove = function(e){
    if (e instanceof Entity && e.valid === true){
      delete EntityDB[e.container][e.type][e.id];
      EntityDB._ids = EntityDB._ids.filter(function(eid){
        return (eid !== e.id);
      });
    }
  };

  Entity.Serialize = function(container){
    if (container in EntityDB){
      return JSON.stringify(EntityDB[container]);
    }
    return "";
  };

  Entity.Deserialize = function(container, data){
    if (!container in EntityDB){
      EntityDB[container] = {};
      if (typeof(data) === 'string'){
        try {
          data = JSON.parse(data);
        } catch (e){
          throw Error("Entity Deserialization Failed: \"" + e.message + "\"");
        }
      }
      if (typeof(data) !== typeof({})){
        throw new TypeError("Unable to read data.");
      }

      var typekeys = Object.keys(data);
      for (var ti=0; ti < typekeys.length; ti++){
        var type = typekeys[ti];
        if (typeof(data[type]) !== typeof({})){
          throw new Error("Entity Type container not an object.");
        }

        var idkeys = Object.keys(data[type]);
        for (var i=0; i < idkeys.length; i++){
          var id = idkeys[i];
          if (typeof(data[type][id]) !== typeof({})){
            throw new Error("Entity type/id not an object.");
          }

          if (Entity.exists(id) === true){
            throw new Error("Entity with id '" + id + "' already exists in database.");
          }

          if (!(type in EntityDB[container])){
            EntityDB[container][type] = {};
          }
          var e = new Entity(id, type);
          if (container !== "_default"){
            e.container = container;
          }
          Entity.SetValues(e, data[type][id]);
        }
      }
    }
  };

  return Entity;

});
