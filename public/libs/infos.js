const CONSTANTS = require("./constants.js");

function GlobalMatchInfo() {
    return {
        matchState: CONSTANTS.MATCH_STATE_NOT_CONNECTED,
    };
}

function GlobalRoundInfo() {
    return {
        roundState: CONSTANTS.ROUND_STATE_INITIAL_PLACEMENT,
        activePlayer: CONSTANTS.ALL_ACTIVE,
        hasPlayedFirstCard: [],
        skipped: [],
        stackSizeByPlayer: {},
        currentChallengeBid: 0,
        successfulReveals: 0
    }

}

function PlayerMatchInfo() {
    return{
        totalRedCards: 3,
        totalBlackCards: 1,
        wins: 0,
        peerId: 'not-set',
    }
}

function PlayerRoundInfo() {
    return {
        handRedCards: 3,
        handBlackCards: 1,
        stack: [],
        peerId: 'not-set',
    }
}

module.exports = {
    GlobalMatchInfo,
    GlobalRoundInfo,
    PlayerRoundInfo,
    PlayerMatchInfo,
}