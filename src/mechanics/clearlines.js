import { cleartypes, scoringTable, levellingTable } from "../data/data.js";
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
    }

    clearLines(clearCoords) {
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
        this.game.modes.diggerAddGarbage(removedGarbage);
        if (clearRows.length > 0) this.game.rendering.bounceBoard("DOWN");

        clearCoords.forEach(([x, y]) => {
            if (clearRows.includes(y)) this.game.stats.clearCols[x]++;
        })
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
        this.game.stats.cleargarbage += garbageCleared;
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
        if (!isBTB && linecount > 0) this.game.zenith.AwardLines(Math.max(0, this.game.stats.btbCount))    
        this.game.stats.updateBTB(isBTB, linecount);
        this.game.stats.combo = linecount == 0 ? -1 : this.game.stats.combo + 1;
        if (this.game.stats.combo > this.game.stats.maxCombo) this.game.stats.maxCombo = this.game.stats.combo;
        const damage = this.calcDamage(
            this.game.stats.combo,
            damagetype.toUpperCase().trim(),
            isPC,
            this.game.stats.btbCount,
            isBTB
        );
        this.game.stats.score += this.calcScore(
            damagetype,
            isPC,
            isBTB,
            this.game.stats.combo
        );
        this.game.stats.clearlines += linecount;
        this.game.stats.attack += damage;
        this.mech.spikeCounter += damage;
        this.game.stats.quads += linecount >= 4 ? 1 : 0;
        this.game.stats.pcs += isPC ? 1 : 0;
        if (this.mech.isTspin) this.game.stats.tspins[linecount]++;
        this.game.stats.allspins += this.mech.isAllspin ? 1 : 0;
        this.game.stats.level += levellingTable[linecount];
        if (linecount > 0)
            this.game.stats.clearPieces[this.game.falling.piece.name][linecount-1]++;

        this.manageGarbageSent(damage);
        this.game.zenith.AwardLines(damage);
        if (this.mech.isAllspin) damagetype = damagetype.replace("Tspin ", this.game.falling.piece.name + " spin ");
        this.game.rendering.renderActionText(damagetype, isBTB, isPC, damage, linecount);
    }

    manageGarbageSent(damage) {
        this.game.stats.sent += damage;
        const garb = damage * this.game.settings.game.backfireMulti;
        this.mech.garbageQueue =
            this.mech.garbageQueue == 0
                ? garb
                : this.mech.garbageQueue > garb
                    ? this.mech.garbageQueue - garb
                    : 0;

        if (this.game.settings.game.gamemode != 'backfire') return;
        if (garb > 0) this.sounds.playSound(garb > 4 ? "garbage_in_large" : "garbage_in_small");
        if (this.game.stats.combo == -1 && this.mech.garbageQueue > 0) {
            this.mech.addGarbage(this.mech.garbageQueue, 0);
            this.game.stats.recieved += this.mech.garbageQueue;
            this.mech.garbageQueue = 0;
            this.progressDamage.value = 0;
        }
        if (damage > 0) this.progressDamage.value = this.mech.garbageQueue;
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
