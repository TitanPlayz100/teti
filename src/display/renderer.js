import { Game } from "../game.js";
import pieces from "../data/pieces.json" with { type: "json" };
import { defaultSkins, statDecimals, statsSecondary as statsSecondaries } from "../data/data.js";

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
    resetAnimLength = 30;
    resetAnimCurrent = 30;

    sidebarStats;
    sidebarFixed;
    sidebarSecondary;
    /** @type {CanvasRenderingContext2D} */
    ctx;
    ctxN;
    ctxH;

    canvasField = document.getElementById("playingfield");
    canvasNext = document.getElementById("next");
    canvasHold = document.getElementById("hold");
    divBoard = document.getElementById("board");
    divBackboard = document.getElementById("backboard");
    divLinesSent = document.getElementById("linessent");
    elementEditPieces = document.getElementById("editMenuPieces");

    elementStats1 = document.getElementById("stats1");
    elementStats2 = document.getElementById("stats2");
    elementStats3 = document.getElementById("stats3");
    elementStatname1 = document.getElementById("statName1");
    elementStatname2 = document.getElementById("statName2");
    elementStatname3 = document.getElementById("statName3");
    elementSmallStat1 = document.getElementById("smallStat1");
    elementSmallStat2 = document.getElementById("smallStat2");
    elementSmallStat3 = document.getElementById("smallStat3");

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

    renderingLoop() {
        this.game.boardrender.renderToCanvas(this.ctx, this.game.board.boardState, 39, [0, 0], this.boardWidth, this.boardHeight);
        this.game.boardeffects.move(0, 0);
        this.game.boardeffects.rotate(0);
        this.game.particles.update();
        this.dangerParticles();
        this.resetAnimation();
        setTimeout(() => requestAnimationFrame(this.renderingLoop.bind(this)), 1);
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

        const next5 = this.game.bag.getFirstFive();
        next5.forEach((name, idx) => {
            const piece = this.getPiece(name);
            let [dx, dy] = [0, 3 * (4 - idx)];
            if (piece.name == "o") [dx, dy] = [dx + 1, dy + 1]; // shift o piece
            const coords = this.board.pieceToCoords(piece.shape1);
            coords.forEach(([x, y]) => (this.nextQueueGrid[y + dy][x + dx] = "A " + piece.name));
        });

        this.game.boardrender.renderToCanvas(this.ctxN, this.nextQueueGrid, 15, [0, 0], this.nextWidth, this.nextHeight);
        if (this.game.settings.game.gamemode == 'lookahead' || !this.game.settings.display.colouredQueues) return;
        this.canvasNext.style.outlineColor = this.game.bag.nextPiece().colour;
    }

    getPiece(name) {
        if (name == "G") return { colour: "gray" }
        return pieces.filter(p => p.name == name)[0];
    }

    updateHold() {
        this.holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ""));
        this.clearHold();
        if (this.game.hold.piece == undefined) return;

        const name = this.game.hold.piece.name;
        const isO = name == "o",
            isI = name == "i";
        const [dx, dy] = [isO ? 1 : 0, isO ? 1 : isI ? -1 : 0];
        const coords = this.board.pieceToCoords(this.game.hold.piece.shape1);

        coords.forEach(([x, y]) => (this.holdQueueGrid[y + dy][x + dx] = "A " + name));
        const len = Math.round(this.game.boardrender.minoSize / 2);
        const [shiftX, shiftY] = [isO || isI ? 0 : len, isI ? 0 : len];

        this.game.boardrender.renderToCanvas(this.ctxH, this.holdQueueGrid, 2, [shiftX, shiftY], this.holdWidth, this.holdHeight);
        if (this.game.settings.game.gamemode == 'lookahead' || !this.game.settings.display.colouredQueues) return;
        const colour = this.game.hold.occured ? "gray" : this.game.hold.piece.colour
        this.canvasHold.style.outline = `0.2vh solid ${colour}`;
    }

    clearHold() {
        this.ctxH.clearRect(0, 0, this.canvasHold.offsetWidth + 10, this.canvasHold.offsetHeight);
    }

    renderDanger() {
        const condition =
            this.game.board.getMinos("S").some(c => c[1] > 16) && // any mino if above row 16
            this.game.settings.game.gamemode != 'combo'; // not combo mode
        if (condition && !this.inDanger) {
            this.game.sounds.playSound("damage_alert");
        }
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

        // audio
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
            this.game.sounds.playSound(`combo_${this.game.stats.combo > 16 ? 16 : this.game.stats.combo}`);
    }

    resetActionText() {
        ['btbtext', 'cleartext', 'combotext', 'pctext', 'linessent'].forEach(id => {
            document.getElementById(id).style.opacity = "0";
        })
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
        // custom background
        const bg = this.game.settings.display.background;
        if (bg == "") bg = "#080B0C";
        document.body.style.background = (bg[0] == "#") ? bg : `url("${bg}") no-repeat center center`
        document.body.style.backgroundSize = "cover";

        const height = Number(this.game.settings.display.boardHeight) + 10;
        this.divBoard.style.transform = `scale(${height}%) translate(-50%, -50%)`;
        this.canvasHold.style.outline = `0.2vh solid #dbeaf3`;

        // board opacity
        const background = `rgba(0, 0, 0, ${Number(this.game.settings.display.boardOpacity) / 100})`;
        this.divBackboard.style.backgroundColor = background;
        document.body.style.setProperty('--background', background);

        // skins
        let skin = this.game.settings.display.skin;
        if (defaultSkins.includes(skin)) skin = `../assets/skins/${skin}.png`;
        this.game.boardrender.loadImage(skin);

        // sidebar constants
        this.sidebarStats = this.game.settings.game.sidebar;
        this.sidebarFixed = this.sidebarStats.map(stat => this.createReverseLookup(statDecimals)[stat]);
        this.sidebarSecondary = this.sidebarStats.map(stat => statsSecondaries[stat] ?? "None");

        this.sidebarStats.forEach((stat, index) => {
            if (stat == "None") stat = ""
            this[`elementStatname${index + 1}`].textContent = stat;
        })
    }

    renderSidebar() {
        this.sidebarStats.forEach((stat, index) => {
            if (stat == "None") { // no stat
                this[`elementStats${index + 1}`].textContent = "";
                return;
            };
            const displayStat = this.game.stats[stat].toFixed(this.sidebarFixed[index]);
            this[`elementStats${index + 1}`].textContent = displayStat;

            if (this.sidebarSecondary[index]) {
                const displaySecond = this.game.stats[this.sidebarSecondary[index]]
                this[`elementSmallStat${index + 1}`].textContent = displaySecond;
            }
        })
    }

    createReverseLookup(obj) {
        const reverseLookup = {}
        for (const [key, array] of Object.entries(obj)) {
            array.forEach(item => {
                reverseLookup[item] = key;
            });
        }
        return reverseLookup
    }

    updateAlpha() {
        if (this.game.settings.game.gamemode != 'lookahead') return;
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
                } else {
                    this.game.boardrender[type] = 0;
                }
            }
        }
        update("boardAlpha", 3)
        update("queueAlpha", 3)
        update("justPlacedAlpha", 6)

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
        const forces = { "LEFT": [-force, 0], "RIGHT": [force, 0], "DOWN": [0, force], };
        this.game.boardeffects.move(...forces[direction]);
    }

    rotateBoard(type) {
        const force = Number(this.game.settings.display.boardBounce) * 0.5;
        const forces = { "CW": force, "CCW": -force }
        this.game.boardeffects.rotate(forces[type]);
    }

    dangerParticles() {
        if (!this.inDanger) return;
        this.game.particles.spawnParticles(0, 0, "dangerboard");
        this.game.particles.spawnParticles(0, 20, "dangersides");
    }

    resetAnimation() {
        if (this.resetAnimCurrent >= this.resetAnimLength * 2) return;
        this.resetAnimCurrent++;
        if (this.game.boardrender.boardAlpha < 0.99) this.game.boardrender.boardAlpha += 2 / this.resetAnimLength;
        if (this.resetAnimCurrent > this.resetAnimLength) return;


        const progress = this.resetAnimCurrent / this.resetAnimLength;
        const startY = this.boardHeight / 2;
        const dx = this.boardWidth;
        const dy = dx + this.boardHeight / 2;

        const fillTriangle = (p, colour) => {
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = colour;
            this.ctx.beginPath();
            this.ctx.moveTo(0, startY - dy * p);
            this.ctx.lineTo(dy * p, startY);
            this.ctx.lineTo(0, startY + dy * p);
            this.ctx.lineTo(0, 0);
            this.ctx.fill();
        }
        // fill triangle
        const progress1 = this.easeInOutCubic(progress);
        fillTriangle(progress1, 'white');

        // clear smaller triangle
        const progress2 = this.easeInOutCubic(progress - 0.1);
        fillTriangle(progress2, 'black');


        if (this.resetAnimCurrent == this.resetAnimLength) { // finished
            this.game.startGame();
            this.game.controls.resetting = false;
            this.game.boardrender.boardAlpha = 0;
        }
    }

    easeInOutCubic(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }
}
