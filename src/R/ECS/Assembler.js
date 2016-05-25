
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'src/R/ECS/Entity',
      'src/R/ECS/ComponentDB',
      'src/R/System/PRng'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/R/ECS/Entity'),
	require('src/R/ECS/ComponentDB'),
	require('src/R/System/PRng')
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
      "R.ECS.Entity",
      "R.ECS.ComponentDB",
      "R.System.PRng"
    ]) === false){
      throw new Error("Missing required object");
    }
    root.R.Browser.def (root, "R.ECS.Assembler", factory(
      root.R.ECS.Entity,
      root.R.ECS.ComponentDB,
      root.R.System.PRng
    ));
  }
})(this, function (Entity, ComponentDB, PRng) {

  function Assembler(prng, db){
    if (typeof(prng) !== 'undefined' && prng !== null){
      if (!(prng instanceof PRng)){
	throw new TypeError("Expected a PRng object instance.");
      }
    } else {
      prng = new PRng();
    }

    if (typeof(db) !== 'undefined' && db !== null){
      if (!(db instanceof ComponentDB)){
	throw new TypeError("Expected a ComponentDB object instance.");
      }
    } else {
      db = new ComponentDB();
    }

    var assemblage = {};

    Object.defineProperties(this, {
      "db":{
	get:function(){return db;}
      },

      "prng":{
	get:function(){return prng;}
      },

      "types":{
	get:function(){return Object.keys(assemblage);}
      },

      "assemblages":{
	get:function(){
	  var res = [];
	  Object.keys(assemblage).forEach(function(key){
	    res = res.concat(Object.keys(assemblage[key]).map(function(name){
	      return key + "." + name;
	    }));
	  });
	  return res;
	}
      }
    });

    this.defineAssemblage = function(type, name, clist, delimiter){
      var asm = null;
      if (typeof(type) !== 'string' || type.length <= 0){
	throw new TypeError("Argument <type> expected to be a string.");
      }
      if (!(type in assemblage)){
	assemblage[type] = {};
      }

      if (!(name in assemblage[type])){
	if (typeof(clist) === 'string'){
	  clist = clist.split((typeof(delimiter) === 'string') ? delimiter : ",");
	}
	if (clist instanceof Array){
	  if (clist.length <= 0){return false;}
	  asm = {};

	  for (var i=0; i < clist.length; i++){
	    var def = clist[i];
	    var deft = typeof(def);
	    if (deft === 'string'){
	      if (db.isDefined(def) === true){
		asm[def] = null;
	      }
	    } else if (deft === typeof({})){
	      if (typeof(def.name) === 'string'){
		if (db.isDefined(def.name) === true){
		  asm[def.name] = (typeof(def.idata) === typeof({})) ? JSON.parse(JSON.stringify(def.idata)) : null;
		}
	      }
	    }
	  }
	}
      }

      if (asm !== null && Object.keys(asm).length > 0){
	assemblage[type][name] = asm;
        return true;
      }
      return false;
    };

    this.createEntity = function(type, name){
      var e = null;
      if (type in assemblage){
	if (name in assemblage[type]){
	  e = new Entity(prng.generateUUID(), type);
	  var compdef = assemblage[type][name];
	  if (compdef !== null){
	    var component = Object.keys(compdef);
	    for (var i=0; i < component.length; i++){
	      var cname = component[i];
	      db.addToEntity(e, cname);
	    }
	    Entity.setValues(e, compdef);
	  }
	}
      }
      return e;
    };
  }
  Assembler.prototype.constructor = Assembler;

  return Assembler;

});



