import { Game } from "../main.js";
import kicks from "../data/kicks.json" with { type: "json" };

export class Falling {
    piece = null;
    location = [];
    moved = false;
    rotation = 1;

    spawn(piece) {
        const dx = piece.name == "o" ? 4 : 3;
        const dy = piece.name == "o" ? 21 : piece.name == "i" ? 19 : 20;
        const initialRotations = kicks[Game.settings.game.kicktable].spawn_rotation ?? {}
        this.rotation = initialRotations[piece.name] ?? 1;

        const coords = Game.board.pieceToCoords(piece[`shape${this.rotation}`]);
        Game.board.addMinos("A " + piece.name, coords, [dx, dy]);
        this.location = [dx, dy];
        this.piece = piece;
        Game.sounds.playSound(Game.bag.queue[0]); // play NEXT piece sfx
    }

    getKickData(newRotation) {
        let iPiece = this.piece.name == "i" ? "i_kicks" : "kicks";
        const type = `${this.rotation}${newRotation}`;
        const kicktable = Game.settings.game.kicktable;
        const kickdata = (kicks[kicktable][iPiece] ?? {})[type] ?? [];
        kickdata.unshift([0, 0]);
        return kickdata
    }

    getRotateState(type) {
        const newState = (this.rotation + { CW: 1, CCW: -1, 180: 2 }[type]) % 4;
        return newState == 0 ? 4 : newState;
    }

    getNewCoords(rotation) {
        return Game.board.pieceToCoords(
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