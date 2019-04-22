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
            this.playerMatchInfos.set(player, Infos.PlayerMatchInfo());
        });
    }

    buildDefaultPlayerRoundInfos() {
        this.playerPeers.forEach(player => {
            this.playerRoundInfos.set(player, Infos.PlayerRoundInfo());
        });
    }

    startGame() {
        console.log("Required number of players present. Starting game");

        this.globalMatchInfo.matchState = CONSTANTS.MATCH_STATE_ALL_CONNECTED;

        this.buildDefaultPlayerMatchInfos();
        this.buildDefaultPlayerRoundInfos();
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

    recieveInputFromPlayer(peer, data) {
        this.output = [];

        const isActivePlayer = this.checkPlayerIsActive(peer);
    
        this.output.push(
            {
                peer: peer,
                data: {isActivePlayer: isActivePlayer}
            }
        )
    }

    getOutputs() {
        return this.output;
    }
}

module.exports = GameHost;