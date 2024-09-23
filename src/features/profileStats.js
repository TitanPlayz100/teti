import { Game } from "../game.js";

export class ProfileStats {
    personalBests = {};

    lowerData = {
        time: true,
        score: false,
        maxCombo: false
    }


    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

    /**
     * @param {Boolean} lower 
     * Lower is used depending on objective type e.g. lower time is better thus lower is true
     */

    setPB(score) {
        this.game.elementGameEndTitle.textContent = 'GAME ENDED';
        const gamemode = this.game.settings.game.gamemode
        const gamemodeStats = this.personalBests[gamemode] ?? {};
        const currentScore = Number(gamemodeStats.score);
        const lower = this.lowerData[this.game.modes.modeJSON.result];

        if (!this.game.settings.game.competitiveMode) return;

        if (isNaN(currentScore) || currentScore == undefined || (lower && score < currentScore) || (!lower && score > currentScore)) {
            let gameStatsKeys = Object.getOwnPropertyNames(this.game.stats)
            gameStatsKeys = gameStatsKeys.filter(key => key != 'game')
            const gameStats = {};
            gameStatsKeys.forEach(key => gameStats[key] = this.game.stats[key])
            this.personalBests[gamemode] = { score, pbstats: gameStats, version: this.game.version };
            this.game.elementGameEndTitle.textContent = 'NEW PB!';
            this.game.sounds.playSound("personalbest")
        }
    }

    loadPBs() {
        const stats = JSON.parse(localStorage.getItem("stats")) ?? {};
        this.personalBests = stats.pbs ?? {};
    }

    saveSession() {
        const prevstats = JSON.parse(localStorage.getItem("stats")) ?? {};
        const statsData = prevstats.lifetime ?? {};

        Object.getOwnPropertyNames(this.game.stats).forEach(key => {
            const notSaved = ['game', 'level', 'combo']
            if (notSaved.includes(key)) return;
            if (key == 'clearCols') {
                if (statsData[key] == undefined) statsData[key] = []
                this.game.stats.clearCols.forEach((col, index) => {
                    if (statsData[key][index] == undefined) statsData[key][index] = 0
                    statsData[key][index] += this.game.stats.clearCols[index];
                });
                return;
            }
            if (key == 'clearPieces') {
                if (statsData[key] == undefined) {
                    statsData[key] = this.game.stats.clearPieces;
                    return;
                }
                Object.keys(this.game.stats.clearPieces).forEach(piece => {
                    this.game.stats.clearPieces[piece].forEach((lineclear, index) => {
                        if (statsData[key][piece] == undefined) statsData[key][piece] = [0, 0, 0, 0];
                        statsData[key][piece][index] += this.game.stats.clearPieces[piece][index];
                    });
                });
                return;
            }
            if (key == "maxBTB" || key == "maxCombo") {
                if (statsData[key] < this.game.stats[key] ) statsData[key] = this.game.stats[key];
                return;
            }
            if (this.game.stats[key] < 0) this.game.stats[key] = 0
            statsData[key] += this.game.stats[key];
        })
        const stats = { pbs: this.personalBests, lifetime: statsData }
        localStorage.setItem("stats", JSON.stringify(stats));
    }
}