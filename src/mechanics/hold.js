import { Game } from "../main.js";
import { getPiece } from "./randomisers.js";


export class Hold {
    piece;
    occured = false;
    pieceNames = ["s", "z", "i", "j", "l", "o", "t"];

    setHold() {
        this.piece = Game.falling.piece;
    }

    swapHold() {
        [Game.hold.piece, Game.falling.piece]
            = [Game.falling.piece, Game.hold.piece,];
    }

    getHold() {
        return Game.hold.piece ? Game.hold.piece.name : ""
    }

    setNewHold(val) {
        const validPiece = [val].filter(p => this.pieceNames.includes(p));
        this.piece = getPiece(validPiece);
        this.occured = false;
        Game.renderer.updateHold();
        Game.history.save();
    }

}