import { Game } from "../game.js";
import pieces from "../data/pieces.json" with { type: "json" };

export class Renderer {
    boardHeight;
    boardWidth;
    holdHeight;
    holdWidth;
    nextHeight;
    nextWidth;
    holdQueueGrid = [];
    nextQueueGrid = [];
    inDanger;
    texttimeouts = {};

    canvasField = document.getElementById("playingfield");
    canvasNext = document.getElementById("next");
    canvasHold = document.getElementById("hold");
    divBoard = document.getElementById("board");
    divBackboard = document.getElementById("backboard");
    divLinesSent = document.getElementById("linessent");
    elementStats1 = document.getElementById("stats1");
    elementStats2 = document.getElementById("stats2");
    elementStats3 = document.getElementById("stats3");
    elementEditPieces = document.getElementById("editMenuPieces");

    elementSmallStat1 = document.getElementById("smallStat1");
    elementSmallStat2 = document.getElementById("smallStat2");
    ctx;
    ctxN;
    ctxH;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;

        this.ctx = this.canvasField.getContext("2d");
        this.ctxN = this.canvasNext.getContext("2d");
        this.ctxH = this.canvasHold.getContext("2d");
    }

    sizeCanvas() {
        this.renderStyles();
        [this.canvasField, this.canvasNext, this.canvasHold].forEach(c => {
            c.width = Math.round(c.offsetWidth / 10) * 10;
            c.height = Math.round(c.offsetHeight / 40) * 40;
        });
        this.divBoard.style.width = `${this.canvasField.width}px`;
        this.divBoard.style.height = `${this.canvasField.height / 2}px`;
        this.game.boardrender.minoSize = this.canvasField.width / 10;
        this.boardWidth = this.canvasField.offsetWidth;
        this.boardHeight = this.canvasField.offsetHeight;
        this.nextWidth = this.canvasNext.offsetWidth;
        this.nextHeight = this.canvasNext.offsetHeight;
        this.holdWidth = this.canvasHold.offsetWidth;
        this.holdHeight = this.canvasHold.offsetHeight;
    }

    updateNext() {
        this.nextQueueGrid = [...Array(15)].map(() => [...Array(4)].map(() => ""));
        const first5 = this.game.bag.getFirstFive();
        first5.forEach((name, idx) => {
            const piece = this.getPiece(name),
                pn = piece.name;
            let dx = 0,
                dy = 3 * (4 - idx);
            if (pn == "o") [dx, dy] = [dx + 1, dy + 1];
            this.board
                .pieceToCoords(piece.shape1)
                .forEach(([x, y]) => (this.nextQueueGrid[y + dy][x + dx] = "A " + pn));
        });
        this.game.boardrender.renderToCanvas(
            this.ctxN,
            this.nextQueueGrid,
            15,
            [0, 0],
            this.nextWidth,
            this.nextHeight
        );
        if (this.game.settings.game.gamemode == 'lookahead' || !this.game.settings.display.colouredQueues) return;
        this.canvasNext.style.outlineColor = pieces.filter(
            e => e.name == first5[0]
        )[0].colour;
    }

    getPiece(name) {
        if (name == "G") return { colour: "gray" }
        return pieces.filter(p => p.name == name)[0];
    }

    updateHold() {
        this.holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ""));
        this.ctxH.clearRect(0, 0, this.canvasHold.offsetWidth + 10, this.canvasHold.offsetHeight);
        if (this.game.hold.piece == undefined) return;
        const name = this.game.hold.piece.name;
        const isO = name == "o",
            isI = name == "i";
        const [dx, dy] = [isO ? 1 : 0, isO ? 1 : isI ? -1 : 0];
        const coords = this.board.pieceToCoords(this.game.hold.piece.shape1);
        coords.forEach(([x, y]) => (this.holdQueueGrid[y + dy][x + dx] = "A " + name));
        const len = Math.round(this.game.boardrender.minoSize / 2);
        const [shiftX, shiftY] = [isO || isI ? 0 : len, isI ? 0 : len];
        this.game.boardrender.renderToCanvas(
            this.ctxH,
            this.holdQueueGrid,
            2,
            [shiftX, shiftY],
            this.holdWidth,
            this.holdHeight
        );
        if (this.game.settings.game.gamemode == 'lookahead' || !this.game.settings.display.colouredQueues)
            return;
        const colour = this.game.hold.occured ? "gray" : this.game.hold.piece.colour
        this.canvasHold.style.outline = `0.2vh solid ${colour}`;
    }

    clearHold() {
        this.ctxH.clearRect(0, 0, this.canvasHold.offsetWidth + 10, this.canvasHold.offsetHeight);
    }

    renderDanger() {
        const condition =
            this.game.board.getMinos("S").some(c => c[1] > 16) &&
            this.game.settings.game.gamemode != 'combo';
        if (condition && !this.inDanger) this.game.sounds.playSound("damage_alert");
        this.game.boardeffects.toggleDangerBoard(condition)
        this.inDanger = condition;
    }

    renderActionText(damagetype, isBTB, isPC, damage, linecount) {
        if (damagetype != "") this.setText("cleartext", damagetype, 2000);
        if (this.game.stats.combo > 0)
            this.setText("combotext", `Combo ${this.game.stats.combo}`, 2000);
        if (isBTB && this.game.stats.btbCount > 0)
            this.setText("btbtext", `BTB ${this.game.stats.btbCount} `, 2000);
        if (isPC) this.setText("pctext", "Perfect Clear", 2000);
        if (damage > 0) this.setText("linessent", `${this.game.mechanics.spikeCounter}`, 1500);

        if (this.game.mechanics.spikeCounter > 0) this.spikePattern("white", 1);
        if (this.game.mechanics.spikeCounter >= 10) this.spikePattern("red", 1.1);
        if (this.game.mechanics.spikeCounter >= 20) this.spikePattern("lime", 1.2);

        if (isPC) this.game.sounds.playSound("allclear");
        if (this.game.stats.btbCount == 2 && isBTB) this.game.sounds.playSound("btb_1");
        if (linecount >= 4 && this.game.stats.btbCount > 0) {
            this.game.sounds.playSound("clearbtb");
        } else if (linecount >= 4) {
            this.game.sounds.playSound("clearquad");
        } else if (linecount > 0 && this.game.mechanics.isTspin) {
            this.game.sounds.playSound("clearspin");
        } else if (linecount > 0 && this.game.mechanics.isAllspin && this.game.settings.game.allspin) {
            this.game.sounds.playSound("clearspin");
        } else if (linecount > 0) {
            this.game.sounds.playSound("clearline");
        }
        if (this.game.mechanics.spikeCounter >= 15) this.game.sounds.playSound("thunder", false);
        if (this.game.stats.combo > 0)
            this.game.sounds.playSound(
                `combo_${this.game.stats.combo > 16 ? 16 : this.game.stats.combo
                }`
            );
    }

    spikePattern(colour, size) {
        this.divLinesSent.style.color = colour;
        this.divLinesSent.style.textShadow = `0 0 1vh ${colour}`;
        this.divLinesSent.style.fontSize = `${3.5 * size}vh`;
    }


    setText(id, text, duration) {
        const textbox = document.getElementById(id);
        textbox.textContent = text;
        textbox.style.transform = "translateX(-2%)";
        textbox.style.opacity = "1";
        if (this.texttimeouts[id] != 0) this.stopTimeout(id);
        this.texttimeouts[id] = setTimeout(() => {
            textbox.style.opacity = "0";
            textbox.style.transform = "translateX(2%)";
            this.game.mechanics.spikeCounter = 0;
        }, duration);
    }

    stopTimeout(name) {
        clearTimeout(this.texttimeouts[name]);
        this.texttimeouts[name] = 0;
    }

    renderStyles() {
        document.body.style.background = this.game.settings.display.background;
        const height = Number(this.game.settings.display.boardHeight) + 10;
        this.divBoard.style.transform = `scale(${height}%) translate(-50%, -50%)`;
        this.canvasHold.style.outline = `0.2vh solid #dbeaf3`;
        const background = `rgba(0, 0, 0, ${Number(this.game.settings.display.boardOpacity) / 100})`;
        this.divBackboard.style.backgroundColor = background;
        document.body.style.setProperty('--background', background);
    }

    renderSidebar() {
        const stats = ['time', 'apm', 'pps'];
        const fixedVal = [2, 1, 2];
        const statsSecondary = ['attack', 'pieceCount'];

        stats.forEach((stat, index) => {
            const displayStat = (Math.round(this.game.stats[stat] * 1000) / 1000).toFixed(fixedVal[index]);
            this[`elementStats${index + 1}`].textContent = displayStat ?? 0;
        })

        statsSecondary.forEach((stat, index) => {
            this[`elementSmallStat${index + 1}`].textContent = this.game.stats[stat];
        })
    }

    updateAlpha() {
        if (this.game.settings.game.gamemode == 'lookahead') {
            const update = (type, amount) => {
                if (this.game.stats.checkInvis()) {
                    if (this.game.boardrender[type] <= 0) {
                        this.game.boardrender[type] = 1;
                        this.updateNext();
                        this.updateHold();
                    }
                } else {
                    if (this.game.boardrender[type] > 0) {
                        this.game.boardrender[type] += -amount / this.game.tickrate;
                        this.updateNext();
                        this.updateHold();
                    }
                    if (this.game.boardrender[type] <= 0) this.game.boardrender[type] = 0;
                }
            }
            update("boardAlpha", 3)
            update("justPlacedAlpha", 6)
        }

    }

    setEditPieceColours() {
        const elPieces = [...this.elementEditPieces.children];
        elPieces.forEach(elpiece => {
            const pieceid = elpiece.id.split("_")[0];
            elpiece.style.backgroundColor = this.getPiece(pieceid).colour
        })
    }

    bounceBoard(direction) {
        const force = Number(this.game.settings.display.boardBounce);
        switch (direction) {
            case "LEFT":
                this.game.boardeffects.move(-force, 0);
                break;
            case "RIGHT":
                this.game.boardeffects.move(force, 0);
                break;
            case "DOWN":
                this.game.boardeffects.move(0, force);
                break;
        }
    }

    rotateBoard(type) {
        const force = Number(this.game.settings.display.boardBounce) * 0.5;
        switch (type) {
            case "CW":
                this.game.boardeffects.rotate(force);
                break;
            case "CCW":
                this.game.boardeffects.rotate(-force);
                break;
        }
    }

    renderingLoop() {
        this.game.boardrender.renderToCanvas(this.ctx, this.game.board.boardState, 39, [0, 0], this.boardWidth, this.boardHeight);
        this.game.boardeffects.move(0, 0);
        this.game.boardeffects.rotate(0);
        setTimeout(() => requestAnimationFrame(this.renderingLoop.bind(this)), 1);
    }
}
