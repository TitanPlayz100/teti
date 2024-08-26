// @ts-check

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
                if (filter(col)) coords.push([x, y]);
            })
        );
        return coords.map(([x, y]) => [x + dx, y + dy]);
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
        this.boardState.forEach((row, y) =>
            row.forEach((col, x) => {
                if (x < 3 || x > 6) this.addMinos("S G", [[x, y]], [0, 0]);
            })
        );
        if (start) {
            this.addMinos(
                "S G",
                [
                    [3, 0],
                    [3, 1],
                    [4, 1],
                ],
                [0, 0]
            );
            this.game.mechanics.setShadow();
        }
    }
}
