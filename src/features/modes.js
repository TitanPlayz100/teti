import { Game } from "../game.js";
import gamemodeJSON from "../data/gamemodes.json" with { type: "json" };
import { resultSuffix } from "../data/data.js";

export class Modes {
    elementobjectives = document.getElementById("objective");
    divObjectiveText = document.getElementById("objectiveText");
    modeJSON;
    customSettings;

    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

    checkFinished() {
        const goals = this.game.settings.game;
        const stats = this.game.stats;

        // hardcoded objectives
        let combobreak = this.game.stats.combo == -1 && stats.clearlines >= 1 && this.modeJSON.target == 'combobreak';
        let gameend = this.game.ended && this.modeJSON.target == 'gameEnd';
        let stat = stats[this.modeJSON.goalStat]
        let goal = goals[this.modeJSON.target]
        let result = stats[this.modeJSON.result]

        if (stat >= goal || combobreak || gameend) {
            result = Math.round(result * 1000) / 1000
            stat = Math.round(stat * 1000) / 1000
            this.game.profilestats.setPB(Number(result));
            const text = this.statText(this.modeJSON.goalStat, stat, this.modeJSON.result, result)
            const suffix = resultSuffix[this.modeJSON.result]
            this.game.endGame(result + suffix, text);
        }

        if (this.modeJSON.goalStat == "time") { // change ultra side
            stat = stats.score;
            goal = undefined
        }
        this.setObjectiveText(stat, goal);
    }

    statText(stat, value, result, resultvalue) {
        if (stat == "time") { // change ultra text
            stat = result;
            value = resultvalue
            result = undefined;
        }

        if (result == "maxCombo") { // change combo text
            stat = "maxCombo";
            value = this.game.stats.maxCombo;
            result = "time";
            resultvalue = this.game.stats.time;
            resultvalue = Math.round(resultvalue * 1000) / 1000
        }

        const front = {
            "clearlines": `Cleared ${value} lines`,
            "score": `Scored ${value} points`,
            "attack": `Sent ${value} damage`,
            "cleargarbage": `Dug ${value} lines`,
            "ended": `Survived ${value} lines`,
            "maxCombo": `Reached a ${value} combo`,
            "level": `Reached level ${value}`,
        }[stat] ?? "";

        const back = {
            "time": ` in ${resultvalue} seconds`,
        }[result] ?? "";

        return front + back;
    }


    setObjectiveText(stat, required) {
        let modetext = (stat == undefined ? '' : stat) + (required == undefined ? '' : `/${required}`)
        this.elementobjectives.textContent = modetext;
    }

    loadModes() {
        let currentGamemode = this.game.settings.game.gamemode;
        if (typeof currentGamemode == 'number') { // incase old version in use
            this.game.settings.game.gamemode = 'sprint'
            currentGamemode = 'sprint'
        }
        this.setGamemode(currentGamemode);
        this.divObjectiveText.textContent = this.modeJSON.objectiveText;
    }

    diggerAddGarbage(removed) {
        if (this.game.stats.getRemainingGarbage() > 10 && this.game.settings.game.gamemode == "digger")
            this.game.mechanics.addGarbage(removed);
    }

    set4WCols(start) {
        if (this.game.settings.game.gamemode == 'combo') this.game.board.setComboBoard(start);

    }

    startSurvival() {
        const time = (60 * 1000) / this.game.settings.game.survivalRate;
        if (this.game.settings.game.gamemode == 'survival')
            this.game.survivalTimer = setInterval(() => this.game.mechanics.addGarbage(1), time);
    }

    setGamemode(mode) {
        this.game.settings.game.gamemode = mode;
        const competitive = this.game.settings.game.competitiveMode;
        if (competitive) {
            if (localStorage.getItem('customGame') == null)
                localStorage.setItem('customGame', JSON.stringify(this.game.settings.game));
            this.modeJSON = this.getGamemodeJSON(mode);
            this.game.settings.game = { ...this.game.settings.game, ...this.modeJSON.settings };
            document.getElementById('game').disabled = true;
            document.getElementById('goals').disabled = true;
        } else {
            const custom = JSON.parse(localStorage.getItem('customGame'));
            if (custom != null) {
                this.game.settings.game = custom;
                this.game.settings.game.competitiveMode = false;
                localStorage.removeItem('customGame');
            }
            this.modeJSON = this.getGamemodeJSON(mode);
            document.getElementById('game').disabled = false;
            document.getElementById('goals').disabled = false;
        }
        this.game.menuactions.saveSettings();
    }

    getGamemodeJSON(mode) {
        const modeinfo = gamemodeJSON[mode];
        const allinfo = gamemodeJSON["*"];

        let info = {}
        Object.keys(allinfo).forEach(key => info[key] = modeinfo[key] ?? allinfo[key]);
        info.settings = { ...allinfo.settings, ...modeinfo.settings }

        return info;
    }

    getGamemodeNames() {
        return Object.keys(gamemodeJSON).filter(key => key != "*");
    }

    getSuffix(mode) {
        const modeinfo = gamemodeJSON[mode] ?? {};
        return resultSuffix[modeinfo.result] ?? " (legacy)";
    }
}
