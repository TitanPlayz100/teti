import { Game } from "../main.js";
import { getPiece } from "./randomisers.js";


export class Hold {
    /**@type {Piece} */
    piece;
    occured = false;
    /**@type {PieceName[]} */
    pieceNames = ["s", "z", "i", "j", "l", "o", "t"];

    setHold() {
        this.piece = Game.falling.piece;
    }

    swapHold() {
        [Game.hold.piece, Game.falling.piece] = [Game.falling.piece, Game.hold.piece];
    }

    getHold() {
        return Game.hold.piece ? Game.hold.piece.name : ""
    }

    /**@param {PieceName} val */
    setNewHold(val) {
        const validPiece = [val].filter(p => this.pieceNames.includes(p))[0];
        this.piece = getPiece(validPiece);
        this.occured = false;
        Game.renderer.updateHold();
        Game.history.save();
    }

}