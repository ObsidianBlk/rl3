
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
    throw new Error("Script requires either an AMD or CommonJS inclusion mechanism.");
  }
})(this, function () {

  /* -------------------------------------------------------------------------------------------------------------------------
  CustomTypeContainer Class
  ------------------------------------------------------------------------------------------------------------------------- */

  function CustomTypeContainer(){
    var type = {};

    this.define = function(name, toRecord, fromRecord){
      if (typeof(toRecord) !== 'function' && typeof(fromRecord) !== 'function'){
	throw new Error("Missing record/type conversion callbacks.");
      }
      if (!(name in type)){
	type[name] = {};
      }
      type[name].to = toRecord;
      type[name].from = fromRecord;
    };

    this.remove = function(name){
      if (name in type){
	delete type[name];
      }
    };

    this.defined = function(name){
      return (name in type);
    };

    this.record = function(obj){
      if (!(obj.constructor.name in type)){
	throw new Error("No conversion defined for object type \"" + obj.constructor.name + "\".");
      }
      var rec = type[obj.constructor.name].to(obj);
      if (rec.constructor !== Object){
	throw new Error("Type \"" + rec.constructor.name + "\" conversion returned invalid record.");
      }
      return rec;
    };

    this.object = function(name, rec){
      if (!(name in type)){
	throw new Error("No type \"" + name + "\" defined.");
      }
      try {
	return type[name].from(rec);
      } catch (e) {
	throw e;
      }
    };
  }
  CustomTypeContainer.prototype.constructor = CustomTypeContainer;


  /* -------------------------------------------------------------------------------------------------------------------------
  Collection Class
  ------------------------------------------------------------------------------------------------------------------------- */

  function Collection(parent, name){
    if (! (parent instanceof ODB)){
      throw new TypeError("Collection given invalid parent.");
    }
    if (parent.collection(name) !== null){
      throw new Error("Collection can only be created from an ODB instance. Cannot directly instantiate.");
    }
    var coll = [];

    Object.defineProperties(this, {
      "name":{
	value: name,
	writable: false,
	configurable: false,
	enumerable: true
      },

      "parent":{
	value: parent,
	writable: false,
	configurable: false,
	enumerable: false
      },

      "length":{
	value: coll.length,
	writable: false,
	configurable: false,
	enumerable: false
      }
    });

    this.add = function(rec){
      if (rec === null || typeof(rec) === 'undefined'){
	throw new Error("Invalid Record Type");
      }
      var type = rec.constructor.name;
      if (type !== Object.name){
	if (!parent.ctypes.defined(type)){
	  throw new Error("Cannot add object type \"" + type + "\" to collection. Type not defined.");
	}
	rec = parent.ctypes.record(rec);
      }

      coll.push({
	type: type,
	record: rec
      });

      return coll.length-1;
    };

    this.find = function(desc){

    };

    this.remove = function(desc){

    };
  }
  Collection.prototype.constructor = Collection;


  
  /* -------------------------------------------------------------------------------------------------------------------------
  ODB (Object DataBase) Class
  ------------------------------------------------------------------------------------------------------------------------- */
    
  function ODB(){
    var ctypes = new CustomTypeContainer();
    var collections = {};
    
    Object.defineProperties(this, {
      "ctypes":{
	value: ctypes,
	writable: false,
	configurable: false,
	enumerable:false
      },

      "collections":{
	configurable:false,
	enumerable:false,
	get:function(){
	  return Object.keys(collections);
	}
      }
    });

    this.collection = function(name){
      if (!(name in collections)){
	// I set the new collection container to "null" first because when a Collection object is created it's going to check
	// it's given parent to see if, indeed, the collection was being created from the parent.
	collections[name] = null;
	// Create collection... this shouldn't throw any exceptions.
	var c = new Collection(this, name);
	// Store the newly created Collection object.
	collections[name] = c;
      }
      return collections[name];
    };

    this.dropCollection = function(name){
      if (name in collections){
	delete collections[name];
      }
    };
  }
  ODB.prototype.constructor = ODB;
  ODB.Collection = Collection;


  return ODB;
});
