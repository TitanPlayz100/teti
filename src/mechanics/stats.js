//@ts-check

import { Game } from "../game.js";

export class GameStats {
    attack;
    clearlines; // cleared lines
    pieceCount;
    score;
    sent;
    time; // seconds
    cleargarbage;
    maxCombo;
    btbCount;

    elementObjective = document.getElementById("objective");

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    checkObjectives() {
        const goals = this.game.settings.game,
            time = (Math.round(this.time * 100) / 100).toFixed(2),
            pieces = goals.lookAheadPieces;
            
        this.elementObjective.textContent = {
            0: "",
            1: `${this.clearlines}/${goals.requiredLines}`,
            2: `${this.score}`,
            3: `${this.attack}/${goals.requiredAttack}`,
            4: `${this.getRemainingGarbage()}`,
            5: `${this.sent}`,
            6: `${this.attack}/${goals.requiredAttack}`,
            7: `${this.game.mechanics.combonumber}`,
            8: `${this.clearlines}/${goals.requiredLines}`,
        }[goals.gamemode];

        const obj1 = this.clearlines >= goals.requiredLines,
            obj2 = this.time >= Number(goals.timeLimit),
            obj3 = this.attack >= goals.requiredAttack,
            obj4 = this.cleargarbage >= goals.requiredGarbage,
            obj5 = this.game.ended,
            obj6 = this.game.mechanics.combonumber == -1 && this.clearlines >= 1,
            ts = ` in ${time} seconds`,
            cl = `Cleared ${this.clearlines} lines`,
            total = this.score,
            reqGarb = goals.requiredGarbage;

        switch (goals.gamemode) {
            case 1: if (obj1) { this.game.endGame(`${time}s`, cl + ts); } break;
            case 2: if (obj2) { this.game.endGame(`${total} points`, `Scored ${total} points` + ts); } break;
            case 3: if (obj3) { this.game.endGame(`${time}s`, `Sent ${this.attack} damage` + ts); } break;
            case 4: if (obj4) { this.game.endGame(`${time}s`, `Dug ${reqGarb} lines` + ts); } break;
            case 5: if (obj5) { this.game.endGame(`${time}s`, `Survived ${this.sent} lines` + ts); } break;
            case 6: if (obj3) { this.game.endGame(`${time}s`, `Sent ${this.attack} damage` + ts); } break;
            case 7: if (obj6) { this.game.endGame(`${time}s`, `Got a ${this.maxCombo} combo` + ts); } break;
            case 8: if (obj1) { this.game.endGame(`${time}s`, cl + ` using ${pieces} lookahead`); } break;
        }
    }

    getDisplayStats() {
        this.time += 0.02;
        let displaytime = (Math.round(this.time * 10) / 10).toFixed(1);
        let pps = 0.0;
        if (this.time != 0) {
            pps = Math.round((this.pieceCount * 100) / this.time) / 100;
        }
        let apm = 0.0;
        if (this.time != 0) {
            apm = Math.round((this.attack * 10) / (this.time / 60)) / 10;
        }
        return { displaytime, pps, apm }
    }

    checkInvis() {
        return this.pieceCount % this.game.settings.game.lookAheadPieces == 0 && !this.game.falling.moved
    }

    getRemainingGarbage() {
        return this.game.settings.game.requiredGarbage - this.cleargarbage
    }

    updateBTB(isBTB, count) {
        if (isBTB) {
            this.btbCount++;
        } else if (count != 0) {
            this.btbCount = -1;
        }
    }

}