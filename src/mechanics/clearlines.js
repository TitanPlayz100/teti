import { cleartypes, scoringTable, levellingTable } from "../data/data.js";
import attackValues from "../data/attacktable.json" with { type: "json" };
import { Game } from "../game.js";

export class ClearLines {
    progressDamage = document.getElementById("garbageQueue");


    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game
        this.sounds = game.sounds;
        this.progressDamage.value = 0;

    }

    clearLines(clearCoords) {
        const clearRows = this.game.mechanics.board.getFullRows();
        let removedGarbage = 0;

        for (let row of clearRows) {
            const stopped = this.game.mechanics.board.getMinos("S");
            if (stopped.filter(c => c[1] == row).some(([x, y]) => this.game.mechanics.board.checkMino([x, y], "G")))
                removedGarbage++;
            stopped.filter(c => c[1] == row)
                .forEach(([x, y]) => this.game.mechanics.board.setCoordEmpty([x, y]));
            this.game.mechanics.board.moveMinos(stopped.filter(c => c[1] > row), "DOWN", 1);
        }

        this.game.modes.diggerAddGarbage(removedGarbage);
        if (clearRows.length > 0) this.game.renderer.bounceBoard("DOWN");

        clearCoords.forEach(([x, y]) => {
            if (clearRows.includes(y)) this.game.stats.clearCols[x]++;
        })

        this.game.particles.spawnParticles(0, Math.min(...clearRows), "clear")
        this.processLineClear(removedGarbage, clearRows);
    }

    clearRow(rowNumber) {
        const stopped = this.game.mechanics.board.getMinos("S");
        stopped.filter(c => c[1] == rowNumber)
            .forEach(([x, y]) => this.game.mechanics.board.setCoordEmpty([x, y]));
        const minos = stopped.filter(c => c[1] > rowNumber);
        this.game.mechanics.board.moveMinos(minos,"DOWN",1);
    }

    processLineClear(garbageCleared, clearRows) { // todo refactor
        this.game.stats.cleargarbage += garbageCleared;
        const linecount = clearRows.length;
        const isBTB =
            (this.game.mechanics.isTspin
                || this.game.mechanics.isMini
                || linecount >= 4
                || (this.game.mechanics.isAllspin && this.game.settings.game.allspin))
            && linecount > 0;
        const isPC = this.game.mechanics.board.getMinos("S").length == 0;
        let damagetype =
            ((this.game.mechanics.isTspin || (this.game.mechanics.isAllspin && this.game.settings.game.allspin)) ? "Tspin " : "") +
            (this.game.mechanics.isMini ? "mini " : "") +
            cleartypes[Math.min(linecount, 5)]; // limit to 5 line clear
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
        this.game.mechanics.spikeCounter += damage;
        this.game.stats.quads += linecount >= 4 ? 1 : 0;
        this.game.stats.pcs += isPC ? 1 : 0;
        if (this.game.mechanics.isTspin) this.game.stats.tspins[linecount]++;
        this.game.stats.allspins += this.game.mechanics.isAllspin ? 1 : 0;
        this.game.stats.level += levellingTable[linecount];
        if (linecount > 0)
            this.game.stats.clearPieces[this.game.falling.piece.name][linecount-1]++;

        this.manageGarbageSent(damage);
        if (this.game.mechanics.isAllspin) damagetype = damagetype.replace("Tspin ", this.game.falling.piece.name + " spin ");
        this.game.renderer.renderActionText(damagetype, isBTB, isPC, damage, linecount);
        if (isPC) this.game.particles.spawnParticles(0, 0, "pc");
        if (damage > 10 || this.game.stats.combo > 10) this.game.particles.spawnParticles(0, 0, "spike");
    }

    manageGarbageSent(damage) {
        this.game.stats.sent += damage;
        const garb = damage * this.game.settings.game.backfireMulti;
        this.game.mechanics.garbageQueue = // todo ugly dumb ternary
            this.game.mechanics.garbageQueue == 0
                ? garb
                : this.game.mechanics.garbageQueue > garb
                    ? this.game.mechanics.garbageQueue - garb
                    : 0;

        if (this.game.settings.game.gamemode != 'backfire') return;
        if (garb > 0) this.sounds.playSound(garb > 4 ? "garbage_in_large" : "garbage_in_small");
        if (this.game.stats.combo == -1 && this.game.mechanics.garbageQueue > 0) {
            this.game.mechanics.addGarbage(this.game.mechanics.garbageQueue, 0);
            this.game.stats.recieved += this.game.mechanics.garbageQueue;
            this.game.mechanics.garbageQueue = 0;
            this.progressDamage.value = 0;
        }
        if (damage > 0) this.progressDamage.value = this.game.mechanics.garbageQueue;
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
