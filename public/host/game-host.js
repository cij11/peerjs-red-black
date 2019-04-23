const CONSTANTS = require('../libs/constants.js');
const Infos = require('../libs/infos.js');

class GameHost {
    constructor() {
        this.playerPeers = [];

        this.globalMatchInfo = Infos.GlobalMatchInfo();
        this.globalRoundInfo = Infos.GlobalRoundInfo();

        this.playerMatchInfos = new Map();
        this.playerRoundInfos = new Map();
    }

    
    addPlayer(player) {
        this.playerPeers.push(player);
    }

    logPlayers() {
        console.log("Logging players");
        console.log(this.playerPeers);
    }

    buildDefaultPlayerMatchInfos() {
        this.playerPeers.forEach(player => {
            let playerMatchInfo = Infos.PlayerMatchInfo();
            playerMatchInfo.peerId = player;
            this.playerMatchInfos.set(player, playerMatchInfo);
        });
    }

    buildDefaultPlayerRoundInfos() {
        this.playerPeers.forEach(player => {
            let playerRoundInfo = Infos.PlayerRoundInfo()
            playerRoundInfo.peerId = player;
            this.playerRoundInfos.set(player, playerRoundInfo);
        });
    }

    getPayloadForPeer(peerId) {
        return {
            globalMatchInfo: this.globalMatchInfo,
            globalRoundInfo: this.globalRoundInfo,
            playerMatchInfo: this.playerMatchInfos.get(peerId),
            playerRoundInfo: this.playerRoundInfos.get(peerId)
        }
    }

    startGame() {
        console.log("Required number of players present. Starting game");

        this.globalMatchInfo.matchState = CONSTANTS.MATCH_STATE_ALL_CONNECTED;

        this.buildDefaultPlayerMatchInfos();
        this.buildDefaultPlayerRoundInfos();
    }

    // Return false if invalid move
    processMove(peerId, data) {
        if(this.globalRoundInfo.roundState === CONSTANTS.ROUND_STATE_INITIAL_PLACEMENT) {
            let playRed = data.action === CONSTANTS.PLAY_RED_CARD;
            let playBlack = data.action === CONSTANTS.PLAY_BLACK_CARD;

            if (playRed && !checkRedValid(peerId)) {
                return false;
            }

            if (playBlack && !checkBlackValid(peerId)) {
                return false;
            }

            if (playRed) playFirstRed(peerId);
            if (playBlack) playFirstBlack(peerId);

            if(playRed || playBlack) true;
        }

        return false;
    }

    checkRedValid(peerId) {
        return this.playerRoundInfos.get(peerId).handRedCards > 0;
    }

    checkBlackValid(peerId) {
        return this.playerRoundInfos.get(peerId).handBlackCards > 0;
    }

    playFirstRed(peerId) {
        const playerRoundInfo = this.playerRoundInfos.get(peerId);
        const playerMatchInfo = this.playerMatchInfos.get(peerId);

        playerRoundInfo.stack = [];
        playerRoundInfo.stack.push('red');
        playerRoundInfo.handRedCards = playerMatchInfo.totalRedCards - 1;
        playerRoundInfo.handBlackCards = playerMatchInfo.totalBlackCards;
    }

    playFirstBlack(peerId) {
        const playerRoundInfo = this.playerRoundInfos.get(peerId);
        const playerMatchInfo = this.playerMatchInfos.get(peerId);

        playerRoundInfo.stack = [];
        playerRoundInfo.stack.push('black');
        playerRoundInfo.handBlackCards = 0;
        playerRoundInfo.handRedCards = playerMatchInfo.totalRedCards;
    }

    setActivePlayer(activePlayerPeer) {
        this.globalRoundInfo.activePlayer = activePlayerPeer;
    }

    setAllPlayersActive() {
        this.globalRoundInfo.activePlayer = CONSTANTS.ALL_ACTIVE;
    }

    checkPlayerIsActive(playerPeer) {
        return (this.globalRoundInfo.activePlayer === CONSTANTS.ALL_ACTIVE || this.globalMatchInfo.activePlayer === playerPeer);
    }

    getRandomPlayer() {
        const index = Math.floor(Math.random(0, this.playerPeers.length));
        return this.playerPeers[index];
    }

    getPlayerGameInfoByPeer(peer) {
        if (this.playerGameInfo.hasOwnProperty(peer)) {
            return this.playerGameInfo[peer];
        } else {
            throw("Peer not in playerGameInfo");
        }
        
    }
}

module.exports = GameHost;