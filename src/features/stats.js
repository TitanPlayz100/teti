import { levellingTable } from "../data/data.js";
import { Game } from "../main.js";

export class GameStats {
    // game stats
    time = 0;
    clearlines = 0;
    pieceCount = 0;
    score = 0;
    pcs = 0;
    quads = 0;
    tspins = [0, 0, 0, 0];
    allspins = 0;
    tgm_level = 0;
    altitude = 0;
    floor = 1;
    grade = "9";
    climbSpeed = 1;

    // garbage stats
    attack = 0;
    cleargarbage = 0;
    sent = 0;
    recieved = 0;

    // modifier stats
    combo = -1;
    maxCombo = -1;
    btbCount = -1;
    maxBTB = -1;

    // calculated stats
    pps = 0;
    apm = 0;
    vs = 0; // tetrio versus score
    lpm = 0; // lines per minute
    app = 0;
    apl = 0; // attack per line
    appw = 0; // weighted attack per piece 
    ppb = 0;
    dss = 0; // garbage per second
    dsp = 0; // garbage per piece
    chzind = 0; // cheese index
    garbeff = 0; // garbage efficiency
    vsOnApm = 0; // vs / apm

    // x piece efficiency
    tpE = 0;
    ipE = 0;

    // input stats
    inputs = 0;
    holds = 0;
    rotates = 0;
    kps = 0;
    kpp = 0;

    clearCols = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // amount cleared in a col = clearCols[col - 1]
    clearPieces = { // lineclears by piece = clearPieces[piece][line_count - 1]
        i: [0, 0, 0, 0],
        j: [0, 0, 0, 0],
        l: [0, 0, 0, 0],
        o: [0, 0, 0, 0],
        t: [0, 0, 0, 0],
        s: [0, 0, 0, 0],
        z: [0, 0, 0, 0],
    };

    updateStats() {
        this.time += 1 / Game.tickrate;
        Game.grandmaster.sectionTime += 1 / Game.tickrate;

        this.pps = this.pieceCount / this.time;
        this.apm = this.attack * 60 / this.time;
        this.vs = (this.attack + this.cleargarbage) * 100 / this.time;

        this.lpm = this.clearlines * 60 / this.time;
        this.app = this.attack / this.pieceCount || 0;
        this.apl = this.attack / this.clearlines || 0;
        this.ppb = this.score / this.pieceCount || 0;
        this.dss = this.cleargarbage / this.time
        this.dsp = this.cleargarbage / this.pieceCount || 0;
        this.vsOnApm = this.vs / this.apm || 0;
        this.chzind = 25 * (this.dsp * 6 + this.vsOnApm * 2 - this.app * 5 - 1);
        this.garbeff = this.app * this.dsp * 2;
        this.appw = this.app - 5 * Math.tan(1 - this.chzind / 30) || 0;
        this.kps = this.inputs / this.time;
        this.kpp = this.inputs / this.pieceCount || 0;

        this.tpE = this.tspins.reduce((a, b) => a + b, 0) * 700 / this.pieceCount || 0;
        this.ipE = this.quads * 700 / this.pieceCount || 0;
        // use of || 0 to not show NaN
    }

    checkInvis() {
        return this.pieceCount % Game.settings.game.lookAheadPieces == 0 && !Game.falling.moved
    }

    getRemainingGarbage() {
        return Game.settings.game.requiredGarbage - this.cleargarbage
    }

    updateBTB(isBTB, count) {
        this.btbCount = isBTB ?
            this.btbCount + 1 :
            count == 0 ? this.btbCount : -1;
        if (this.btbCount > this.maxBTB) this.maxBTB = this.btbCount;
    }

    updateCombo(count) {
        this.combo = count == 0 ? -1 : this.combo + 1;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    }

    incrementStats(score, count, damage, isPC, isTspin, isAllspin, garb) {
        this.score += score;
        this.clearlines += count;
        this.attack += damage;
        this.quads += count >= 4 ? 1 : 0;
        this.pcs += isPC ? 1 : 0;
        this.cleargarbage += garb;

        if (isTspin) this.tspins[count]++;
        this.allspins += isAllspin ? 1 : 0;
        this.tgm_level += levellingTable[count];
        Game.grandmaster.addGrade(count, this.combo, this.tgm_level)
        if (count > 0) this.clearPieces[Game.falling.piece.name][count - 1]++;
    }

}