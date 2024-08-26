//@ts-check
import { Game } from "../game.js";

export class BoardEditor {
    clickareasdiv = document.getElementById("clickareas");
    mousedown = false;
    currentMode = "fill";
    fillPiece = 'G';
    fillRow = false;


    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;
    }

    // change event listeners to delegate listener for efficiency
    addListeners() {
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
                const clickarea = document.createElement("div");
                clickarea.classList.add("clickmino");
                clickarea.addEventListener("mousedown", () => {
                    if (this.fillRow) { this.fillWholeRow([j, 19 - i]) }
                    else { this.fillCell([j, 19 - i]); }
                })
                window.addEventListener("mouseup", () => {
                    this.mousedown = false;
                })
                clickarea.addEventListener("mouseenter", () => {
                    clickarea.classList.add('highlighting')
                    if (this.mousedown) {
                        if (this.fillRow) { this.fillWholeRow([j, 19 - i]) }
                        else { this.fillCell([j, 19 - i]); }
                    }
                })
                clickarea.addEventListener("mouseleave", () => {
                    clickarea.classList.remove('highlighting');
                })
                this.clickareasdiv.appendChild(clickarea);
            }
        }
    }

    fillCell([x, y]) {
        if (this.game.settings.game.gamemode != 0) return;
        if (!this.mousedown) this.currentMode = this.board.checkMino([x, y], "S") ? "remove" : "fill";
        this.mousedown = true;
        if (this.board.checkMino([x, y], "A")) return;
        this.board.setValue([x, y], this.currentMode == "fill" ? "S "+this.fillPiece : "");
        this.game.mechanics.setShadow();
    }

    fillWholeRow([x, y]) {
        for (let i = 0; i < 10; i++) {
            this.board.setValue([i, y], x == i ? "" : "S G");
            this.mousedown = true;
        }
    }
}