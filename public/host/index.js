require('../libs/peer.js');
var GameHost = require("./game-host.js");
const CONSTANTS = require("../libs/constants.js");

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
    sendToAllPlayers("Testing send to all");
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
    
        conn.on('data', recieveInputFromPlayer);

        connections.push(conn);
        let connectedClientCount = document.getElementById("connectedClientCount");
        connectedClientCount.innerText = connections.length;

        gameHost.addPlayer(conn.peer);
        gameHost.logPlayers();

        if (gameHost.playerPeers.length === requiredNumPlayers) {
            gameHost.startGame();
//          gameHost.setActivePlayer(gameHost.getRandomPlayer());

            setTimeout(() => sendStateToPlayers(), 500);
            // setTimeout(() => sendToAllPlayers({action: CONSTANTS.SET_GLOBAL_MATCH_INFO, payload: gameHost.globalMatchInfo}), 500);
            // setTimeout(() => sendToAllPlayers({action: CONSTANTS.SET_GLOBAL_ROUND_INFO, payload: gameHost.globalRoundInfo}), 1000);

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

function sendStateToPlayers() {
    connections.forEach(
        element => {
            let peerId = element.peer;
            let payload = gameHost.getPayloadForPeer(peerId);
            let data = {
                action: CONSTANTS.SET_ALL_INFO,
                payload: payload
            }
            element.send(data)
        }
    );
}

function recieveInputFromPlayer(data) {
    console.log("Input from: " + this.peer); // this is the DataConnection 'conn', when recieveInputFromPlayer is passed as a callback function, so we have the peer property.
    console.log(data, "DATA");

    if (gameHost.globalMatchInfo.matchState === CONSTANTS.MATCH_STATE_ALL_CONNECTED){
        // Check player is valid to move.
        if(gameHost.checkPlayerIsActive(this.peer)) {

            let isValidMove = gameHost.processMove(this.peer, data);

            if (isValidMove) {
                // Broadcast new state.
                sendStateToPlayers();
            }
        }
    }
}

function sendToAllPlayers(data) {
    connections.forEach(
        element => element.send(data)
    );
}