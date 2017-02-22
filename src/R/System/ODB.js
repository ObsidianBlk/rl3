
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

  function GenerateUUID(){
    // This method's operations are from StackOverflow response by...
    // broofa ... ( http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript )
    var uniform = Math.random;

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.floor(uniform()*16)|0, v = (c == 'x') ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };
  

  function TestObjKeyValue(obj, key, value){
    var keys = key.split(".");
    var found = true;
    var o = obj;
    for (var k = 0; k < keys.length; k++){
      found = o.hasOwnProperty[keys[k]];
      if (found === false){break;}
      o = o[keys[k]];
    }

    if (found === true){
      if (value.constructor === Object){
        if ("&gt;" in value){
          if (typeof(o) === 'number'){
            return o > value["&gt;"];
          }
        } else if ("&gte;" in value){
          if (typeof(o) === 'number'){
            return o >= value["&gte;"];
          }
        } else if ("&lt;" in value){
          if (typeof(o) === 'number'){
            return o < value["&lt;"];
          }
        } else if ("&lte;" in value){
          if (typeof(o) === 'number'){
            return o <= value["&lte;"];
          }
        } else if ("&ne;" in value){
          return o !== value["&ne;"];
        } else if ("&len;" in value){
          if (typeof(o) === 'string' || o.constructor === Array){
            return o.length === value["&len;"];
          }
        } else if ("&lengt;" in value){
          if (typeof(o) === 'string' || o.constructor === Array){
            return o.length > value["&lengt;"];
          }
        } else if ("&lengte;" in value){
          if (typeof(o) === 'string' || o.constructor === Array){
            return o.length >= value["&lengte;"];
          }
        } else if ("&lenlt;" in value){
          if (typeof(o) === 'string' || o.constructor === Array){
            return o.length < value["&lenlt;"];
          }
        } else if ("&lenlte;" in value){
          if (typeof(o) === 'string' || o.constructor === Array){
            return o.length <= value["&lenlte;"];
          }
        } else if ("&lenne;" in value){
          if (typeof(o) === 'string' || o.constructor === Array){
            return o.length !== value["&lenne;"];
          }
        }
      } else {
        // TODO: What to do about Array values... Hmmmm???
        return (o === value);
      }
    }
    return false;
  }
  

  function Collection(parent, name){
    if (! (parent instanceof ODB)){
      throw new TypeError("Collection given invalid parent.");
    }
    if (parent.collection(name) !== null){
      throw new Error("Collection can only be created from an ODB instance. Cannot directly instantiate.");
    }
    var data = {};

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
	enumerable: false,
        get:function(){
          return Object.keys(data).length;
        }
      }
    });

    this.add = function(rec){
      if (rec === null || typeof(rec) === 'undefined'){
	throw new Error("Invalid Record Type");
      }
      if (rec.constructor === Array){
        try {
          var res = [];
          for (var r=0; r < rec.length; r++){
            try {
              res.push(this.add(rec[r]));
            } catch (e) {
              throw e;
            }
          }
          return res;
        } catch (e) {
          throw e;
        }
      }
      
      var type = rec.constructor.name;
      if (type !== Object.name){
	if (!parent.ctypes.defined(type)){
	  throw new Error("Cannot add object type \"" + type + "\" to collection. Type not defined.");
	}
	rec = parent.ctypes.record(rec);
      }

      var uuid = GenerateUUID();
      data[uuid] = {
	type: type,
	record: JSON.parse(JSON.stringify(rec))
      };

      return uuid;
    };

    /*
      desc [Object]
      Object definition...
      {
        "key":value
      }
     */
    this.find = function(desc){
      var rec = [];
      if (desc.constructor === Object){
        var desckeys = Object.keys(desc);
        var datkeys = Object.keys(data);

        for (var i=0; i < datkeys.length; i++){
          var ent = data[datkeys[i]];
          var found = true;
          for (var k=0; k < desckeys.length; k++){
            var key = desckeys[k];
            if (key === "_id" && desc[key] !== datkeys[i]){
              found = false; break;
            } else if (key === "_type" && ent.type !== desc[key]){
              found = false; break;
            } else if(TestObjKeyValue(ent.record, key, desc[key]) === false){
              found = false; break;
            }
          }

          if (found === true){
            if (ent.type !== Object.constructor.name){
              try {
                rec.push(parent.ctypes.object(rec.record));
              } catch (e) {
                throw e;
              }
            } else {
              rec.push(JSON.parse(JSON.stringify(rec.record)));
            }
          }
        }
      } else {
        throw new TypeError("Expected Object instance.");
      }
      return rec;
    };

    this.remove = function(desc){
      var removed = 0;
      if (desc.constructor === Object){
        var desckeys = Object.keys(desc);
        var datkeys = Object.keys(data);

        for (var i=0; i < datkeys.length; i++){
          var ent = data[datkeys[i]];
          var found = true;
          for (var k=0; k < desckeys.length; k++){
            var key = desckeys[k];
            if (key === "_id" && desc[key] !== datkeys[i]){
              found = false; break;
            } else if (key === "_type" && ent.type !== desc[key]){
              found = false; break;
            } else if(TestObjKeyValue(ent.record, key, desc[key]) === false){
              found = false; break;
            }
          }

          if (found === true){
            delete data[datkeys[i]];
            removed += 1;
          }
        }
      } else {
        throw new TypeError("Expected Object instance.");
      }

      return removed;
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
