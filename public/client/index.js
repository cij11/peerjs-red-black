require('../libs/peer.js');
const CONSTANTS = require("../libs/constants.js");
const Infos = require("../libs/infos.js");

console.log("Client source hit.");

var lastPeerId = 0;
var peer;
var conn;

var recvIdInput = {
    value: "mnr6qkd369f00000"
};

let globalMatchInfo = Infos.GlobalMatchInfo();
let globalRoundInfo = Infos.GlobalRoundInfo();
let playerMatchInfo = Infos.PlayerMatchInfo();
let playerRoundInfo = Infos.PlayerRoundInfo();

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
        globalMatchInfo.matchState = "AWAITING_PLAYERS";
        updateGlobalMatchInfo();
    });
    // Handle incoming data (messages only since this is the signal sender)
    conn.on('data', function (data) {
        console.log(data);
        recieveData(data);
    });
    conn.on('close', function () {
        console.log("Connection closed");
    });
};

function recieveData(data) {
    switch(data.action) {
        case CONSTANTS.SET_GLOBAL_MATCH_INFO:
            globalMatchInfo = data.payload;
            updateGlobalMatchInfo();
            console.log(data.payload, "Setting globalMatchInfo");
            break;
        case CONSTANTS.SET_GLOBAL_ROUND_INFO:
            globalRoundInfo = data.payload;
            updateGlobalRoundInfo();
            console.log(data.payload, "Setting globalRoundInfo");
            break;
        case CONSTANTS.SET_PLAYER_MATCH_INFO:
            playerMatchInfo = data.payload;
            updatePlayerMatchInfo();
        case CONSTANTS.SET_PLAYER_ROUND_INFO:
            playerRoundInfo = data.payload;
            updatePlayerRoundInfo();
    }
}

function updateGlobalMatchInfo() {
    let gameStateDisplay = document.getElementById("gameState");
    gameStateDisplay.innerText = globalMatchInfo.matchState;
}

function updateGlobalRoundInfo() {
    let activePlayer = document.getElementById("activePlayer");
    if (globalMatchInfo.activePlayer === "ALL") {
        activePlayer.innerText = "All players active";
    } else if (globalMatchInfo.activePlayer === peer.id) {
        activePlayer.innerText = "You are the active player: " + peer.id;
    } else {
        activePlayer.innerText = "Waiting for active player: " + peer.id;
    }
}

function updatePlayerMatchInfo() {
    let wins = document.getElementById("wins");
    wins = playerMatchInfo.wins;
}

function updatePlayerRoundInfo() {
    let handRedCards = document.getElementById("handRedCards");
    handRedCards.innerText = playerRoundInfo.handRedCards;

    let handBlackCards = document.getElementById("handBlackCards");
    handBlackCards.innerText = playerRoundInfo.handBlackCards;
}