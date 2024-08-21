//@ts-check

import { Game } from "../game.js";

export class Hold {
    piece;
    occured = false;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    setHold() {
        this.piece = this.game.currentPiece;
    }

    swapHold() {
        [this.game.hold.piece, this.game.currentPiece]
            = [this.game.currentPiece, this.game.hold.piece,];
    }

    getHold() {
        return this.game.hold.piece ? this.game.hold.piece.name : ""
    }

}