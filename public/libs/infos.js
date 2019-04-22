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
    }

}

function PlayerMatchInfo() {
    return{
        totalRedCards: 3,
        totalBlackCards: 1,
        wins: 0,
    }
}

function PlayerRoundInfo() {
    return {
        handRedCards: 3,
        handBlackCards: 1,
        stack: [],
    }
}

module.exports = {
    GlobalMatchInfo,
    GlobalRoundInfo,
    PlayerRoundInfo,
    PlayerMatchInfo,
}