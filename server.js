var express = require('express');
var app = express();
var path = require('path');
var peer = require('peer');

var ExpressPeerServer = peer.ExpressPeerServer;

// Set up server static hosting
app.use(express.static('public'));

var server = app.listen(process.env.PORT, function() {
	console.log('Listening on '+process.env.PORT)
})

var options = {
    debug: true
}

var peerServer = ExpressPeerServer(server, options);

app.use('/peerjs', peerServer);