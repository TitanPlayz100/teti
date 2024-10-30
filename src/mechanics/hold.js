import { Game } from "../game.js";
import { getPiece } from "./randomisers.js";


export class Hold {
    piece;
    occured = false;
    pieceNames = ["s", "z", "i", "j", "l", "o", "t"];

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.curr = this.game.falling;
    }

    setHold() {
        this.piece = this.curr.piece;
    }

    swapHold() {
        [this.game.hold.piece, this.curr.piece]
            = [this.curr.piece, this.game.hold.piece,];
    }

    getHold() {
        return this.game.hold.piece ? this.game.hold.piece.name : ""
    }

    setNewHold(val) {
        const validPiece = [val].filter(p => this.pieceNames.includes(p));
        this.piece = getPiece(validPiece);
        this.occured = false;
        this.game.renderer.updateHold();
        this.game.history.save();
    }

}