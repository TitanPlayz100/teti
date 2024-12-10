import { lowerIsBetter } from "../data/data.js";
import { Game } from "../main.js";

export class ProfileStats {
    personalBests = {};
    notSaved = ['game', 'level', 'combo']
    elementGameEndTitle = document.getElementById("gameEndTitle");

    setPB(score) {
        this.elementGameEndTitle.textContent = 'GAME ENDED';
        const gamemode = Game.settings.game.gamemode
        const gamemodeStats = this.personalBests[gamemode] ?? {};
        const currentScore = Number(gamemodeStats.score);
        const lower = lowerIsBetter[Game.modes.modeJSON.result];

        if (!Game.settings.game.competitiveMode) return;

        if (isNaN(currentScore) || (lower && score < currentScore) || (!lower && score > currentScore)) {
            let gameStatsKeys = Object.getOwnPropertyNames(Game.stats)
            gameStatsKeys = gameStatsKeys.filter(key => key != 'game')
            const gameStats = {};
            gameStatsKeys.forEach(key => gameStats[key] = Game.stats[key])
            const ts = new Date().toJSON();
            this.personalBests[gamemode] = { score, pbstats: gameStats, version: Game.version, ts };
            this.elementGameEndTitle.textContent = 'NEW PB!';
            setTimeout(() => Game.sounds.playSound("personalbest"), 1000);

            Game.modals.generate.notif("PB Saved", `PB on ${gamemode} saved`, "success");
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

        Object.getOwnPropertyNames(Game.stats).forEach(key => {
            if (this.notSaved.includes(key)) return;

            if (key == 'clearCols' || key == 'tspins') {
                if (statsData[key] == undefined || typeof statsData[key] != 'object') statsData[key] = []
                Game.stats[key].forEach((_, index) => {
                    if (statsData[key][index] == undefined) statsData[key][index] = 0
                    statsData[key][index] += Game.stats[key][index];
                });
                return;
            }
            if (key == 'clearPieces') {
                if (statsData[key] == undefined) {
                    statsData[key] = Game.stats[key];
                    return;
                }
                Object.keys(Game.stats[key]).forEach(piece => {
                    Game.stats[key][piece].forEach((_, index) => {
                        if (statsData[key][piece] == undefined) statsData[key][piece] = [0, 0, 0, 0];
                        statsData[key][piece][index] += Game.stats[key][piece][index];
                    });
                });
                return;
            }
            if (key == "maxBTB" || key == "maxCombo") {
                if (statsData[key] < Game.stats[key] ) statsData[key] = Game.stats[key];
                return;
            }
            if (Game.stats[key] < 0) Game.stats[key] = 0
            statsData[key] += Game.stats[key];
        })
        const stats = { pbs: this.personalBests, lifetime: statsData }
        localStorage.setItem("stats", JSON.stringify(stats));
    }
}