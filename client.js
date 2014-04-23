var websocket = require('websocket-stream');
var ws = websocket('ws://localhost:3000');

var draw = require('./simple-draw');
var context = new webkitAudioContext();

var audioData;
// on data we build our array up
ws.on('data', function(d) {
  if(!audioData) { // initialize the arraybuffer container
    audioData = new Uint8Array(d);
  } else {
    var tmp = new Uint8Array(audioData.byteLength + d.byteLength);
    tmp.set(new Uint8Array(audioData), 0);
    tmp.set(new Uint8Array(d), audioData.byteLength);
    audioData = tmp.buffer;
  }
});

// when done we render it
ws.on('end', function() {
  context.decodeAudioData(audioData, function(buffer) {
    var data = buffer.getChannelData( 0 );
    draw(data);
  });
});