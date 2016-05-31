
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
      root.FSM = factory();
    }
  }
})(this, function () {

  function FSM(){
    var registeredStates = {};
    var activeState = null;

    Object.defineProperties(this, {
      "activeState":{
	get:function(){return activeState;}
      },

      "registeredStateCount":{
	get:function(){return Object.keys(registeredStates).length;}
      },

      "registeredStates":{
	get:function(){return Object.keys(registeredStates);}
      }
    });
    
    this.registerState = function(name, state, setActive){
      if (!(state instanceof FSM.State)){
	throw new TypeError("Argument <state> expected to be a FSM.State instance.");
      }
      if (typeof(name) !== 'string'){
	throw new TypeError("Argument <name> expected to be a string.");
      }
      if (name.length <= 0){
	throw new Error("Argument <name> cannot be a zero-length string.");
      }

      if (name in registeredStates){
	throw new Error("Given name is already registered to a state.");
      }
      for (var key in registeredStates){
	if (registeredStates[key] === state){
	  throw new Error("Given state is already registered as '" + key +"'.");
	}
      }
      
      state.enter();
      registeredStates[name] = state;
      if (setActive === true){
	if (activeState !== null){
	  registeredStates[activeState].looseFocus();
	}
	activeState = name;
	registeredStates[activeState].getFocus();
      }
    };

    
    this.removeState = function(name){
      if (typeof(name) !== 'string'){
	throw new TypeError("Argument <name> expected to be a string.");
      }
      if (name in registeredStates){
	var state = registeredStates[name];
	delete registeredStates[name];
	if (activeState === name){
	  state.looseFocus();
	  activeState = null;
	}
	state.exit();
      }
    };


    this.removeStates = function(){
      if (activeState !== null){
	registeredStates[activeState].looseFocus();
      }
      for (var key in registeredStates){
	registeredStates[key].exit();
	delete registeredStates[key];
      }
    };


    this.activateState = function(name){
      if (typeof(name) !== 'string'){
	throw new TypeError("Argument <name> expected to be a string.");
      }

      if (name in registeredStates){
	if (activeState !== null){
	  registeredStates[activeState].looseFocus();
	}
	registeredStates[name].getFocus();
	activeState = name;
      }
    };

    this.update = function(){
      if (activeState !== null){
	var state = registeredStates[activeState];
	var args = (arguments.length > 0) ? [].slice.call(arguments, 0) : null;
	state.update.apply(state.update, args);
      }
    };
  }
  FSM.prototype.constructor = FSM;


  // -----------------------------------------------------------


  FSM.State = function(name, FSMParent, setActive){
    if (typeof(FSMParent) !== 'undefined' && FSMParent !== null){
      if (!(FSMParent instanceof FSM)){
	throw new TypeError("Argument <FSMParent> expected to be an FSM instance.");
      }
    } else {
      FSMParent = null;
    }

    if (typeof(name) !== 'string'){
      throw new TypeError("Argument <name> expected to be a string.");
    }
    if (name.length <= 0){
      throw new Error("Argument <name> cannot be a zero-length string.");
    }

    Object.defineProperties(this, {
      "parent":{
	get:function(){return FSMParent;},
	set:function(parent){
	  if (!(parent instanceof FSM)){
	    throw new TypeError("Argument <FSMParent> expected to be an FSM instance.");
	  }
	  if (FSMParent === null){
	    FSMParent = parent;
	  } else {
	    throw new Error("Cannot redefine parent if not null.");
	  }
	}
      },

      "name":{
	value: name,
	writable: false,
	configurable: false,
	enumerable: true
      }
    });


    this.enter = function(){};
    this.getFocus = function(){};
    this.looseFocus = function(){};
    this.exit = function(){};
    this.update = function(){};


    if (FSMParent !== null){
      FSMParent.registerState(name, this, setActive);
    }

  };
  FSM.State.prototype.constructor = FSM.State;


  return FSM;
});
