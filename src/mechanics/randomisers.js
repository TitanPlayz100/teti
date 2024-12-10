import { Game } from "../main.js";
import pieces from "../data/pieces.json" with { type: "json" };

const pieceNames = ["z", "l", "o", "s", "i", "j", "t"]; // THIS ORDER IS VERY IMPORTANT

const maxInt = 2 ** 31 - 1;
export const randomisers = ["7-bag", "total mayhem", "classic", "pairs", "14-bag", "7+1-bag", "7+2-bag", "7+x-bag", "tgm"];

export function getPiece(name) {
    if (name == "G") return { colour: "gray" }
    return pieces.find(p => p.name == name);
}

export class Bag {
    lastGenerated = null;
    bagid = 0;
    bagExtra = [];
    queue = [];
    history = ["s", "z", "s", "z"]
    type;
    genseed;

    constructor(seed = null) {
        this.type = Game.settings.game.randomiser;
        this.stride = seed == null ? Game.settings.game.stride : false;
        this.genseed = seed ?? Math.floor((maxInt - 1) * Math.random() + 1);
        this.rng = new RNG(this.genseed);
        this.PopulateBag();
    }

    getQueue() {
        return Game.falling.piece.name
            + Game.bag.getFirstN(6).map(p => p.name).join("");
    }

    updateQueue(value) {
        const pieces = value.split("").filter(p => pieceNames.includes(p));
        Game.bag.setQueue(pieces);
        Game.renderer.updateNext();
        Game.mechanics.locking.clearLockDelay();
        Game.board.MinoToNone("A");
        Game.mechanics.isTspin = false;
        Game.mechanics.isAllspin = false;
        Game.mechanics.isMini = false;
        Game.mechanics.spawnPiece(Game.bag.cycleNext());
        Game.history.save();
    }


    cycleNext(start = false) {
        let piece = this.PullFromBag();
        if (this.stride && start) { // custom stride logic
            if (["o", "s", "z"].includes(piece)) {
                Game.bag = new Bag(this.game);
                return Game.bag.cycleNext(true);
            }
        }
        return getPiece(piece);
    }

    getFirstN(n) {
        return this.queue.slice(0, n).map(p => getPiece(p));
    }

    setQueue(value) {
        this.queue = value;
    }

    getMapQueue() {
        return this.queue.join(",")
    }

    PopulateBag() {
        let bag = [];
        if (this.type == "total mayhem") bag = this.mayhem();
        if (this.type == "classic") bag = this.classic();
        if (this.type == "pairs") bag = this.pairs();
        if (this.type == "14-bag") bag = this.fourteen();
        if (this.type == "7+1-bag") bag = this.sevenPlusN(1);
        if (this.type == "7+2-bag") bag = this.sevenPlusN(2);
        if (this.type == "7+x-bag") bag = this.sevenX();
        if (this.type == "7-bag" || this.type == "7bag") bag = this.seven();
        if (this.type == "tgm") bag = this.tgmHis(4);
        this.queue.push(...bag);
        this.bagid++
    }

    seven() {
        let bag = [...pieceNames];
        this.rng.shuffleArray(bag)
        return bag
    }

    fourteen() {
        let bag = [...pieceNames, ...pieceNames];
        this.rng.shuffleArray(bag)
        return bag
    }

    pairs() {
        const piecePairs = [...pieceNames];
        this.rng.shuffleArray(piecePairs);
        const p1 = piecePairs[0], p2 = piecePairs[1];
        let bag = [p1, p1, p1, p2, p2, p2];
        this.rng.shuffleArray(bag);
        return bag
    }

    classic() {
        let bag = [];
        for (let i = 0; i < 7; i++) {
            let ind = Math.floor(this.rng.nextFloat() * (pieceNames.length + 1));
            if (ind === this.lastGenerated || ind >= pieceNames.length) {
                ind = Math.floor(this.rng.nextFloat() * pieceNames.length);
            }
            this.lastGenerated = ind;
            bag.push(pieceNames[ind]);
        }
        return bag
    }

    mayhem() {
        let bag = [];
        for (let i = 0; i < 7; i++) {
            const ind = Math.floor(this.rng.nextFloat() * pieceNames.length);
            bag.push(pieceNames[ind]);
        }
        return bag
    }

    sevenX() {
        const extra = [3, 2, 1, 1][this.bagid] ?? 0; // # extra pieces depending on bag count
        if (this.bagExtra.length < extra) {
            this.bagExtra = [...pieceNames];
            this.rng.shuffleArray(this.bagExtra);
        }
        let bag = [...pieceNames, ...this.bagExtra.splice(0, extra)];
        this.rng.shuffleArray(bag);
        return bag
    }

    sevenPlusN(n) {
        let bag = [...pieceNames];
        for (let i = 0; i < n; i++) {
            const ind = Math.floor(this.rng.nextFloat() * pieceNames.length);
            const randPiece = pieceNames[ind];
            bag.push(randPiece);
        }
        this.rng.shuffleArray(bag);
        return bag
    }

    tgmHis(reroll) {
        let bag = [];
        let rerollCount = reroll

        while (bag.length != 7) {
            const ind = Math.floor(this.rng.nextFloat() * pieceNames.length);
            rerollCount--

            if (!this.history.includes(pieceNames[ind]) || rerollCount == 0) {
                this.history.shift()
                this.history.push(pieceNames[ind])
                bag.push(pieceNames[ind]);
                rerollCount = reroll
            }

        }
        return bag
    }

    PullFromBag() {
        while (this.queue.length < 14) {
            this.PopulateBag();
        }
        const piece = this.queue.shift();
        return piece;
    }
}


class RNG {
    constructor(seed) {
        this.seed = parseInt(seed) % maxInt;
        if (this.seed <= 0) {
            this.seed += maxInt - 1;
            this.seed = this.seed || 1;
        }
    }

    next() {
        this.seed = 16807 * this.seed % maxInt;
        return this.seed;
    }

    nextFloat() {
        return (this.next() - 1) / (maxInt - 1)
    }

    shuffleArray(arr) {
        let len = arr.length;
        if (0 == len) return arr;

        while (--len > 0) {
            const ind = Math.floor(this.nextFloat() * (len + 1));
            [arr[len], arr[ind]] = [arr[ind], arr[len]];
        }

        return arr;
    }

    getCurrentSeed() {
        return this.seed
    }
}
