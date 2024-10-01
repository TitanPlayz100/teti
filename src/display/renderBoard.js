import pieces from "../data/pieces.json" with { type: "json" };
import { Game } from "../game.js";

export class BoardRenderer {
    boardAlpha;
    justPlacedCoords = [];
    justPlacedAlpha = 1;
    minoSize;

    divlock = document.getElementById("lockTimer");

    /**
     * 
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

    // board rendering
    getOpacity(cell, cntx, x, y) {
        if (this.divlock.value != 0 && cell.includes("A") && this.game.settings.game.gamemode != "lookahead") {
            return 1 - (this.divlock.value / 250);
        }
        this.justPlacedCoords.forEach(([placedX, placedY]) => {
            if (placedX == x && placedY == y && cntx == this.game.renderer.ctx) {
                return this.justPlacedAlpha.toFixed(2);
            }
        })
        return 1;
    }

    getPieceColour(name, cntx) {
        if (cntx == this.game.renderer.ctxH && this.game.hold.occured) name = "G";
        let colours = { "G": "gray" };
        pieces.forEach(piece => colours[piece.name] = piece.colour)
        return colours[name];
    }

    getShadowColour() {
        let colour = "#ffffff";
        if (this.game.settings.display.colouredShadow) colour = this.game.falling.piece.colour;
        const hex = this.toHex(this.game.settings.display.shadowOpacity);
        return colour + hex;
    }

    toHex(num) {
        const hex = Math.round((+num * 255) / 100).toString(16);
        return hex.length > 1 ? hex : 0 + hex;
    }

    renderToCanvas(cntx, grid, yPosChange, [dx, dy] = [0, 0], width, height) {
        cntx.clearRect(0, 0, width, height);
        grid.forEach((row, y) => {
            row.forEach((col, x) => {
                cntx.globalAlpha = this.boardAlpha.toFixed(2);
                const [posX, posY] = [x * this.minoSize, (yPosChange - y) * this.minoSize];
                const cell = col.split(" ");
                cntx.lineWidth = 1;

                if (cell.includes("A") || cell.includes("S")) { // active piece or stopped piece
                    cntx.globalAlpha = this.getOpacity(cell, cntx, x, y);
                    cntx.fillStyle = this.getPieceColour(cell[1], cntx);
                    cntx.fillRect(posX + dx, posY + dy, this.minoSize, this.minoSize);
                }
                else if (cell.includes("NP") && this.game.renderer.inDanger) { // next piece overlay
                    cntx.fillStyle = "#ff000020";
                    cntx.fillRect(posX, posY, this.minoSize, this.minoSize);
                }
                else if (cell.includes("Sh")) { // shadow piece
                    cntx.fillStyle = this.getShadowColour();
                    cntx.fillRect(posX, posY, this.minoSize, this.minoSize);
                }
                else if (y < 20 && this.game.settings.display.showGrid && cntx == this.game.renderer.ctx) { // grid
                    cntx.strokeStyle = "#ffffff" + this.toHex(this.game.settings.display.gridopacity);
                    cntx.beginPath();
                    cntx.roundRect(posX, posY, this.minoSize - 1, this.minoSize - 1, this.minoSize / 4);
                    cntx.stroke();
                }
            });
        });
    }
}