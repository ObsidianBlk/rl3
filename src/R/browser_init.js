
if (typeof(document) === 'undefined'){
  throw new Error("browser_init.js should only be included in a pure browser context.");
}

if (typeof(this.R) === 'undefined'){
  var root = this;
  root.R = {};
  root.R.Browser = {
    exists: function(r, path){
      if (path instanceof Array){
        for (var i=0; i < path.length; i++){
          if (typeof(path[i]) === 'string'){
            if (root.R.Browser.exists(r, path[i]) === false){
              return false;
            }
          }
        }
        return true;
      }
      
      var pos = path.indexOf(".");
      if (pos < 0){
	return (typeof(r[path]) !== 'undefined');
      }

      var spath = path.substr(0, pos);
      if (typeof(r[spath]) === typeof({})){
	return root.R.Browser.exists(r[spath], path.substr(pos+1));
      }
      return false;
    },

    
    def: function(r, path, item){
      var pos = path.indexOf(".");
      if (pos < 0){
	r[path] = item;
      }

      var spath = path.substr(0, pos);
      if (typeof(r[spath]) !== typeof({})){
	r[spath] = {};
      }
      root.R.Browser.def (r[spath], path.substr(pos+1), item);
    }
  };
}

