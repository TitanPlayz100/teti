// @ts-check
import { Game } from "./game.js";

export class Utils {
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    stopTimeout(name) {
        clearTimeout(this.game.timeouts[name]); this.game.timeouts[name] = 0;
    }

    stopInterval(name) {
        clearInterval(this.game.timeouts[name]); this.game.timeouts[name] = 0;
    }

    toExpValue(x) {
        return Math.round(Math.pow(2, 0.1 * x) - 1)
    }

    toLogValue(y) {
        return Math.round(Math.log2(y + 1) * 10)
    }

    newGame(k, d) {
        if (k == this.game.controlSettings.resetKey) {
            this.game.menus.closeModal(d);
            this.game.main.startGame();
        }
    }

    getPiece(name) {
        return this.game.pieces.filter(p => p.name == name)[0]
    }

    toHex(num) {
        const hex = Math.round((+num * 255 / 100)).toString(16);
        return hex.length > 1 ? hex : 0 + hex;
    }
}