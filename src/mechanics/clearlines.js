import { cleartypes, scoringTable } from "../data/data.js";
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
            if (stopped.filter(c => c[1] == row).some(([x, y]) => this.game.mechanics.board.checkMino([x, y], "G"))) // count garbage
                removedGarbage++;
            stopped.filter(c => c[1] == row).forEach(([x, y]) => { // clear rows
                this.game.mechanics.board.setCoordEmpty([x, y]);
                this.game.boardrender.removeCoords([x, y]);
            });
            this.game.mechanics.board.moveMinos(stopped.filter(c => c[1] > row), "DOWN", 1);
        }

        this.game.modes.diggerAddGarbage(removedGarbage); // add garbage
        clearCoords.forEach(([x, y]) => { // stats
            if (clearRows.includes(y)) this.game.stats.clearCols[x]++;
        })

        if (clearRows.length > 0) this.game.renderer.bounceBoard("DOWN");
        this.game.particles.spawnParticles(0, Math.min(...clearRows), "clear")
        this.processLineClear(removedGarbage, clearRows);
    }

    clearRow(rowNumber) {
        const stopped = this.game.mechanics.board.getMinos("S");
        stopped.filter(c => c[1] == rowNumber)
            .forEach(([x, y]) => this.game.mechanics.board.setCoordEmpty([x, y]));
        const minos = stopped.filter(c => c[1] > rowNumber);
        this.game.mechanics.board.moveMinos(minos, "DOWN", 1);
    }

    processLineClear(garbageCleared, clearRows) {
        const mech = this.game.mechanics, stats = this.game.stats;
        const linecount = clearRows.length;
        const isBTB = this.checkBTB(linecount);
        const isPC = mech.board.getMinos("S").length == 0;
        let damagetype = this.getDamageType(linecount);

        // update stats
        this.game.stats.updateBTB(isBTB, linecount);
        this.game.stats.updateCombo(linecount);
        const damage = this.calcDamage(stats.combo, damagetype, isPC, stats.btbCount, isBTB);
        const score = this.calcScore(damagetype, isPC, isBTB, stats.combo);
        this.game.stats.incrementStats(score, linecount, damage, isPC, mech.isTspin, mech.isAllspin, garbageCleared);

        mech.spikeCounter += damage;
        this.manageGarbageSent(damage);

        // render action text
        if (mech.isAllspin) damagetype = damagetype.replace("Tspin ", this.game.falling.piece.name + " spin ");
        this.game.renderer.renderActionText(damagetype, isBTB, isPC, damage, linecount);

        // particles
        if (isPC) this.game.particles.spawnParticles(0, 0, "pc");
        if (stats.btbCount > 7 && isBTB) this.game.particles.spawnParticles(0, 20, "BTB");
        if (damage > 10 || stats.combo > 10) this.game.particles.spawnParticles(0, 0, "spike");
    }

    manageGarbageSent(damage) {
        this.game.stats.sent += damage;
        const garb = damage * this.game.settings.game.backfireMulti;
        const sent = Math.abs(this.game.mechanics.garbageQueue - garb);
        this.game.mechanics.garbageQueue = sent;

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

    checkBTB(linecount) {
        if (linecount == 0) return false;
        if (this.game.mechanics.isAllspin && this.game.settings.game.allspin) return true;
        return this.game.mechanics.isTspin || this.game.mechanics.isMini || linecount >= 4;
    }

    getDamageType(linecount) {
        const isSpin = this.game.mechanics.isTspin || (this.game.mechanics.isAllspin && this.game.settings.game.allspin);
        const isMini = this.game.mechanics.isMini;
        const type = cleartypes[Math.min(linecount, 5)] // limit to 5 line clear
        return (isSpin ? "Tspin " : "") + (isMini ? "mini " : "") + type;
    }

    calcDamage(combo, type, isPC, btb, isBTB) {
        type = type.toUpperCase().trim();
        const btbdamage = () => {
            const x = Math.log1p(btb * 0.8);
            return ~~(Math.floor(x + 1) + (1 + (x % 1)) / 3);
        };
        if (!attackValues.hasOwnProperty(type)) return 0; // if type not real
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
