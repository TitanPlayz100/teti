import { Game } from "../main.js";
import gamemodeJSON from "../data/gamemodes.json" with { type: "json" };
import { gameoverResultText, gameoverText, resultSuffix, statDecimals } from "../data/data.js";
import { reverseLookup } from "../display/renderer.js";

export class Modes {
    modeJSON;
    customSettings;

    checkFinished() {
        const goals = Game.settings.game;
        const stats = Game.stats;

        // hardcoded objectives
        let combobreak = Game.stats.combo == -1 && stats.clearlines >= 1 && this.modeJSON.target == 'combobreak';
        let gameend = Game.ended && this.modeJSON.target == 'gameEnd';

        let stat = stats[this.modeJSON.goalStat]
        let goal = goals[this.modeJSON.target]
        let result = stats[this.modeJSON.result]

        if (stat >= goal || combobreak || gameend) {
            if (Game.settings.game.gamemode != "race") result = Math.round(result * 1000) / 1000
            stat = Math.round(stat * 1000) / 1000
            Game.profilestats.setPB(result);
            const text = this.statText(this.modeJSON.goalStat, stat, this.modeJSON.result, result)
            const suffix = resultSuffix[this.modeJSON.result]
            Game.endGame(result + suffix, text);
        }

        if (Game.settings.game.gamemode == 'ultra') { // changes ultra sidebar
            stat = stats.score;
            goal = undefined
        }
        this.setObjectiveText(this.modeJSON.goalstat, stat, goal);
    }

    statText(stat, value, result, resultvalue) {
        const front = gameoverText[stat].replace("_", value);
        const back = gameoverResultText[result].replace("_", resultvalue);
        return front + back;
    }

    setObjectiveText(stat, statValue, resultValue) {
        if (statValue != undefined) statValue = statValue.toFixed(reverseLookup(statDecimals)[stat])
        let modetext =
            (statValue == undefined ? '' : statValue) +
            (resultValue == undefined ? '' : `/${resultValue}`)
        Game.pixi.texts.objectiveText.sprite.text = modetext;
    }

    loadModes() {
        let currentGamemode = Game.settings.game.gamemode;
        if (typeof currentGamemode == 'number') { // backwards compatibility
            Game.settings.game.gamemode = 'sprint'
            currentGamemode = 'sprint'
        }
        this.setGamemode(currentGamemode);

        Game.pixi.texts.objectiveNameText.sprite.text = this.modeJSON.objectiveText.toUpperCase();
        Game.pixi.toggleEditButton(Game.settings.game.gamemode == 'custom');
    }

    setGamemode(mode) {
        Game.settings.game.gamemode = mode;
        const competitive = Game.settings.game.competitiveMode;
        const custom = JSON.parse(localStorage.getItem('customGame'));

        if (competitive) {
            if (custom == null) {
                localStorage.setItem('customGame', JSON.stringify(Game.settings.game));
                Game.menuactions.saveSettings();
            }
            this.modeJSON = this.getGamemodeJSON(mode);
            Game.settings.game = { ...Game.settings.game, ...this.modeJSON.settings };
        } else {
            if (custom != null) {
                Game.settings.game = custom;
                Game.settings.game.competitiveMode = false;
                localStorage.removeItem('customGame');
                Game.menuactions.saveSettings();
            }
            this.modeJSON = this.getGamemodeJSON(mode);
        }
        this.toggleDialogState(competitive, mode);

        if (mode == 'classic' && competitive) {
            this.saveHandling();
            Game.settings.handling = { ...Game.settings.handling, ...this.modeJSON.handling };
        } else {
            this.loadHandling();
        }
    }

    saveHandling() {
        if (localStorage.getItem('handling') != null) return;
        localStorage.setItem('handling', JSON.stringify(Game.settings.handling));
    }

    loadHandling() {
        if (localStorage.getItem('handling') == null) return;
        Game.settings.handling = JSON.parse(localStorage.getItem('handling'));
        localStorage.removeItem('handling');
    }

    toggleDialogState(enabled, mode) {
        document.getElementById('game').disabled = enabled;
        document.getElementById('goals').disabled = enabled;
        document.getElementById('handling').disabled = (enabled && mode == 'classic');
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

    // GAMEMODE SPECIFIC FUNCTIONS
    diggerAddGarbage(removed) {
        if (Game.stats.getRemainingGarbage() > 10 && Game.settings.game.gamemode == "digger") {
            for (let i = 0; i < removed; i++) Game.mechanics.addGarbage(1);
        }
    }

    set4WCols(start) {
        if (Game.settings.game.gamemode == 'combo') Game.board.setComboBoard(start);

    }

    startSurvival() {
        const time = (60 * 1000) / Game.settings.game.survivalRate;
        if (Game.settings.game.gamemode == 'survival')
            Game.survivalTimer = setInterval(() => Game.mechanics.addGarbage(1), time);
    }

    diggerGarbageSet(start) {
        const rows =
            Game.settings.game.requiredGarbage < 10
                ? Game.settings.game.requiredGarbage
                : 10;
        if (Game.stats.getRemainingGarbage() > 0 && start && Game.settings.game.gamemode == 'digger') {
            for (let i = 0; i < rows; i++) Game.mechanics.addGarbage(1);
        }
    }

    backfireGarbage(damage) {
        const garb = damage * Game.settings.game.backfireMulti;
        if (Game.garbage.garbageQueueTotal() > 0) {
            Game.garbage.removeGarbage(garb);
        } else {
            Game.garbage.removeGarbage(garb);
            Game.garbage.addGarbageQueue(garb);
        }

    }
}