import { Game } from "../game.js";
import pieces from "../data/pieces.json" with { type: "json" };

const pieceNames = ["s", "z", "i", "j", "l", "o", "t"];

// update this for options to show in menu
export const randomisers = ['7bag', 'total mayhem'];

export function getPiece(name) {
    if (name == "G") return { colour: "gray" }
    return pieces.find(p => p.name == name);
}

// MAKE SURE TO ADD NEW BAGS HERE
/** @returns {Bag} */
export function BagFactory(game) {
    return {
        "7bag": new SevenBag(game),
        "total mayhem": new TotalMayhem(game)
    }[game.settings.game.randomiser];
}

// Can implement custom bags in other classes, 
// make sure to update BagFactory
class Bag {
    /** @param {Game} game */
    constructor(game) {
        this.game = game;
    }

    getQueue() {
        return this.game.falling.piece.name
            + this.game.bag.getFirstN(6).map(p => p.name).join("");
    }

    updateQueue(value) {
        const pieces = value.split("").filter(p => pieceNames.includes(p));
        this.game.bag.setQueue(pieces);
        this.game.renderer.updateNext();
        this.game.mechanics.locking.clearLockDelay();
        this.game.board.MinoToNone("A");
        this.game.mechanics.isTspin = false;
        this.game.mechanics.isAllspin = false;
        this.game.mechanics.isMini = false;
        this.game.mechanics.spawnPiece(this.game.bag.cycleNext());
        this.game.history.save();
    }

    // must be implemented
    freshBag() { throw new Error("Method 'freshBag()' must be implemented."); }

    /**
     * @param {boolean} start
     * @returns {string} 
     */
    cycleNext(start = false) { throw new Error("Method 'cycleNext()' must be implemented."); }

    /**
     * @param {Number} n
     * @returns {{name: string, colour: string}[]}
     */
    getFirstN(n) { throw new Error("Method 'getFirstN()' must be implemented."); }

    /**
     * @param {string[]} value 
     */
    setQueue(value) { throw new Error("Method 'setQueue()' must be implemented."); }

    /**
     * @returns {string}
     */
    getMapQueue() { throw new Error("Method 'getMapQueue()' must be implemented."); }
}




class SevenBag extends Bag {
    /** @type {string[][]} */
    #nextPieces;
    #stride;

    constructor(game) {
        super(game);
        this.#stride = game.settings.game.stride
        this.freshBag();
    }

    freshBag() {
        this.#nextPieces = [[], []];
    }

    cycleNext(start = false) {
        if (this.#nextPieces[1].length == 0) this.#shuffle();
        if (this.#nextPieces[0].length == 0) {
            this.#nextPieces = [this.#nextPieces[1], []];
            this.#shuffle();
        }
        const piece = this.#nextPieces[0].splice(0, 1)[0];

        if (["o", "s", "z"].includes(piece) && this.#stride && start) { // stride mode
            this.freshBag();
            return this.cycleNext(start);
        }

        return getPiece(piece);
    }

    #shuffle() {
        pieces.forEach(piece => this.#nextPieces[1].push(piece.name));
        this.#nextPieces[1] = this.#nextPieces[1]
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
    }

    getFirstN(n) {
        return this.#nextPieces.flat()
            .map(p => getPiece(p))
            .slice(0, n);
    }

    setQueue(value) {
        this.#nextPieces = [value, []];
    }

    getMapQueue() {
        return this.#nextPieces.flat().join(",");
    }
}




class TotalMayhem extends Bag {
    /** @type {String[]} */
    #next;
    #stride;

    constructor(game) {
        super(game);
        this.#stride = game.settings.game.stride;
        this.freshBag();
    }

    freshBag() {
        this.#next = [];
    }

    cycleNext(start = false) {
        this.randomise();
        const piece = this.#next.splice(0, 1)[0];
        if (["o", "s", "z"].includes(piece) && this.#stride && start) { // stride mode
            this.freshBag();
            return this.cycleNext(start);
        }
        return getPiece(piece);
    }

    randomise() {
        while (this.#next.length < 7) {
            const num = Math.floor(Math.random() * pieceNames.length);
            this.#next.push(pieceNames[num]);
        }
    }

    getFirstN(n) {
        return this.#next.slice(0, n).map(p => getPiece(p));
    }

    setQueue(value) {
        this.#next = value;
    }

    getMapQueue() {
        return this.#next.join(",");
    }
}
