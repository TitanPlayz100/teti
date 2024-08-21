// @ts-check

import { cleartypes, scoringTable } from "../data/data.js";
import { Mechanics } from "./mechanics.js";
import attackValues from "../data/attacktable.json" with { type: "json" };

export class ClearLines {
    progressDamage = document.getElementById("garbageQueue");


    /**
     * @param {Mechanics} mechanics
     */
    constructor(mechanics, sounds) {
        this.mech = mechanics;
        this.sounds = sounds;
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
            this.mech.board.moveMinos(
                stopped.filter(c => c[1] > row),
                "DOWN",
                1
            );
        }
        if (this.mech.garbRowsLeft > 10 && this.mech.game.settings.game.gamemode == 4)
            this.mech.addGarbage(removedGarbage);

        this.processLineClear(removedGarbage, clearRows);
    }

    processLineClear(garbageCleared, clearRows) {
        this.mech.garbRowsLeft -= garbageCleared;
        const linecount = clearRows.length;
        const isBTB =
            (this.mech.isTspin || this.mech.isMini || linecount == 4) && linecount > 0;
        const isPC = this.mech.board.getMinos("S").length == 0;
        const damagetype =
            (this.mech.isTspin ? "Tspin " : "") +
            (this.mech.isMini ? "mini " : "") +
            cleartypes[linecount];
        this.mech.btbCount = isBTB
            ? this.mech.btbCount + 1
            : linecount != 0
                ? -1
                : this.mech.btbCount;
        if (linecount == 0) this.mech.maxCombo = this.mech.combonumber;
        this.mech.combonumber = linecount == 0 ? -1 : this.mech.combonumber + 1;
        const damage = this.calcDamage(
            this.mech.combonumber,
            damagetype.toUpperCase().trim(),
            isPC,
            this.mech.btbCount,
            isBTB
        );
        this.mech.totalScore += this.calcScore(
            damagetype,
            isPC,
            isBTB,
            this.mech.combonumber
        );
        this.mech.totalLines += linecount;
        this.mech.totalAttack += damage;
        this.mech.spikeCounter += damage;

        this.manageGarbageSent(damage);
        this.mech.game.rendering.renderActionText(damagetype, isBTB, isPC, damage, linecount);
    }

    manageGarbageSent(damage) {
        const garb = damage * this.mech.game.settings.game.backfireMulti;
        this.mech.garbageQueue =
            this.mech.garbageQueue == 0
                ? garb
                : this.mech.garbageQueue > garb
                    ? this.mech.garbageQueue - garb
                    : 0;
        if (this.mech.game.settings.game.gamemode == 6 && garb > 0)
            this.sounds.playSound(garb > 4 ? "garbage_in_large" : "garbage_in_small");
        if (
            this.mech.game.settings.game.gamemode == 6 &&
            this.mech.combonumber == -1 &&
            this.mech.garbageQueue > 0
        ) {
            this.mech.addGarbage(this.mech.garbageQueue, 0);
            this.mech.garbageQueue = 0;
            this.progressDamage.value = 0;
        }
        if (damage > 0 && this.mech.game.settings.game.gamemode == 6)
            this.progressDamage.value = this.mech.garbageQueue;
    }

    calcDamage(combo, type, isPC, btb, isBTB) {
        const btbdamage = () => {
            const x = Math.log1p(btb * 0.8);
            return ~~(Math.floor(x + 1) + (1 + (x % 1)) / 3);
        };
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
