// @ts-check

import { cleartypes, scoringTable } from "./data.js";

export class ClearLines {
    constructor(mechanics) {
        this.mechanics = mechanics;
    }

    clearLines() {
        const rows = this.mechanics.board
            .getMinos("S")
            .map(coord => coord[1])
            .reduce((prev, curr) => ((prev[curr] = ++prev[curr] || 1), prev), {});
        const clearRows = Object.keys(rows)
            .filter(key => rows[key] >= 10)
            .map(row => +row)
            .toReversed();
        let removedGarbage = 0;
        for (let row of clearRows) {
            const stopped = this.mechanics.board.getMinos("S");
            if (stopped.filter(c => c[1] == row).some(c => this.mechanics.board.checkMino(c, "G")))
                removedGarbage++;
            stopped
                .filter(c => c[1] == row)
                .forEach(([x, y]) => this.mechanics.board.setCoordEmpty([x, y]));
            this.mechanics.board.moveMinos(
                stopped.filter(c => c[1] > row),
                "DOWN",
                1
            );
        }
        if (this.mechanics.garbRowsLeft > 10 && this.mechanics.game.gameSettings.gamemode == 4)
            this.mechanics.addGarbage(removedGarbage);

        this.mechanics.processLineClear(removedGarbage, clearRows);
    }

    processLineClear(garbageCleared, clearRows) {
        this.mechanics.garbRowsLeft -= garbageCleared;
        const linecount = clearRows.length;
        const isBTB =
            (this.mechanics.isTspin || this.mechanics.isMini || linecount == 4) && linecount > 0;
        const isPC = this.mechanics.board.getMinos("S").length == 0;
        const damagetype =
            (this.mechanics.isTspin ? "Tspin " : "") +
            (this.mechanics.isMini ? "mini " : "") +
            cleartypes[linecount];
        this.mechanics.btbCount = isBTB
            ? this.mechanics.btbCount + 1
            : linecount != 0
            ? -1
            : this.mechanics.btbCount;
        if (linecount == 0) this.mechanics.maxCombo = this.mechanics.combonumber;
        this.mechanics.combonumber = linecount == 0 ? -1 : this.mechanics.combonumber + 1;
        const damage = this.mechanics.calcDamage(
            this.mechanics.combonumber,
            damagetype.toUpperCase().trim(),
            isPC,
            this.mechanics.btbCount,
            isBTB
        );
        this.mechanics.totalScore += this.mechanics.calcScore(
            damagetype,
            isPC,
            isBTB,
            this.mechanics.combonumber
        );
        this.mechanics.totalLines += linecount;
        this.mechanics.totalAttack += damage;
        this.mechanics.spikeCounter += damage;

        this.mechanics.manageGarbageSent(damage);
        this.mechanics.game.rendering.renderActionText(damagetype, isBTB, isPC, damage, linecount);
    }

    manageGarbageSent(damage) {
        const garb = damage * this.mechanics.game.gameSettings.backfireMulti;
        this.mechanics.garbageQueue =
            this.mechanics.garbageQueue == 0
                ? garb
                : this.mechanics.garbageQueue > garb
                ? this.mechanics.garbageQueue - garb
                : 0;
        if (this.mechanics.game.gameSettings.gamemode == 6 && garb > 0)
            playSound(garb > 4 ? "garbage_in_large" : "garbage_in_small");
        if (
            this.mechanics.game.gameSettings.gamemode == 6 &&
            this.mechanics.combonumber == -1 &&
            this.mechanics.garbageQueue > 0
        ) {
            this.mechanics.addGarbage(this.mechanics.garbageQueue, 0);
            this.mechanics.garbageQueue = 0;
            this.mechanics.game.progressDamage.value = 0;
        }
        if (damage > 0 && this.mechanics.game.gameSettings.gamemode == 6)
            this.mechanics.game.progressDamage.value = this.mechanics.garbageQueue;
    }

    calcDamage(combo, type, isPC, btb, isBTB) {
        const btbdamage = () => {
            const x = Math.log1p(btb * 0.8);
            return ~~(Math.floor(x + 1) + (1 + (x % 1)) / 3);
        };
        return (
            this.mechanics.game.attackValues[type][combo > 20 ? 20 : combo < 0 ? 0 : combo] +
            (isPC ? this.mechanics.game.attackValues["ALL CLEAR"] : 0) +
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
