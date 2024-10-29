import { Game } from "../game.js";

export class Board {
    /**
     * @type {string[][]}
     */
    boardState = [];

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }
    // modify board
    checkMino([x, y], val) {
        return this.boardState[y][x].split(" ").includes(val);
    }

    MinoToNone(val) {
        this.getMinos(val).forEach(([x, y]) => this.rmValue([x, y], val));
    }

    EradicateMinoCells(val) {
        this.getCoords(this.boardState, c => c.includes(val), [0, 0]).forEach(([x, y]) => this.rmValue([x, y], val));
    }

    addMinos(val, c, [dx, dy]) {
        c.forEach(([x, y]) => this.setValue([x + dx, y + dy], val));
    }

    addValFront([x, y], val) {
        this.boardState[y][x] = `${val} ${this.boardState[y][x]}`;
    }

    addValue([x, y], val) {
        this.boardState[y][x] = (this.boardState[y][x] + " " + val).trim();
    }

    setValue([x, y], val) {
        this.boardState[y][x] = val;
    }

    rmValue([x, y], val) {
        this.boardState[y][x] = this.boardState[y][x].replace(val, "").trim();
    }

    getMinos(name) {
        return this.getCoords(this.boardState, c => c.split(" ").includes(name), [0, 0]);
    }

    pieceToCoords(arr, [dx, dy] = [0, 0]) {
        return this.getCoords(arr.toReversed(), c => c == 1, [dx, dy]);
    }

    setCoordEmpty([x, y]) {
        this.boardState[y][x] = "";
    }

    resetBoard() {
        this.boardState = [...Array(40)].map(() => [...Array(10)].map(() => ""));
    }

    getFullRows() {
        const rows = this.getMinos("S")
            .map(coord => coord[1])
            .reduce((prev, curr) => ((prev[curr] = ++prev[curr] || 1), prev), {});
        return Object.keys(rows)
            .filter(key => rows[key] >= 10)
            .map(row => +row)
            .toReversed();
    }

    getCoords(array, filter, [dx, dy]) {
        const coords = [];
        array.forEach((row, y) =>
            row.forEach((col, x) => {
                if (filter(col)) coords.push([x + dx, y + dy]);
            })
        );
        return coords;
    }

    moveMinos(coords, dir, size, value = "") {
        const getChange = ([x, y], a) => {
            return { RIGHT: [x + a, y], LEFT: [x - a, y], DOWN: [x, y - a], UP: [x, y + a] };
        };
        const newcoords = coords.map(c => getChange(c, size)[dir]);

        if (newcoords.some(([x, y]) => y > 39)) {
            this.game.endGame("Topout");
            return;
        }

        const valTable = coords.map(([x, y]) => (value ? value : this.boardState[y][x]));
        coords.forEach((c, idx) => this.rmValue(c, valTable[idx]));

        newcoords.forEach((c, idx) =>
            value ? this.addValue(c, valTable[idx]) : this.setValue(c, valTable[idx])
        );
        this.game.mechanics.spawnOverlay();
    }

    setComboBoard(start) {
        // 4w sides

        const board = JSON.parse(JSON.stringify(this.boardState));          
        board.forEach((row, y) => {
            row.forEach((col, x) => {
                if ((x > 2 && x < 7) || y > 30) return;
                this.setValue([x, y], 'S G')
            })
        })

        if (!start) return;
        // garbage pattern
        const validCoords = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 1], [1, 1], [2, 1], [3, 1]]];
        const garbAmount = Math.random() > 0.5 ? 3 : 6;
        const garbCoords = [];
        for (let i = 0; i < garbAmount; i++) {
            const y = Math.random() > 0.5 ? 0 : 1;
            if (validCoords[y].length == 1) { i--; continue; }
            const coord = validCoords[y].splice(Math.floor(Math.random() * validCoords[y].length), 1);
            garbCoords.push(coord[0]);
        }

        this.addMinos("S G", garbCoords.map(([x, y]) => [x + 3, y]), [0, 0]);
        this.game.mechanics.setShadow();

    }
}
