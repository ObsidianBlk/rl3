
var express = require('express'),
    app = express();
var http = require('http').Server(app);
var port = 8001;


// -----------------------------------
// Preparing the web server app

app.use(express.static(__dirname));
//app.use(express.static(__dirname + "/client"));

app.get('/',function(req,res){
  res.sendFile('index.html');
  //It will find and locate index.html from View or Scripts
});


// -----------------------------------
// Kicking this pig
// Listen for connections.
http.listen(port, function(){
  console.log("Lib Rogue Demo Server listening on port " + port);
});
