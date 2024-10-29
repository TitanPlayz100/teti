import { Game } from "../game.js";

export class BoardEditor {
    mousedown = false;
    currentMode = "fill";
    fillPiece = 'G';
    fillRow = false;
    override = false;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;
    }

    mouseDown([x, y], sprite) {
        if (this.game.settings.game.gamemode != 'custom') return;
        if (this.fillRow) { this.fillWholeRow([x, 19 - y]) }
        else { this.fillCell([x, 19 - y]); }
    }

    mouseEnter([x, y], sprite) {
        if (this.game.settings.game.gamemode != 'custom') return;
        sprite.alpha = 0.5;
        if (this.mousedown) {
            if (this.fillRow) { this.fillWholeRow([x, 19 - y]) }
            else { this.fillCell([x, 19 - y]); }
        }
    }

    mouseLeave(e, sprite) {
        sprite.alpha = 0;
    }

    mouseUp(e) {
        if (this.mousedown) this.game.history.save();
        this.mousedown = false;
    }

    fillCell([x, y]) {
        if (!this.mousedown) this.currentMode = this.board.checkMino([x, y], "S") ? "remove" : "fill";
        this.mousedown = true;
        if (this.board.checkMino([x, y], "A")) return;
        if (!this.override && this.currentMode == "fill" && this.board.checkMino([x, y], "S")) return;
        this.board.setValue([x, y], this.currentMode == "fill" ? "S " + this.fillPiece : "");
        this.game.mechanics.setShadow();
    }

    fillWholeRow([x, y]) {
        for (let i = 0; i < 10; i++) {
            this.board.setValue([i, y], x == i ? "" : "S G");
            this.mousedown = true;
        }
    }

    convertToMap() {
        const board = this.game.board.boardState;
        const next = this.game.bag.nextPieces;
        const hold = this.game.hold.piece == null ? "" : this.game.hold.piece.name;
        const currPiece = this.game.falling.piece.name;

        let boardstring = board.toReversed().flatMap(row => {
            return row.map(col => {
                col = col.replace("Sh", "").replace("NP", "").replace("G", "#");
                if (col.length == 1) col = ""
                if (col[0] == "A") col = "";
                if (col[0] == "S") col = col[2];
                if (col.trim() == "") col = "_";
                return col;
            })
        }).join("")
        return `${boardstring}?${currPiece},${next.flat()}?${hold}`

    }

    convertFromMap(string) {
        let [board, next, hold] = string.split("?");
        board = board.match(/.{1,10}/g).toReversed().map(row => {
            return row.split("").map(col => {
                col = col.replace("#", "G").replace("_", "")
                if (col != "") col = `S ${col}`
                return col
            });
        })
        return { board, next, hold }
    }
}