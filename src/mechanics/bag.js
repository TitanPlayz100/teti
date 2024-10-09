import { Game } from "../game.js";
import pieces from "../data/pieces.json" with { type: "json" };

export class Bag {
    /**
     * @type {Array<Array<string>>}
     */
    nextPieces = [[], []];


    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

    randomiser(start = false) {
        if (this.nextPieces[1].length == 0) this.shuffleRemainingPieces();
        if (this.nextPieces[0].length == 0) {
            this.nextPieces = [this.nextPieces[1], []];
            this.shuffleRemainingPieces();
        }
        const piece = this.nextPieces[0].splice(0, 1)[0];

        if (["o", "s", "z"].includes(piece) && this.game.settings.game.stride) { // stride mode
            this.nextPieces = [[], []];
            return this.randomiser();
        }

        return pieces.filter(element => {
            return element.name == piece;
        })[0];
    }

    shuffleRemainingPieces() {
        pieces.forEach(piece => this.nextPieces[1].push(piece.name));
        this.nextPieces[1] = this.nextPieces[1]
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
    }

    getFirstFive() {
        return this.nextPieces[0]
            .concat(this.nextPieces[1])
            .slice(0, this.game.settings.game.nextPieces);
    }

    getQueue() {
        return this.game.falling.piece.name
            + this.nextPieces[0]
                .concat(this.nextPieces[1])
                .splice(0, 6)
                .join("");
    }

    setQueue(value, names) {
        this.nextPieces[0] = value
            .split("")
            .filter(p => names.includes(p));
        this.shuffleRemainingPieces();
        this.game.renderer.updateNext();

        this.game.mechanics.locking.clearLockDelay();
        this.game.board.MinoToNone("A");
        this.game.mechanics.isTspin = false;
        this.game.mechanics.isAllspin = false;
        this.game.mechanics.isMini = false;
        this.game.mechanics.spawnPiece(this.game.bag.randomiser());
        this.game.history.save();
    }

    nextPiece() {
        return pieces.filter(
            p => p.name == this.nextPieces[0].concat(this.nextPieces[1])[0]
        )[0];
    }
}