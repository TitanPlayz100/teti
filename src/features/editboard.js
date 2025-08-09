import { Game } from "../main.js";

export class BoardEditor {
    mousedown = false;
    currentMode = "fill";
    fillPiece = 'G';
    fillRow = false;
    override = false;

    mouseDown([x, y], sprite) {
        if (Game.settings.game.gamemode != 'custom') return;
        if (this.fillRow) { this.fillWholeRow([x, 19 - y]) }
        else { this.fillCell([x, 19 - y]); }
    }

    mouseEnter([x, y], sprite) {
        if (Game.settings.game.gamemode != 'custom') return;
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
        if (this.mousedown) Game.history.save();
        this.mousedown = false;
    }

    fillCell([x, y]) {
        if (!this.mousedown) this.currentMode = Game.board.checkMino([x, y], "S") ? "remove" : "fill";
        this.mousedown = true;
        if (Game.board.checkMino([x, y], "A")) return;
        if (!this.override && this.currentMode == "fill" && Game.board.checkMino([x, y], "S")) return;
        Game.board.setValue([x, y], this.currentMode == "fill" ? "S " + this.fillPiece : "");
        Game.mechanics.setShadow();
    }

    fillWholeRow([x, y]) {
        for (let i = 0; i < 10; i++) {
            Game.board.setValue([i, y], x == i ? "" : "S G");
            this.mousedown = true;
        }
    }

    convertToMap() {
        const board = Game.board.boardState;
        const next = Game.bag.getMapQueue();
        const hold = Game.hold.piece == null ? "" : Game.hold.piece.name;
        const currPiece = Game.falling.piece.name;

        let boardstring = board.toReversed().flatMap(row => {
            return row.map(col => {
                col = col.replace("Sh", "").replace("NP", "").replace("G", "#");
                if (col.length == 1) col = ""
                if (col[0] == "A") col = "";
                if (col[0] == "S") col = col[2];
                if (col.trim() == "") col = "_";
                return col.trim();
            })
        }).join("")
        return `${boardstring}?${currPiece},${next}?${hold}`

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
        while (board.length < 40) {
            board.push(["", "", "", "", "", "", "", "", "", ""]);
        }
        return { board, next, hold }
    }
}