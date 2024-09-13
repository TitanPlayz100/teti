import { cleartypes, scoringTable } from "../data/data.js";
import { Mechanics } from "./mechanics.js";
import attackValues from "../data/attacktable.json" with { type: "json" };
import { Game } from "../game.js";

export class ClearLines {
    progressDamage = document.getElementById("garbageQueue");


    /**
     * @param {Game} game
     */
    constructor(mechanics, game) {
        this.game = game
        this.mech = mechanics;
        this.sounds = game.sounds;
        this.stats = game.stats;
    }

    clearLines() {
        const clearRows = this.mech.board.getFullRows();
        let removedGarbage = 0;
        for (let row of clearRows) {
            const stopped = this.mech.board.getMinos("S");
            if (stopped.filter(c => c[1] == row).some(([x, y]) => this.mech.board.checkMino([x, y], "G")))
                removedGarbage++;
            stopped
                .filter(c => c[1] == row)
                .forEach(([x, y]) => this.mech.board.setCoordEmpty([x, y]));
            this.mech.board.moveMinos(stopped.filter(c => c[1] > row), "DOWN", 1);
        }
        if (this.stats.getRemainingGarbage() > 10 && this.game.settings.game.gamemode == 4)
            this.mech.addGarbage(removedGarbage);

        if (clearRows.length > 0) this.game.rendering.bounceBoard("DOWN");
        this.processLineClear(removedGarbage, clearRows);
    }

    clearRow(rowNumber) {
        const stopped = this.mech.board.getMinos("S");
        stopped
            .filter(c => c[1] == rowNumber)
            .forEach(([x, y]) => this.mech.board.setCoordEmpty([x, y]));
        this.mech.board.moveMinos(
            stopped.filter(c => c[1] > rowNumber),
            "DOWN",
            1
        );
    }

    processLineClear(garbageCleared, clearRows) {
        this.stats.cleargarbage += garbageCleared;
        const linecount = clearRows.length;
        const isBTB =
            (this.mech.isTspin
                || this.mech.isMini
                || linecount >= 4
                || (this.mech.isAllspin && this.game.settings.game.allspin))
            && linecount > 0;
        const isPC = this.mech.board.getMinos("S").length == 0;
        let damagetype =
            ((this.mech.isTspin || (this.mech.isAllspin && this.game.settings.game.allspin)) ? "Tspin " : "") +
            (this.mech.isMini ? "mini " : "") +
            cleartypes[Math.min(linecount, 5)]; // limit to 5 line clear
        this.game.stats.updateBTB(isBTB, linecount);
        if (linecount == 0) this.stats.maxCombo = this.mech.combonumber;
        this.mech.combonumber = linecount == 0 ? -1 : this.mech.combonumber + 1;
        const damage = this.calcDamage(
            this.mech.combonumber,
            damagetype.toUpperCase().trim(),
            isPC,
            this.game.stats.btbCount,
            isBTB
        );
        this.game.stats.score += this.calcScore(
            damagetype,
            isPC,
            isBTB,
            this.mech.combonumber
        );
        this.stats.clearlines += linecount;
        this.stats.attack += damage;
        this.mech.spikeCounter += damage;

        this.manageGarbageSent(damage);
        if (this.mech.isAllspin) damagetype = damagetype.replace("Tspin ", this.game.falling.piece.name + " spin ");
        this.game.rendering.renderActionText(damagetype, isBTB, isPC, damage, linecount);
    }

    manageGarbageSent(damage) {
        const garb = damage * this.game.settings.game.backfireMulti;
        this.mech.garbageQueue =
            this.mech.garbageQueue == 0
                ? garb
                : this.mech.garbageQueue > garb
                    ? this.mech.garbageQueue - garb
                    : 0;
        if (this.game.settings.game.gamemode == 6 && garb > 0)
            this.sounds.playSound(garb > 4 ? "garbage_in_large" : "garbage_in_small");
        if (
            this.game.settings.game.gamemode == 6 &&
            this.mech.combonumber == -1 &&
            this.mech.garbageQueue > 0
        ) {
            this.mech.addGarbage(this.mech.garbageQueue, 0);
            this.mech.garbageQueue = 0;
            this.progressDamage.value = 0;
        }
        if (damage > 0 && this.game.settings.game.gamemode == 6)
            this.progressDamage.value = this.mech.garbageQueue;
    }

    calcDamage(combo, type, isPC, btb, isBTB) {
        const btbdamage = () => {
            const x = Math.log1p(btb * 0.8);
            return ~~(Math.floor(x + 1) + (1 + (x % 1)) / 3);
        };
        if (!attackValues.hasOwnProperty(type)) return 0;
        return (
            attackValues[type][combo > 20 ? 20 : combo < 0 ? 0 : combo] +
            (isPC ? attackValues["ALL CLEAR"] : 0) +
            (isBTB && btb > 0 ? btbdamage() : 0)
        );
    }

    calcScore(type, ispc, isbtb, combo) {
        return (
            scoringTable[type.toUpperCase().trim()] +
            (ispc ? scoringTable["ALL CLEAR"] : 0) +
            (combo > 0 ? 50 * combo : 0) * (isbtb ? 1.5 : 1)
        );
    }
}
