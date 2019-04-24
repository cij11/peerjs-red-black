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

updateAllInfo();

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


    let playRedButton = document.getElementById("playRedCard");
    playRedButton.onclick = () => {
        conn.send(
            {
                action: CONSTANTS.PLAY_RED_CARD
            }
        );
    }

    let playBlackButton = document.getElementById("playBlackCard");
    playBlackButton.onclick = () => {
        conn.send(
            {
                action: CONSTANTS.PLAY_BLACK_CARD
            }
        );
    }

    let challengeAmountInput = document.getElementById("challengeAmount");
    let makeChallengeButton = document.getElementById("makeChallenge");
    makeChallengeButton.onclick = () => {
        conn.send(
            {
                action: CONSTANTS.CHALLENGE,
                payload: {
                    challengeBid: challengeAmountInput.value
                }
            }
        );
    }

    let passButton = document.getElementById("pass");
    passButton.onclick = () => {
        conn.send(
            {
                action: CONSTANTS.PASS
            }
        );
    }
};

function recieveData(data) {
    console.log("Received data from host:")
    console.log(data);
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
            break;
        case CONSTANTS.SET_PLAYER_ROUND_INFO:
            playerRoundInfo = data.payload;
            updatePlayerRoundInfo();
            break;
        case CONSTANTS.SET_ALL_INFO:
            globalMatchInfo = data.payload.globalMatchInfo;
            globalRoundInfo = data.payload.globalRoundInfo;
            playerMatchInfo = data.payload.playerMatchInfo;
            playerRoundInfo = data.payload.playerRoundInfo;
            updateAllInfo();
            break;

    }
}

function updateAllInfo() {
    updateGlobalMatchInfo();
    updateGlobalRoundInfo();
    updatePlayerMatchInfo();
    updatePlayerRoundInfo();
}

function updateGlobalMatchInfo() {
    let gameStateDisplay = document.getElementById("gameState");
    gameStateDisplay.innerText = globalMatchInfo.matchState;
}

function updateGlobalRoundInfo() {
    let activePlayer = document.getElementById("activePlayer");
    if (globalRoundInfo.activePlayer === CONSTANTS.ALL_ACTIVE) {
        activePlayer.innerText = "All players active";
    } else if (globalRoundInfo.activePlayer === playerRoundInfo.peerId) {
        activePlayer.innerText = "You are the active player: " + playerRoundInfo.peerId;
    } else {
        activePlayer.innerText = "Waiting for active player: " + globalRoundInfo.activePlayer;
    }

    let roundState = document.getElementById("roundState");
    roundState.innerText = globalRoundInfo.roundState

    let currentChallengeBid = document.getElementById("currentChallengeBid");
    currentChallengeBid.innerText = globalRoundInfo.currentChallengeBid;

    let successfulReveals = document.getElementById("successfulReveals");
    successfulReveals.innerText = globalRoundInfo.successfulReveals;

    drawOtherPlayersCards();
}

function updatePlayerMatchInfo() {
    let wins = document.getElementById("wins");
    wins.innerText = playerMatchInfo.wins;

    let peerIdFromHost = document.getElementById("peerIdFromHost");
    peerIdFromHost.innerText = playerMatchInfo.peerId
}

function updatePlayerRoundInfo() {
    let handRedCards = document.getElementById("handRedCards");
    handRedCards.innerText = playerRoundInfo.handRedCards;

    let handBlackCards = document.getElementById("handBlackCards");
    handBlackCards.innerText = playerRoundInfo.handBlackCards;

    drawStack();
}

function drawStack() {
    let stackList = document.getElementById("stackList");

    while (stackList.firstChild) {
        stackList.removeChild(stackList.firstChild);
    }

    playerRoundInfo.stack.forEach(
        card => {
            let cardItem = document.createElement('li');
            cardItem.appendChild(document.createTextNode(card));
            stackList.appendChild(cardItem);
        }
    )
}

function drawOtherPlayersCards() {
    let otherPlayersCards = document.getElementById("otherPlayersCards");

    while (otherPlayersCards.firstChild) {
        otherPlayersCards.removeChild(otherPlayersCards.firstChild);
    }

    Object.keys(globalRoundInfo.stackSizeByPlayer).forEach(function(key) {
        let otherPlayerCardsItem = document.createElement('li');
        let text = "Player: " + key + " card count: " + globalRoundInfo.stackSizeByPlayer[key];
        otherPlayerCardsItem.appendChild(document.createTextNode(text));
        otherPlayersCards.appendChild(otherPlayerCardsItem);

        let revealCardButtonItem = document.createElement('BUTTON');
        let buttonTextNode = document.createTextNode("Reveal Card from player: " + key);
        revealCardButtonItem.appendChild(buttonTextNode);

        revealCardButtonItem.onclick = () => {
            conn.send(
                {
                    action: CONSTANTS.REVEAL,
                    payload: {
                        revealPlayer: key
                    }
                }
            );
        }

        otherPlayerCardsItem.appendChild(revealCardButtonItem);
      })
}

