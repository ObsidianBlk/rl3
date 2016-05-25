(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(['src/R/System/Emitter'], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('src/R/System/Emitter')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.R.Browser) === 'undefined'){
      throw new Error("Missing R initilization.");
    }

    if (root.R.Browser.exists(root, "R.System.Emitter") === false){
      throw new Error("Missing required object");
    }
    root.R.Browser.def (root, "R.Input.Keyboard", factory());
  }
})(this, function (Emitter) {

  var Keycodes = {
    byValue: function(val){
      for (var key in this){
        if (this[key] === val){
          return key;
        }
      }
      return "";
    },
    "backspace": 8,
    "tab": 9,
    "enter": 13,
    "shift": 16,
    "ctrl": 17,
    "alt": 18,
    "pause": 19,
    "break": 19,
    "capslock": 20,
    "escape": 27,
    "esc": 27,
    "space": 32,
    "pageup": 33,
    "pagedown": 34,
    "end": 35,
    "home": 36,
    "left": 37,
    "up": 38,
    "right": 39,
    "down": 40,
    "insert": 45,
    "delete": 46,
    "0": 48,
    "1": 49,
    "2": 50,
    "3": 51,
    "4": 52,
    "5": 53,
    "6": 54,
    "7": 55,
    "8": 56,
    "9": 57,
    "a": 65,
    "b": 66,
    "c": 67,
    "d": 68,
    "e": 69,
    "f": 70,
    "g": 71,
    "h": 72,
    "i": 73,
    "j": 74,
    "k": 75,
    "l": 76,
    "m": 77,
    "n": 78,
    "o": 79,
    "p": 80,
    "q": 81,
    "r": 82,
    "s": 83,
    "t": 84,
    "u": 85,
    "v": 86,
    "w": 87,
    "x": 88,
    "y": 89,
    "z": 90,
    "leftoskey": 91,
    "rightoskey": 92,
    "select": 93,
    "numpad0": 96,
    "numpad1": 97,
    "numpad2": 98,
    "numpad3": 99,
    "numpad4": 100,
    "numpad5": 101,
    "numpad6": 102,
    "numpad7": 103,
    "numpad8": 104,
    "numpad9": 105,
    "num0": 96,
    "num1": 97,
    "num2": 98,
    "num3": 99,
    "num4": 100,
    "num5": 101,
    "num6": 102,
    "num7": 103,
    "num8": 104,
    "num9": 105,
    "multiply": 106,
    "add": 107,
    "subtract": 109,
    "decimal": 110,
    "divide": 111,
    "f1": 112,
    "f2": 113,
    "f3": 114,
    "f4": 115,
    "f5": 116,
    "f6": 117,
    "f7": 118,
    "f8": 119,
    "f9": 120,
    "f10": 121,
    "f11": 122,
    "f12": 123,
    "numlock": 144,
    "scrolllock": 145,
    "semicolon": 186,
    ";": 186,
    "equal": 187,
    "=": 187,
    "comma": 188,
    ",": 188,
    "dash": 189,
    "-": 189,
    "period": 190,
    ".": 190,
    "forwardslash": 191,
    "/": 191,
    "grave": 192,
    "accent": 192,
    "`": 192,
    "openbracket": 219,
    "[": 219,
    "backslash": 220,
    "\\": 220,
    "closebraket": 221,
    "]": 221,
    "quote": 222,
    "'": 222
  };


  // ----------------------------------------------------------------------------------

  function KeyToCodes(key){
    // If name is a single character, it could be a "special" combo...
    if (key.length === 1){
      switch(key){
      case "_":
        return [Keycodes["shift"], Keycodes["dash"]];
      case "{":
        return [Keycodes["shift"], Keycodes["openbracket"]];
      case "}":
        return [Keycodes["shift"], Keycodes["closebracket"]];
      case "|":
        return [Keycodes["shift"], Keycodes["backslash"]];
      case ":":
        return [Keycodes["shift"], Keycodes["semicolon"]];
      case "\"":
        return [Keycodes["shift"], Keycodes["quote"]];
      case "<":
        return [Keycodes["shift"], Keycodes["comma"]];
      case ">":
        return [Keycodes["shift"], Keycodes["period"]];
      case "?":
        return [Keycodes["shift"], Keycodes["forwardslash"]];
      case "~":
        return [Keycodes["shift"], Keycodes["grave"]];
      case "!":
        return [Keycodes["shift"], Keycodes["1"]];
      case "@":
        return [Keycodes["shift"], Keycodes["2"]];
      case "#":
        return [Keycodes["shift"], Keycodes["3"]];
      case "$":
        return [Keycodes["shift"], Keycodes["4"]];
      case "%":
        return [Keycodes["shift"], Keycodes["5"]];
      case "^":
        return [Keycodes["shift"], Keycodes["6"]];
      case "&":
        return [Keycodes["shift"], Keycodes["7"]];
      case "*":
        return [Keycodes["shift"], Keycodes["8"]];
      case "(":
        return [Keycodes["shift"], Keycodes["9"]];
      case ")":
        return [Keycodes["shift"], Keycodes["0"]];
      case "A":
      case "B":
      case "C":
      case "D":
      case "E":
      case "F":
      case "G":
      case "H":
      case "I":
      case "J":
      case "K":
      case "L":
      case "M":
      case "N":
      case "O":
      case "P":
      case "Q":
      case "R":
      case "S":
      case "T":
      case "U":
      case "V":
      case "W":
      case "X":
      case "Y":
      case "Z":
        return [Keycodes["shift"], Keycodes[key.toLowerCase()]];
      }
      if (key in Keycodes){
        return [Keycodes[key]];
      }
    } else { // It should be a proper name.
      key = key.toLowerCase();
      if (key in Keycodes){
        return [Keycodes[key]];
      }      
    }
    return [];
  }


  // ----------------------------------------------------------------------------------


  function Keyboard(win){
    if (typeof(win) !== typeof({})){
      throw new TypeError("Window object is invalid.");
    }
    if (typeof(win.addEventListener) !== 'function'){
      throw new TypeError("Window object is invalid.");
    }
    Emitter.call(this);

    var ActiveKeys = [];
    var LastCombo = null;
    var ComboSeparator = "+";
    var Enabled = true;

    // "Roll-Off Combos" are combos that trigger as ON when a previous combo triggers as OFF.
    var RollOffCombosEnabled = false;

    var NotifyKeysOnce = false;
    var NotifyCombosOnce = true;

    Object.defineProperties(this, {
      "comboSeparator":{
	get:function(){return ComboSeparator;}
      },

      "enabled":{
	get:function(){return Enabled;},
	set:function(e){
	  if (typeof(e) === 'boolean'){
	    Enabled = e;
	  }
	}
      },

      "rollOffCombos":{
	get:function(){return RollOffCombosEnabled;},
	set:function(e){
	  if (typeof(e) === 'boolean'){
	    RollOffCombosEnabled = e;
	  }
	}
      },

      "notifyKeysOnce":{
	get:function(){return NotifyKeysOnce;},
	set:function(e){
	  if (typeof(e) === 'boolean'){
	    NotifyKeysOnce = e;
	  }
	}
      }
    });

    win.addEventListener("keydown", (function(e){
      if (Enabled === false){return;} // Don't handle input if not Enabled.

      var code = (e.keyCode ? e.keyCode : e.which);
      var update = false;
      if (this.keyDown(code) === false){
	update = true;
	ActiveKeys.push(code);
      }
      if (ActiveKeys.length > 1 && update === true){
	if (LastCombo !== null){
	  this.emit("combooff", LastCombo);
	  this.emit("combooff-" + LastCombo);
	}
	LastCombo = this.currentKeyCombo();
	this.emit("comboon", LastCombo);
	this.emit("comboon-" + LastCombo);
      }

      if (NotifyKeysOnce === false || (NotifyKeysOnce === true && update === true)){
	this.emit("keydown", code);
      }
    }).bind(this), false);


    win.addEventListener("keyup", (function(e){
      if (Enabled === false){return;} // Don't handle input if not Enabled.

      var code = (e.keyCode ? e.keyCode : e.which);
      var update = false;
      for (var i=0; i < ActiveKeys.length; i++){
	if (ActiveKeys[i] === code){
	  update = true;
	  ActiveKeys.splice(i, 1);
	  break;
	}
      }
      if (LastCombo !== null && update === true){
	this.emit("combooff", LastCombo);
	this.emit("combooff-" + LastCombo);
	LastCombo = null;
	if (RollOffCombosEnabled === true && ActiveKeys.length > 1){
	  LastCombo = this.currentKeyCombo();
	  this.emit("comboon", LastCombo);
	  this.emit("comboon-" + LastCombo);
	}
      }
      
      if (NotifyKeysOnce === false || (NotifyKeysOnce === true && update === true)){
	this.emit("keyup", code);
      }
    }).bind(this), false);

    
    this.onCombo = function(comboName, callback){
      comboName = Keyboard.CodesToName(
	Keyboard.NameToCodes(
	  comboName,
	  ComboSeparator
	),
	ComboSeparator
      );

      if (comboName !== ""){
	if (typeof(callback) === typeof({})){
	  if (typeof(callback.on) === 'function'){
	    this.on("comboon-" + comboName, callback.on);
	  }
	  if (typeof(callback.off) === 'function'){
	    this.on("combooff-" + comboName, callback.off);
	  }
	} else if (typeof(callback) === 'function'){
	  this.on("comboon-" + comboName, callback);
	  this.on("combooff-" + comboName, callback);
	}
      };
    };

    this.unlistenCombo = function(comboName, callback){
      comboName = Keyboard.CodesToName(
	Keyboard.NameToCodes(
	  comboName,
	  ComboSeparator
	),
	ComboSeparator
      );

      if (comboName !== ""){
	if (typeof(callback) === typeof({})){
	  if (typeof(callback.on) === 'function'){
	    this.unlisten("comboon-" + comboName, callback.on);
	  }
	  if (typeof(callback.off) === 'function'){
	    this.unlisten("combooff=" + comboName, callback.off);
	  }
	} else if (typeof(callback) === 'function'){
	  this.unlisten("comboon-" + comboName, callback);
	  this.unlisten("combooff-" + comboName, callback);
	}
      };
    };


    this.keyDown = function(code){
      if (typeof(code) === 'number'){
	code = Math.floor(code);
	for (var i=0; i < ActiveKeys.length; i++){
	  if (code === ActiveKeys[i]){
	    return true;
	  }
	}
      }
      return false;
    };

    this.currentKeyCombo = function(){
      ActiveKeys.sort(function(a, b){
	return a-b;
      });
      return Keyboard.CodesToName(ActiveKeys);
    };

    this.activeCombo = function(comboName){
      var userCombo = Keyboard.CodesToName(
	Keyboard.NameToCodes(
	  comboName,
	  ComboSeparator
	),
	ComboSeparator
      );
      return (userCombo !== "") ? (userCombo === this.currentKeyCombo()) : false;
    };

    this.spawn = function(){
      return new Keyboard(win);
    };
  }
  Keyboard.prototype.__proto__ = Emitter.prototype;
  Keyboard.prototype.constructor = Keyboard;

  Keyboard.KeycodeNames = function(){
    return Object.keys(Keycodes);
  };

  Keyboard.CodeToKeyName = function(code){
    return Keycodes.byValue(code);
  };

  /*
   * Returns an array containing the code(s) that make up the name given.
   */
  Keyboard.NameToCodes = function(name, delimiter){
    delimiter = (typeof(delimiter) === 'string') ? delimiter : "+";
    var parts = name.split(delimiter);
    var codes = [];
    var StoreIfUnique = function(val){
      for (var i=0; i < codes.length; i++){
        if (codes[i] === val){return;}
      }
      codes.push(val);
    };
    
    for (var i=0; i < parts.length; i++){
      var key = KeyToCodes(parts[i].trim());
      for (var k=0; k < key.length; k++){
        StoreIfUnique(key[k]);
      }
    }
    return codes.sort(function(a, b){return a-b;});
  };

  Keyboard.CodesToName = function(codes, joiner){
    joiner = (typeof(joiner) === 'string') ? joiner : "+";
    return codes.reduce(function(name, code){
      var key = Keycodes.byValue(code);
      if (key.length > 0){
	name += (name.length > 0) ? (joiner + key) : key;
      }
      return name;
    }, "");
  };

  return Keyboard;
});
