import { Game } from "../game.js";

export class GameStats {
    // game stats
    time = 0;
    clearlines = 0;
    pieceCount = 0;
    score = 0;
    pcs = 0;
    tspins = 0;
    allspins = 0;
    level = 0;

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
    vs = 0;
    app = 0;
    appw = 0;
    ppb = 0;
    dss = 0;
    dsp = 0;
    chzind = 0;
    garbeff = 0;
    vsOnApm = 0;

    // input stats
    inputs = 0;
    kps = 0;
    kpp = 0;
    holds = 0;
    rotates = 0;
    
    clearCols = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // amount cleared in a col = clearCols[col - 1]
    clearPieces = { // lineclears by piece = clearPieces[piece][line_count - 1]
        i:[0, 0, 0, 0],
        j:[0, 0, 0, 0],
        l:[0, 0, 0, 0],
        o:[0, 0, 0, 0],
        t:[0, 0, 0, 0], 
        s:[0, 0, 0, 0],
        z:[0, 0, 0, 0],
    };

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    updateStats() {
        this.time += 0.02;

        this.pps = this.pieceCount / this.time;
        this.apm = this.attack / (this.time / 60);
        this.vs = ((this.attack + this.cleargarbage) / (this.pieceCount)) * this.pps * 100 || 0;

        this.app = this.attack / this.pieceCount || 0;
        this.appw = this.app - 5 * Math.tan((this.cheeseIndex / -30) + 1) || 0;
        this.ppb = this.score / this.pieceCount || 0;
        this.dss = (this.vs / 100) - (this.apm / 60);
        this.dsp = ((this.vs / 100) - (this.apm / 60)) / this.pps;
        this.chzind = ((this.dsp * 150) + ((this.vs / this.apm) - 2) * 50 + (0.6 - this.app) * 125);
        this.garbeff = ((this.app * this.dss) / this.pps) * 2;
        this.vsOnApm = this.vs / this.apm || 0;
        this.kps = this.inputs / this.time;
        this.kpp = this.inputs / this.pieceCount || 0;
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
            if (this.btbCount > this.maxBTB) this.maxBTB = this.btbCount;
            this.btbCount = -1;
        }
    }

}