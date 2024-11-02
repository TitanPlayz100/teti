import { Game } from "../game.js";
import kicks from "../data/kicks.json" with { type: "json" };

export class Falling {
    piece = null;
    location = [];
    moved = false;
    rotation = 1;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    spawn(piece) {
        const dx = piece.name == "o" ? 4 : 3;
        const dy = piece.name == "o" ? 21 : piece.name == "i" ? 19 : 20;
        const initialRotations = kicks[this.game.settings.game.kicktable].spawn_rotation ?? {}
        this.rotation = initialRotations[piece.name] ?? 1;
        const coords = this.game.mechanics.board.pieceToCoords(piece[`shape${this.rotation}`]);
        this.game.mechanics.board.addMinos("A " + piece.name, coords, [dx, dy]);
        this.location = [dx, dy];
        this.piece = piece;
        this.rotation = 1;
        this.game.sounds.playSound(piece.name)
    }

    getKickData(newRotation) {
        let iPiece = this.piece.name == "i" ? "i_kicks" : "kicks";
        const type = `${this.rotation}${newRotation}`;
        const kicktable = this.game.settings.game.kicktable;

        /**@type {number[][]} */
        const kickdata = (kicks[kicktable][iPiece] ?? {})[type] ?? [];
        kickdata.unshift([0, 0]);
        return kickdata
    }

    getRotateState(type) {
        const newState = (this.rotation + { CW: 1, CCW: -1, 180: 2 }[type]) % 4;
        return newState == 0 ? 4 : newState;
    }

    getNewCoords(rotation) {
        return this.game.board.pieceToCoords(
            this.piece[`shape${rotation}`],
            this.location
        );
    }

    updateLocation([dx, dy]) {
        this.location = [
            this.location[0] + dx,
            this.location[1] + dy,
        ];
        if (dx != 0 || dy != 0) {
            this.moved = true;
        }
    }


}