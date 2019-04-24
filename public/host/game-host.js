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
        this.globalRoundInfo.stackSizeByPlayer = this.buildStackSizeByPlayer();
        return {
            globalMatchInfo: this.globalMatchInfo,
            globalRoundInfo: this.globalRoundInfo,
            playerMatchInfo: this.playerMatchInfos.get(peerId),
            playerRoundInfo: this.playerRoundInfos.get(peerId)
        }
    }

    buildStackSizeByPlayer() {
        let stackSizeByPlayer = {};

        this.playerPeers.forEach(
            player => {
                stackSizeByPlayer[player] = this.playerRoundInfos.get(player).stack.length;
            }
        )

        return stackSizeByPlayer;
    }

    startGame() {
        console.log("Required number of players present. Starting game");

        this.globalMatchInfo.matchState = CONSTANTS.MATCH_STATE_ALL_CONNECTED;

        this.buildDefaultPlayerMatchInfos();
        this.buildDefaultPlayerRoundInfos();
    }

    startPlacing() {
        console.log("All players placed first card. Starting placing");

        this.globalRoundInfo.activePlayer = this.getRandomPlayer();
        this.globalRoundInfo.roundState = CONSTANTS.ROUND_STATE_PLACING;
    }

    // Return false if invalid move
    processMove(peerId, data) {
        if(this.globalRoundInfo.roundState === CONSTANTS.ROUND_STATE_INITIAL_PLACEMENT) {
            let playRed = data.action === CONSTANTS.PLAY_RED_CARD;
            let playBlack = data.action === CONSTANTS.PLAY_BLACK_CARD;

            if (playRed && !this.checkTotalRedValid(peerId)) {
                return false;
            }

            if (playBlack && !this.checkTotalBlackValid(peerId)) {
                return false;
            }

            if (!(playRed || playBlack)) return false;

            if (playRed) this.playFirstRed(peerId);
            if (playBlack) this.playFirstBlack(peerId);

            if(!this.globalRoundInfo.hasPlayedFirstCard.includes(peerId)) {
                this.globalRoundInfo.hasPlayedFirstCard.push(peerId);
                if (this.globalRoundInfo.hasPlayedFirstCard.length === CONSTANTS.REQUIRED_PLAYERS) {
                    this.startPlacing();
                }
            }

            return true;
        }

        // For all other round states, only the active player can move
        if (this.globalRoundInfo.activePlayer !== peerId) {
            return false;
        }

        // Placing cards
        if(this.globalRoundInfo.roundState === CONSTANTS.ROUND_STATE_PLACING) {
            let playRed = data.action === CONSTANTS.PLAY_RED_CARD;
            let playBlack = data.action === CONSTANTS.PLAY_BLACK_CARD;
            let playChallenge = data.action === CONSTANTS.CHALLENGE;

            if (playRed && !this.checkHandRedValid(peerId)) {
                return false;
            }

            if (playBlack && !this.checkHandBlackValid(peerId)) {
                return false;
            }

            if (playChallenge && !this.checkChallengeValid(data.payload.challengeBid)) {
                return false;
            }

            if (playRed) this.playRed(peerId);
            if (playBlack) this.playBlack(peerId);

            if(playChallenge) {
                this.playChallenge(data.payload.challengeBid);
                this.globalRoundInfo.roundState = CONSTANTS.ROUND_STATE_CHALLENGING;
            }

            this.advanceActivePlayer();
            return true;
        }

        if(this.globalRoundInfo.roundState == CONSTANTS.ROUND_STATE_CHALLENGING) {
            let playChallenge = data.action === CONSTANTS.CHALLENGE;
            let pass = data.action === CONSTANTS.PASS;

            if (playChallenge && !this.checkChallengeValid(data.payload.challengeBid)) {
                return false;
            }

            if(playChallenge) {
                this.playChallenge(data.payload.challengeBid);
                this.advanceActivePlayer();
                return true;
            }

            if(pass) {
                this.globalRoundInfo.skipped.push(peerId);

                this.advanceActivePlayer();

                // If all but one have skipped
                if (this.globalRoundInfo.skipped.length === this.playerPeers.length -1) {
                    this.globalRoundInfo.activePlayer = this.getUnskippedPlayer();
                    this.globalRoundInfo.roundState = CONSTANTS.ROUND_STATE_REVEALING;
                }

                return true;
            }
        }

        return false;
    }

    checkTotalRedValid(peerId) {
        const playerMatchInfo = this.playerMatchInfos.get(peerId);
        return playerMatchInfo.totalRedCards > 0;
    }

    checkTotalBlackValid(peerId) {
        const playerMatchInfo = this.playerMatchInfos.get(peerId);
        return playerMatchInfo.totalBlackCards > 0;
    }

    checkHandRedValid(peerId) {
        const playerRoundInfo = this.playerRoundInfos.get(peerId);
        return playerRoundInfo.handRedCards > 0;
    }

    checkHandBlackValid(peerId) {
        const playerRoundInfo = this.playerRoundInfos.get(peerId);
        return playerRoundInfo.handBlackCards > 0;
    }

    checkChallengeValid(challengeBid) {
        return challengeBid > this.globalRoundInfo.currentChallengeBid && challengeBid <= this.totalPlayedCards();
    }

    totalPlayedCards() {
        let playedCardCount = 0;

        Object.keys(this.globalRoundInfo.stackSizeByPlayer).forEach(
            key => {
                playedCardCount += this.globalRoundInfo.stackSizeByPlayer[key];
            }
        )

        return playedCardCount;
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

    playRed(peerId) {
        const playerRoundInfo = this.playerRoundInfos.get(peerId);

        playerRoundInfo.stack.push('red');
        playerRoundInfo.handRedCards = playerRoundInfo.handRedCards - 1;
    }

    playBlack(peerId) {
        const playerRoundInfo = this.playerRoundInfos.get(peerId);

        playerRoundInfo.stack.push('black');
        playerRoundInfo.handBlackCards = playerRoundInfo.handBlackCards - 1;
    }

    playChallenge(challengeBid) {
        this.globalRoundInfo.currentChallengeBid = challengeBid;
    }

    setActivePlayer(activePlayerPeer) {
        this.globalRoundInfo.activePlayer = activePlayerPeer;
    }

    setAllPlayersActive() {
        this.globalRoundInfo.activePlayer = CONSTANTS.ALL_ACTIVE;
    }

    advanceActivePlayer() {
        let activeIndex = this.playerPeers.indexOf(this.globalRoundInfo.activePlayer);
        activeIndex++;
        if (activeIndex === this.playerPeers.length) activeIndex = 0;

        this.globalRoundInfo.activePlayer = this.playerPeers[activeIndex];

        if(this.globalRoundInfo.skipped.includes(this.globalRoundInfo.activePlayer)) {
            this.advanceActivePlayer();
        }
    }

    checkPlayerIsActive(playerPeer) {
        return (this.globalRoundInfo.activePlayer === CONSTANTS.ALL_ACTIVE || this.globalRoundInfo.activePlayer === playerPeer);
    }

    getRandomPlayer() {
        const index = Math.floor(Math.random(0, this.playerPeers.length));
        return this.playerPeers[index];
    }

    getUnskippedPlayer() {
        this.playerPeers.forEach(
            playerPeer => {
                if(!this.globalRoundInfo.skipped.includes(playerPeer)){
                    return playerPeer;
                }
            }
        )
        throw("No unskipped players to return");
    }

}

module.exports = GameHost;