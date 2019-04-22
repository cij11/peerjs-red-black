const AWAITING_PLAYERS = "AWAITING_PLAYERS";
const GAME_IN_PROGRESS = "GAME_IN_PROGRESS";

class GameHost {
    constructor() {
        this.playerPeers = [];

        this.activePlayerPeers = []; // Player(s) who can submit moves

        this.playersGameInfo = {};
        this.playersRoundInfo = {};
    
        this.hostGameInfo = {};
        this.hostRoundInfo = {};
    }

    
    addPlayer(player) {
        this.playerPeers.push(player);
    }

    logPlayers() {
        console.log("Logging players");
        console.log(this.playerPeers);
    }

    buildPlayerGameInfo() {
        let playersInfo = {};

        this.playerPeers.forEach(player => {
            let playerInfo = {
                reds: 3,
                blacks: 1,
                wins: 0
            };
            playersInfo[player] = playerInfo;
        });

        console.log("Players Info: ")
        console.log(playersInfo);
        return playersInfo;
    }

    startGame() {
        console.log("Required number of players present. Starting game");

        this.playerGameInfo = this.buildPlayerGameInfo();
    }

    setActivePlayer(activePlayerPeer) {
        this.activePlayerPeers = [];
        this.activePlayerPeers.push(activePlayerPeer);
    }

    setAllPlayersActive() {
        this.activePlayerPeers = this.playerPeers;
    }

    checkPlayerIsActive(player) {
        return this.activePlayerPeers.includes(player);
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