
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'static')));

// development only
if ('development' == app.get('env')) app.use(express.errorHandler());

// browserify
var browserify = require('browserify-middleware');
app.get('/js/app.js', browserify('./client.js'));

// entry
app.get('/', function(req, res) {
  res.render('index', {title: 'binaryJS'});
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// websockets
var WebSocketServer = require('ws').Server;
var websocket = require('websocket-stream');
var wss = new WebSocketServer({server: server});

wss.on('connection', function(ws) {
  var stream = websocket(ws);
  fs.createReadStream('./snd/hello.mp4').pipe(stream);
});
