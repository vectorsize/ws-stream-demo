var websocket = require('websocket-stream');
var ws = websocket('ws://wave.vi-live.net:3000');

var draw = require('./simple-draw');
var context = new webkitAudioContext();

var BUFFER_LENGTH = 2048;

var AudioSource = function() {
  this.buffer = [[], []];
  this.js = context.createJavaScriptNode(BUFFER_LENGTH, 2, 2);
  this.js.onaudioprocess = this.onaudioprocess.bind(this);
  this.getBufferCallback = null;
};
AudioSource.prototype = {
  onaudioprocess: function(event) {
	console.log('AudioSource - onaudioprocess');
    if (typeof this.getBufferCallback === 'function')
      this.getBufferCallback();

    var buffers = [],
        that = this;
    for (var ch = 0; ch < this.buffer.length; ch++) {
      buffers.push(this.buffer[ch].shift() || new Float32Array(BUFFER_LENGTH));
    }
    for (ch = 0; ch < buffers.length; ch++) {
      event.outputBuffer.getChannelData(ch).set(buffers[ch]);
    }
  },
  connect: function(destination) {
	console.log('AudioSource - connect');
    this.js.connect(destination);
  },
  disconnect: function() {
	console.log('AudioSource - disconnect');
    this.js.disconnect();
  },
  setBuffer: function(buffer) {
	console.log('AudioSource - setBuffer');
    for (var ch = 0; ch < buffer.length; ch++) {
      this.buffer[ch].push(buffer[ch]);
    }
  }
};



var listenerSource = new AudioSource();
var audioData;
var count = 0;
// on data we build our array up
ws.on('data', function(d) {
  if(!audioData) { // initialize the arraybuffer container
    audioData = new Uint8Array(d);
  } else {
    console.log(d.byteLength);
    var tmp = new Uint8Array(audioData.byteLength + d.byteLength);
    tmp.set(new Uint8Array(audioData), 0);
    tmp.set(new Uint8Array(d), audioData.byteLength);
    audioData = tmp.buffer;

    
    if(count == 0) {
      context.decodeAudioData(tmp.buffer, function(buffer) {
          // Just for test, you can hear the first chunk
          var node = {};
          node.source  = context.createBufferSource();
          node.source.connect(context.destination);
          node.source.buffer=buffer;
          node.source.start();
          
          // append chunk to the buffer but it's too large
          var ch = [];
          ch[0] = buffer;
          listenerSource.setBuffer(ch);
          
      });
    } 
    
    //Wait some buffer, 3 is arbitrary
    //if(count == 3)
    //  listenerSource.connect(context.destination);
   
    count++;
  }
  
  
});

// when done we render it
ws.on('end', function() {
  context.decodeAudioData(audioData, function(buffer) {
    var data = buffer.getChannelData( 0 );
    draw(data);
  });
});