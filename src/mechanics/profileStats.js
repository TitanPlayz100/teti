import { Game } from "../game.js";

export class ProfileStats {
    personalBests = {};

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
    setPB(score, gamemode, lower) {
        this.game.elementGameEndTitle.textContent = 'GAME ENDED';

        const gamemodeStats = this.personalBests[gamemode] ?? {};
        const currentScore = Number(gamemodeStats.score);
        if (currentScore == undefined || (lower && score < currentScore) || (!lower && score > currentScore)) {
            let gameStatsKeys = Object.getOwnPropertyNames(this.game.stats)
            gameStatsKeys = gameStatsKeys.filter(key => key != 'game')
            const gameStats = {};
            gameStatsKeys.forEach(key => gameStats[key] = this.game.stats[key])
            this.personalBests[gamemode] = { score, pbstats: gameStats };
            this.game.elementGameEndTitle.textContent = 'NEW PB!';
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
            if (key == 'game' || key == 'btbCount' || key == 'level' || key == 'maxCombo') return;
            statsData[key] += this.game.stats[key];
        })
        const stats = { pbs: this.personalBests, lifetime: statsData }
        localStorage.setItem("stats", JSON.stringify(stats));
    }
}