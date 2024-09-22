import { KickData, KickData180 } from "../data/kicks.js";
import { Game } from "../game.js";

export class Falling {
    piece;
    location;
    moved; // if the current piece has moved
    rotation;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    spawn(piece) {
        const dx = piece.name == "o" ? 4 : 3;
        const dy = piece.name == "o" ? 21 : piece.name == "i" ? 19 : 20;
        const coords = this.game.mechanics.board.pieceToCoords(piece.shape1);
        this.game.mechanics.board.addMinos("A " + piece.name, coords, [dx, dy]);
        this.location = [dx, dy];
        this.piece = piece;
        this.rotation = 1;

    }
    
    getKickData(rotationType, shapeNo) {
        const isI = this.piece.name == "i" ? 1 : 0;
        const direction = rotationType == "CCW" ? (shapeNo > 3 ? 0 : shapeNo) : shapeNo - 1;
        return {
            180: KickData180[isI][direction],
            CW: KickData[isI][direction],
            CCW: KickData[isI][direction].map(row => row.map(x => x * -1)),
        }[rotationType];
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

    newName() {
        return "A " + this.piece.name;
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