import { Game } from "../game.js";

export class GameStats {
    clearlines; // cleared lines
    pieceCount;
    score;
    sent;
    time; // seconds
    maxCombo;
    btbCount;
    level;
    combo;

    attack;
    cleargarbage;

    pps;
    apm;

    // app, scorepp, inputs, kps, kpp, holds, rotates, pcs, maxBTB, vs

    // lineClearColumns, lineClearPieces, clearTypeCounts, tspins, allspins

    // garbage stats - sent, recieved

    // ds/s, vs/apm, garb efficiecny, cheese i, weighted app

    /**
        VS = [ ( lines sent + garbage cleared ) / pieces ] * PPS * 100
        APP: APM/(PPS*60) 
        DS/Second: (VS/100)-(APM/60) 
        DS/Piece: ((VS/100)-(APM/60))/PPS 
        APP+DS/Piece: (((VS/100)-(APM/60))/PPS) + APM/(PPS*60) 
        Cheese Index: ((DS/Piece * 150) + (((VS/APM)-2)*50) + (0.6-APP)*125) 
        Garbage Effi.: (attack*downstack)/pieces^2 
        Area: apm + pps * 45 + vs * 0.444 + app * 185 + dssecond * 175 + dspiece * 450 + garbageEffi * 315 
        Weighted APP: APP - 5 * tan((cheeseIndex/ -30) + 1) 
     */

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    getDisplayStats() {
        this.time += 0.02;
        if (this.time != 0) {
            this.pps = this.pieceCount / this.time;
            this.apm = this.attack / (this.time / 60);
        } else {
            this.pps = 0;
            this.apm = 0;
        }

        let displaytime = (Math.round(this.time * 10) / 10).toFixed(1);
        return { displaytime, pps: this.pps, apm: this.apm }
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