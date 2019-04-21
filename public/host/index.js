require('../libs/peer.js');
var GameHost = require("./game-host.js");

console.log("Host source hit");
let gameHost = new GameHost();
gameHost.logPlayers();
let requiredNumPlayers = 2;

initialize();

var lastPeerId = 0;
var peer;
var conn;
var connections = [];

var pingClientsButton = document.getElementById("pingClients");
pingClientsButton.onclick = () => pingClients();


function pingClients() {
    connections.forEach(
        connection => connection.send("test to: " + connection.peer)
    )
}


/**
 * Create the Peer object for our end of the connection.
 *
 * Sets up callbacks that handle any events related to our
 * peer object.
 */
function initialize() {
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer('', {
        host: location.hostname,
        port: location.port || (location.protocol === 'https:' ? 443 : 80),
        path: '/peerjs',
        debug: 3
    });

    peer.on('open', function (id) {
        // Workaround for peer.reconnect deleting previous id
        if (peer.id === null) {
            console.log('Received null id from peer open');
            peer.id = lastPeerId;
        } else {
            lastPeerId = peer.id;
        }

        var peerIdOutput = document.getElementById("peerIdOutput");
        peerIdOutput.innerText = peer.id;
        console.log('ID: ' + peer.id);
        console.log("Awaiting connection");
    });
    peer.on('connection', function (c) {
        conn = c;
        console.log("Connected to: " + conn.peer);

        conn.on('data', function (data) {
            console.log(data);
        });

        connections.push(conn);
        let connectedClientCount = document.getElementById("connectedClientCount");
        connectedClientCount.innerText = connections.length;

        gameHost.addPlayer(conn.peer);
        gameHost.logPlayers();

        if (gameHost.players.length == requiredNumPlayers) {
            gameHost.startGame();
        }
    });
    peer.on('disconnected', function () {
        console.log('Connection lost. Please reconnect');

        // Workaround for peer.reconnect deleting previous id
        peer.id = lastPeerId;
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });
    peer.on('close', function() {
        conn = null;
        console.log('Connection destroyed');
    });
    peer.on('error', function (err) {
        console.log(err);
        alert('' + err);
    });
};