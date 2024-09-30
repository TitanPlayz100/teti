import { lowerIsBetter } from "../data/data.js";
import { Game } from "../game.js";

export class ProfileStats {
    personalBests = {};
    notSaved = ['game', 'level', 'combo']

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
        const lower = lowerIsBetter[this.game.modes.modeJSON.result];

        if (!this.game.settings.game.competitiveMode) return;

        if (isNaN(currentScore) || currentScore == undefined || (lower && score < currentScore) || (!lower && score > currentScore)) {
            let gameStatsKeys = Object.getOwnPropertyNames(this.game.stats)
            gameStatsKeys = gameStatsKeys.filter(key => key != 'game')
            const gameStats = {};
            gameStatsKeys.forEach(key => gameStats[key] = this.game.stats[key])
            const ts = new Date().toJSON();
            this.personalBests[gamemode] = { score, pbstats: gameStats, version: this.game.version, ts };
            this.game.elementGameEndTitle.textContent = 'NEW PB!';
            setTimeout(() => this.game.sounds.playSound("personalbest"), 1000);
        }
    }

    loadPBs() {
        const stats = JSON.parse(localStorage.getItem("stats")) ?? {};
        this.personalBests = stats.pbs ?? {};
    }

    removePB(mode) {
        delete this.personalBests[mode];
        this.saveSession();
    }

    saveSession() {
        const prevstats = JSON.parse(localStorage.getItem("stats")) ?? {};
        const statsData = prevstats.lifetime ?? {};

        Object.getOwnPropertyNames(this.game.stats).forEach(key => {
            if (this.notSaved.includes(key)) return;

            if (key == 'clearCols' || key == 'tspins') {
                if (statsData[key] == undefined || typeof statsData[key] != 'object') statsData[key] = []
                this.game.stats[key].forEach((_, index) => {
                    if (statsData[key][index] == undefined) statsData[key][index] = 0
                    statsData[key][index] += this.game.stats[key][index];
                });
                return;
            }
            if (key == 'clearPieces') {
                if (statsData[key] == undefined) {
                    statsData[key] = this.game.stats[key];
                    return;
                }
                Object.keys(this.game.stats[key]).forEach(piece => {
                    this.game.stats[key][piece].forEach((_, index) => {
                        if (statsData[key][piece] == undefined) statsData[key][piece] = [0, 0, 0, 0];
                        statsData[key][piece][index] += this.game.stats[key][piece][index];
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