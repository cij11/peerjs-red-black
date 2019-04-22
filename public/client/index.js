require('../libs/peer.js');

console.log("Client source hit.");

var lastPeerId = 0;
var peer;
var conn;

var recvIdInput = {
    value: "mnr6qkd369f00000"
};

let gameInfo = {
    gameState: 'NOT_CONNECTED'
}

var sendTestMessageButton = document.getElementById("testButton");
sendTestMessageButton.onclick = () => conn.send("test");

var setHostId = document.getElementById("setHostId");
var submitHostId = document.getElementById("submitHostId");
submitHostId.onclick = () => {
    recvIdInput.value = setHostId.value;
    initialize();
    join();
}

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

        console.log('ID: ' + peer.id);
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

/**
 * Create the connection between the two Peers.
 *
 * Sets up callbacks that handle any events related to the
 * connection and data received on it.
 */
function join() {
    // Close old connection
    if (conn) {
        conn.close();
    }

    // Create connection to destination peer specified in the input field
    conn = peer.connect(recvIdInput.value, {
        reliable: true
    });

    conn.on('open', function () {
        console.log("Connected to: " + conn.peer);

        conn.send("test");
        gameInfo.gameState = "AWAITING_PLAYERS";
        updateGameState();
    });
    // Handle incoming data (messages only since this is the signal sender)
    conn.on('data', function (data) {
        console.log(data);
        receiveMessageFromHost(data);
    });
    conn.on('close', function () {
        console.log("Connection closed");
    });
};

function receiveMessageFromHost(data) {
    switch(data.action) {
        case 'SET_GAME_STATE':
            gameInfo.gameState = data.payload;
            updateGameState();
            console.log("Game state set to " + data.payload);
            break;
    }
}

function updateGameState() {
    let gameStateDisplay = document.getElementById("gameState");
    gameStateDisplay.innerText = gameInfo.gameState;
}