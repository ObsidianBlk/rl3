
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


  function SetObjKey(obj, key, value, createIfNotExists){
    var keys = key.split(".");
    var found = true;
    var o = obj;
    for (var k = 0; k < keys.length; k++){
      found = o.hasOwnProperty(keys[k]);
      if (found === false){
        if (createIfNotExists === true){
          if (k < keys.length-1){
            o[keys[k]] = {};
          } else {
            o[keys[k]] = value;
          }
        } else {
          return false;
        }
      } else {
        if (k < keys.length - 1){
          o = o[keys[k]];
        } else {
          o[keys[k]] = value;
        }
      }
    }
    return true;
  }

  function TestObjKeyValue(obj, key, value){
    var keys = key.split(".");
    var found = true;
    var o = obj;
    for (var k = 0; k < keys.length; k++){
      found = o.hasOwnProperty(keys[k]);
      if (found === false){break;}
      o = o[keys[k]];
    }

    if (found === true){
      if (typeof(value) === typeof({})){
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

    function FindUUIDFromDesc(desc){
      var res = [];
      if (desc.constructor.name === Object.name){
        var desckeys = Object.keys(desc);
        var uuids = Object.keys(data);

        for (var i=0; i < uuids.length; i++){
          var ent = data[uuids[i]];
          var reckeys = Object.keys(ent.record);

          var found = true;
          for (var dk=0; dk < desckeys.length; dk++){
            var key = desckeys[dk];
            if (key === "_id" && desc[key] !== uuids[i]){
              found = false; break;
            } else {
              if (TestObjKeyValue(ent.record, key, desc[key]) === false){
                found = false; break;
              }
              if (found === false){break;}
            }
          }

          if (found === true){
            res.push(uuids[i]);
          }
        }
      } else {
        throw new TypeError("Expected Object instance.");
      }
      return res;
    }

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
      if (rec.constructor.name === Array.name){
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


    this.update = function(desc, info, createIfNotExists){
      var uuids = [];
      try {
        uuids = FindUUIDFromDesc(desc);
      } catch (e) {
        throw e;
      }

      var updateCount = 0;
      for (var i=0; i < uuids.length; i++){
        var ikeys = Object.keys(info);

        var updated = false;
        for (var k=0; k < ikeys.length; k++){
          var key = ikeys[k];
          if (SetObjKey(data[uuids[i]].record, key, info[key], createIfNotExists) === true){
            updated = true;
          }
        }
        updateCount += (updated === true) ? 1 : 0;
      }

      return updateCount;
    };
    
    
    this.find = function(desc){
      var rec = [];
      var uuids = [];
      try{
        uuids = FindUUIDFromDesc(desc);
      } catch (e) {
        throw e;
      }

      for (var i=0; i < uuids.length; i++){
        var ent = data[uuids[i]];
        if (ent.type !== "Object"){
          try {
            rec.push(parent.ctypes.object(uuids[i], ent.record));
          } catch (e) {
            throw e;
          }
        } else {
          var t = JSON.parse(JSON.stringify(ent.record));
          t._id = uuids[i];
          rec.push(t);
        }
      }
      return rec;
    };

    this.findAll = function(){
      var rec = [];
      var datkeys = Object.keys(data);
      for (var i=0; i < datkeys.length; i++){
        var ent = data[datkeys[i]];
        if (ent.type !== "Object"){
          try {
            rec.push(parent.ctypes.object(datkeys[i], ent.record));
          } catch (e) {
            throw e;
          }
        } else {
          var t = JSON.parse(JSON.stringify(ent.record));
          t._id = datkeys[i];
          rec.push(t);
        }
      }
      return rec;
    };


    this.remove = function(desc){
      var removed = 0;
      if (desc.constructor.name === Object.name){
        var desckeys = Object.keys(desc);
        var uuids = Object.keys(data);

        for (var i=0; i < uuids.length; i++){
          var ent = data[uuids[i]];
          var reckeys = Object.keys(ent.record);
          
          var found = true;
          for (var dk=0; dk < desckeys.length; dk++){
            var key = desckeys[dk];
            if (key === "_id" && desc[key] !== uuids[i]){
              found = false; break;
            } else {
              if (TestObjKeyValue(ent.record, key, desc[key]) === false){
                found = false; break;
              }
              if (found === false){break;}
            }
          }

          if (found === true){
            delete data[uuids[i]];
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
