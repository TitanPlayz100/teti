import { Game } from "../game.js";

export class BoardEditor {
    clickareasdiv = document.getElementById("clickareas");
    mousedown = false;
    currentMode = "fill";
    fillPiece = 'G';
    fillRow = false;
    override = false;

    elementEditButton = document.getElementById("editButton");

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;
    }

    addListeners() {
        // delegate listeners for efficiency
        document.body.addEventListener("mousedown", (e) => {
            if (e.target.classList.contains('clickmino')) {
                const j = Number(e.target.dataset.x)
                const i = Number(e.target.dataset.y)
                if (this.game.settings.game.gamemode != 0) return;
                if (this.fillRow) { this.fillWholeRow([j, 19 - i]) }
                else { this.fillCell([j, 19 - i]); }
            }
        });

        document.body.addEventListener("mouseenter", (e) => {
            if (e.target.classList.contains('clickmino')) {
                const j = Number(e.target.dataset.x)
                const i = Number(e.target.dataset.y)
                if (this.game.settings.game.gamemode != 0) return;
                    e.target.classList.add('highlighting')
                    if (this.mousedown) {
                        if (this.fillRow) { this.fillWholeRow([j, 19 - i]) }
                        else { this.fillCell([j, 19 - i]); }
                    }
            }
        }, true);

        document.body.addEventListener("mouseleave", (e) => {
            if (e.target.classList.contains('clickmino')) {
                e.target.classList.remove('highlighting')
            }
        }, true);

        document.body.addEventListener("mouseup", () => {
            if (this.mousedown) this.game.history.save();
            this.mousedown = false;
        });

        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
                const clickarea = document.createElement("div");
                clickarea.classList.add("clickmino");
                clickarea.dataset.x = j.toString();
                clickarea.dataset.y = i.toString();
                this.clickareasdiv.appendChild(clickarea);
            }
        }
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

    setEditButton(bool) {
        this.elementEditButton.style.display = bool ? "flex" : "none";
    }
}