import pieces from "../data/pieces.json" with { type: "json" };
import { Game } from "../game.js";

export class BoardRenderer {
    boardAlpha = 1;
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

    toHex(num) {
        const hex = Math.round((+num * 255) / 100).toString(16);
        return hex.length > 1 ? hex : 0 + hex;
    }

    texture;
    loadImage() {
        this.texture = new Image(372, 30);
        this.texture.src = '../assets/skins/tetrio.png';
        this.texture.onload = () => {
            this.game.renderer.updateNext();
        }
    }

    getPiece(cntx, cell) {
        return this.game.hold.occured && cntx == this.game.renderer.ctxH ? "hold" : cell;
    }

    getTexture(name) {
        const pieces = ["z", "l", "o", "s", "i", "j", "t", "shadow", "hold", "g", "darkg", "topout"]
        const x = pieces.indexOf(name.toLowerCase()) * 31;
        const y = 0;
        const width = 30;
        const height = 30;
        return { x, y, width, height };
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
                    const p = this.getTexture(this.getPiece(cntx, cell[1]));
                    cntx.drawImage(this.texture, p.x, p.y, p.width, p.height, posX + dx, posY + dy, this.minoSize, this.minoSize);
                }
                else if (cell.includes("NP") && this.game.renderer.inDanger) { // next piece overlay
                    cntx.globalAlpha = 0.32;
                    const p = this.getTexture("topout");
                    cntx.drawImage(this.texture, p.x, p.y, p.width, p.height, posX + dx, posY + dy, this.minoSize, this.minoSize);
                }
                else if (cell.includes("Sh")) { // shadow piece
                    cntx.globalAlpha = this.game.settings.display.shadowOpacity / 100
                    const piece = this.game.settings.display.colouredShadow ? this.game.falling.piece.name : "shadow";
                    const p = this.getTexture(piece);
                    cntx.drawImage(this.texture, p.x, p.y, p.width, p.height, posX + dx, posY + dy, this.minoSize, this.minoSize);
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