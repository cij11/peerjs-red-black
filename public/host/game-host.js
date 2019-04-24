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

            if (!(playRed || playBlack || playChallenge)) return false;

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

            // Only challenge and pass are valid during challenge phase.
            if (!(playChallenge || pass)) return false;

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

                // If all but one have skipped
                if (this.globalRoundInfo.skipped.length === this.playerPeers.length -1) {
                    this.globalRoundInfo.activePlayer = this.getUnskippedPlayer();
                    this.globalRoundInfo.roundState = CONSTANTS.ROUND_STATE_REVEALING;
                    return true;
                }

                this.advanceActivePlayer();
                return true;
            }
        }


        if(this.globalRoundInfo.roundState == CONSTANTS.ROUND_STATE_REVEALING) {
            let playReveal = data.action === CONSTANTS.REVEAL;

            // Only revealing is valid during reveal phase.
            if(!playReveal) return false;

            if(playReveal && !this.checkRevealValid(peerId, data.payload.revealPlayer)) {
                return false;
            }

            this.playReveal(peerId, data.payload.revealPlayer);
            return true;
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

    checkRevealValid(peerId, playerToReveal) {
        // If the player has cards in their stack, these must be revealed first
        if (this.globalRoundInfo.stackSizeByPlayer[peerId] > 0) {
            if (peerId !== playerToReveal) {
                return false;
            }
        }

        // The stack to be revealed must contain cards
        if (this.globalRoundInfo.stackSizeByPlayer[playerToReveal] === 0) {
            return false;
        }

        return true;
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

    playReveal(peerId, playerToReveal) {
        let revealedCard = this.playerRoundInfos.get(playerToReveal).stack.pop();

        if (revealedCard === 'black') {
            this.losePlayer(peerId);
            this.newRound();
        }

        if (revealedCard === 'red') {
            this.globalRoundInfo.successfulReveals = this.globalRoundInfo.successfulReveals + 1;

            // Use == because we want to coerse an equality between an int and a string
            if (this.globalRoundInfo.successfulReveals == this.globalRoundInfo.currentChallengeBid) {
                this.winPlayer(peerId);
                this.newRound();
            }
        }
    }

    losePlayer(peerId) {
        let playerMatchInfo = this.playerMatchInfos.get(peerId);
        let playerRoundInfo = this.playerRoundInfos.get(peerId);

        let discard = Math.random();

        if (discard < 0.25) {
            if (playerMatchInfo.totalBlackCards > 0) {
                playerMatchInfo.totalBlackCards = 0;
            } else {
                playerMatchInfo.totalRedCards -= 1;
            }
        } else {
            if (playerMatchInfo.totalRedCards > 0) {
                playerMatchInfo.totalRedCards -= 1;
            } else {
                playerMatchInfo.totalBlackCards = 0;
            }
        }

        // Eliminate player if out of cards
        if (playerMatchInfo.totalBlackCards + playerMatchInfo.totalRedCards === 0) {
            for( var i = 0; i < this.playerPeers.length; i++){ 
                if ( this.playerPeers[i] === peerId) {
                    this.playerPeers.splice(i, 1); 
                }
             }
        }
    }

    winPlayer(peerId) {
        this.playerMatchInfos.get(peerId).wins += 1;
    }

    newRound() {
        this.globalRoundInfo = Infos.GlobalRoundInfo();

        this.playerRoundInfos = new Map();

        this.playerPeers.forEach(
            peerId => {
                let playerRoundInfo = Infos.PlayerRoundInfo();
                playerRoundInfo.peerId = peerId;
                playerRoundInfo.handRedCards = this.playerMatchInfos.get(peerId).totalRedCards;
                playerRoundInfo.handBlackCards = this.playerMatchInfos.get(peerId).totalBlackCards;

                this.playerRoundInfos.set(peerId, playerRoundInfo);
            }
        )
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
        let unskippedPlayer = null;
        this.playerPeers.forEach(
            playerPeer => {
                if(!this.globalRoundInfo.skipped.includes(playerPeer)){
                    unskippedPlayer = playerPeer;
                }
            }
        )
        if (unskippedPlayer === null) {
            throw("No unskipped players to return");
        }
        
        return unskippedPlayer;
    }

}

module.exports = GameHost;