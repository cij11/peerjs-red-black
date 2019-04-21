const AWAITING_PLAYERS = "AWAITING_PLAYERS";
const GAME_IN_PROGRESS = "GAME_IN_PROGRESS";

class GameHost {
    constructor() {
        this.players = [];

        this.playersGameInfo = {};
        this.playersRoundInfo = {};
    
        this.hostGameInfo = {};
        this.hostRoundInfo = {};
    }

    
    addPlayer(player) {
        this.players.push(player);
    }

    logPlayers() {
        console.log("Logging players");
        console.log(this.players);
    }

    buildPlayerGameInfo() {
        let playersInfo = {};

        this.players.forEach(player => {
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
}

module.exports = GameHost;