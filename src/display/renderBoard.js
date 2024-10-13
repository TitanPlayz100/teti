import { Game } from "../game.js";

export class BoardRenderer {
    boardAlpha = 1;
    queueAlpha = 1;
    justPlacedCoords = [];
    justPlacedAlpha = 1;
    minoSize;
    texture;
    flashTimes = [];

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
        if (cntx != this.game.renderer.ctx) return;
        if (this.divlock.value != 0 && cell.includes("A") && this.game.settings.game.gamemode != "lookahead") {
            return 1 - (this.divlock.value / 250);
        }
        if (this.game.settings.game.gamemode == "lookahead") {
            for (let [posX, posY] of this.justPlacedCoords) {
                if (posX == x && posY == y && cntx == this.game.renderer.ctx) {
                    return Math.max(this.justPlacedAlpha, this.boardAlpha).toFixed(2);
                }
            }
        }

        return this.boardAlpha.toFixed(2);
    }

    setMinoFlash(cntx, x, y, posX, posY) {
        if (cntx != this.game.renderer.ctx) return;
        for (let { c, t } of this.flashTimes) {
            if (c[0] == x && c[1] == y) {
                const dx = (t / 15) * this.minoSize;
                posX = posX + this.minoSize;
                posY = posY + this.minoSize;
                this.drawTriangle(posX, posY, posX - dx, posY - dx, cntx);
            }
        }
    }

    drawTriangle(posX, posY, x, y, cntx) {
        cntx.globalAlpha = 0.4;
        cntx.fillStyle = "#ffffff"
        cntx.beginPath();
        cntx.moveTo(posX, posY);
        cntx.lineTo(posX, y);
        cntx.lineTo(x, posY);
        cntx.lineTo(posX, posY);
        cntx.fill();
    }

    toHex(num) {
        const hex = Math.round((+num * 255) / 100).toString(16);
        return hex.length > 1 ? hex : 0 + hex;
    }

    loadImage(src) {
        this.texture = new Image(372, 30);
        this.texture.src = src;
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

    getShadowOpacity() {
        const opacity = this.game.settings.display.shadowOpacity / 100;
        if (this.game.settings.game.gamemode == "lookahead") return (opacity * this.boardAlpha).toFixed(2);
        return opacity;
    }

    removeCoords([x, y]) {
        this.justPlacedCoords = this.justPlacedCoords.filter(c => !(c[0] == x && c[1] == y));
        this.flashTimes = this.flashTimes.filter(({ c, t }) => !(c[0] == x && c[1] == y));
    }

    renderBorder(ctx, x, y) {
        const type = this.game.settings.display.gridType;
        if (type == "round") {
            ctx.beginPath();
            ctx.roundRect(x, y, this.minoSize - 1, this.minoSize - 1, this.minoSize / 4);
            ctx.stroke();
        } else if (type == "square") {
            ctx.beginPath();
            ctx.strokeRect(x, y, this.minoSize - 1, this.minoSize - 1, this.minoSize / 4);
            ctx.stroke();
        } else if (type == "dot") {
            ctx.beginPath();
            ctx.arc(x + this.minoSize, y + this.minoSize, 1, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    /**
     * @param {CanvasRenderingContext2D} cntx 
     */
    renderToCanvas(cntx, grid, yPosChange, [dx, dy] = [0, 0], width, height) {
        cntx.clearRect(0, 0, width, height);
        grid.forEach((row, y) => {
            row.forEach((col, x) => {
                const [posX, posY] = [x * this.minoSize, (yPosChange - y) * this.minoSize];
                const cell = col.split(" ");
                cntx.lineWidth = 1;

                if (cell.includes("A") || cell.includes("S")) { // active piece or stopped piece
                    cntx.globalAlpha = this.getOpacity(cell, cntx, x, y) ?? this.queueAlpha.toFixed(2);
                    const p = this.getTexture(this.getPiece(cntx, cell[1]));
                    cntx.drawImage(this.texture, p.x, p.y, p.width, p.height, posX + dx, posY + dy, this.minoSize, this.minoSize);
                    this.setMinoFlash(cntx, x, y, posX + dx, posY + dy);
                }
                else if (cell.includes("NP") && this.game.renderer.inDanger) { // next piece overlay
                    cntx.globalAlpha = 0.32;
                    const p = this.getTexture("topout");
                    cntx.drawImage(this.texture, p.x, p.y, p.width, p.height, posX + dx, posY + dy, this.minoSize, this.minoSize);
                }
                else if (cell.includes("Sh")) { // shadow piece
                    cntx.globalAlpha = this.getShadowOpacity();
                    const piece = this.game.settings.display.colouredShadow ? this.game.falling.piece.name : "shadow";
                    const p = this.getTexture(piece);
                    cntx.drawImage(this.texture, p.x, p.y, p.width, p.height, posX + dx, posY + dy, this.minoSize, this.minoSize);
                }
                else if (y < 20 && this.game.settings.display.showGrid && cntx == this.game.renderer.ctx) { // grid
                    cntx.globalAlpha = 1
                    cntx.strokeStyle = "#ffffff" + this.toHex(this.game.settings.display.gridopacity);
                    this.renderBorder(cntx, posX, posY);
                }
            });
        });

        // flash
        this.flashTimes = this.flashTimes
            .filter(({ c, t }) => t > 0)
            .map(({ c, t }) => { return { c, t: t - 1 }; });
    }
}