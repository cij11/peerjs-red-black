const GameHost = function () {
    this.players = [];
    
    this.addPlayer = function(player) {
        this.players.push(player);
    }

    this.logPlayers = function() {
        console.log(this.players);
    }
}

module.exports = GameHost;