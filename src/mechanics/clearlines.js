import { cleartypes, scoringTable } from "../data/data.js";
import attackValues from "../data/attacktable.json" with { type: "json" };
import { Game } from "../main.js";

export class ClearLines {
    clearLines(clearCoords) {
        const clearRows = Game.board.getFullRows();
        let removedGarbage = 0;

        for (let row of clearRows) {
            const stopped = Game.board.getMinos("S");
            if (stopped.filter(c => c[1] == row).some(([x, y]) => Game.board.checkMino([x, y], "G"))) // count garbage
                removedGarbage++;
            stopped.filter(c => c[1] == row).forEach(([x, y]) => { // clear rows
                Game.board.setCoordEmpty([x, y]);
                Game.pixi.endFlash([x, y]);
            });
            Game.board.moveMinos(stopped.filter(c => c[1] > row), "DOWN", 1);
        }

        Game.modes.diggerAddGarbage(removedGarbage); // add garbage
        clearCoords.forEach(([x, y]) => { // stats
            if (clearRows.includes(y)) Game.stats.clearCols[x]++;
        })

        if (clearRows.length > 0) Game.renderer.bounceBoard("DOWN");
        Game.particles.spawnParticles(0, Math.min(...clearRows), "clear")
        this.processLineClear(removedGarbage, clearRows);
        return clearRows.length;
    }

    clearRow(rowNumber) {
        const stopped = Game.board.getMinos("S");
        stopped.filter(c => c[1] == rowNumber)
            .forEach(([x, y]) => Game.board.setCoordEmpty([x, y]));
        const minos = stopped.filter(c => c[1] > rowNumber);
        Game.board.moveMinos(minos, "DOWN", 1);
    }

    processLineClear(garbageCleared, clearRows) {
        const mech = Game.mechanics, stats = Game.stats;
        const linecount = clearRows.length;
        const isBTB = this.checkBTB(linecount);
        const isPC = Game.board.getMinos("S").length == 0;
        let damagetype = this.getDamageType(linecount);

        // update stats
        if (!isBTB && linecount > 0) Game.zenith.AwardLines(Math.max(0, Game.stats.btbCount))
        Game.stats.updateBTB(isBTB, linecount);
        Game.stats.updateCombo(linecount);
        const damage = this.calcDamage(stats.combo, damagetype, isPC, stats.btbCount, isBTB);
        const score = this.calcScore(damagetype, isPC, isBTB, stats.combo);
        Game.stats.incrementStats(score, linecount, damage, isPC, mech.isTspin, mech.isAllspin, garbageCleared);

        mech.spikeCounter += damage;
        Game.stats.sent += damage;

        // garbage
        Game.garbage.cancelGarbage(damage)
        if (Game.stats.combo == -1 && Game.garbage.garbageQueueTotal() > 0) {
            Game.garbage.sendGarbageQueue();
        }

        // zenith
        Game.zenith.AwardLines(damage);
        if (linecount == 1) Game.zenith.AwardLines(1);
        
        // render action text
        if (mech.isAllspin) damagetype = damagetype.replace("Tspin ", Game.falling.piece.name + " spin ");
        Game.renderer.renderActionText(damagetype, isBTB, isPC, damage, linecount);

        // particles
        if (isPC) Game.particles.spawnParticles(0, 0, "pc");
        if (stats.btbCount > 7 && isBTB) Game.particles.spawnParticles(0, 20, "BTB");
        if (damage > 10 || stats.combo > 10) Game.particles.spawnParticles(0, 0, "spike");
    }

    checkBTB(linecount) {
        if (linecount == 0) return false;
        if (Game.mechanics.isAllspin && Game.settings.game.allspin) return true;
        return Game.mechanics.isTspin || Game.mechanics.isMini || linecount >= 4;
    }

    getDamageType(linecount) {
        const isSpin = Game.mechanics.isTspin || (Game.mechanics.isAllspin && Game.settings.game.allspin);
        const isMini = Game.mechanics.isMini;
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
