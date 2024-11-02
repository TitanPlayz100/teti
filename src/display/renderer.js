import { Game } from "../game.js";
import { statDecimals, statsSecondary as statsSecondaries } from "../data/data.js";
import { getPiece } from "../mechanics/randomisers.js";
import kicks from "../data/kicks.json" with { type: "json" };

export class Renderer {
    holdQueueGrid = [];
    nextQueueGrid = [];
    inDanger;
    texttimeouts = {};

    sidebarStats;
    sidebarFixed;
    sidebarSecondary;

    divBoard = document.getElementById("board");
    elementEditPieces = document.getElementById("editMenuPieces");
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;
        this.nextQueueGrid = [...Array(15)].map(() => [...Array(4)].map(() => ""));
        this.holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ""));
    }

    updateNext() {
        this.nextQueueGrid = [...Array(15)].map(() => [...Array(4)].map(() => ""));

        const next5 = this.game.bag.getFirstN(this.game.settings.game.nextPieces);
        next5.forEach((piece, idx) => {
            let [dx, dy] = [0, 3 * (4 - idx)];
            if (piece.name == "o") [dx, dy] = [dx + 1, dy + 1]; // shift o piece
            const initialRotations = kicks[this.game.settings.game.kicktable].spawn_rotation ?? {}
            const rotation = initialRotations[piece.name] ?? 1;
            const coords = this.board.pieceToCoords(piece[`shape${rotation}`]);
            coords.forEach(([x, y]) => (this.nextQueueGrid[y + dy][x + dx] = "A " + piece.name));
        });

        this.game.pixi.render("next", this.nextQueueGrid);
    }

    updateHold() {
        this.holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ""));
        this.clearHold();
        if (this.game.hold.piece == undefined) return;

        const name = this.game.hold.piece.name;
        const isO = name == "o",
            isI = name == "i";
        const [dx, dy] = [isO ? 1 : 0, isO ? 1 : isI ? -1 : 0];
        const initialRotations = kicks[this.game.settings.game.kicktable].spawn_rotation ?? {}
        const rotation = initialRotations[name] ?? 1;
        const coords = this.board.pieceToCoords(this.game.hold.piece[`shape${rotation}`]);
        coords.forEach(([x, y]) => (this.holdQueueGrid[y + dy][x + dx] = "A " + name));

        this.game.pixi.render("hold", this.holdQueueGrid);
    }

    clearHold() {
        this.game.pixi.render("hold", this.holdQueueGrid);
    }

    renderDanger() {
        const condition =
            this.game.board.getMinos("S").some(c => c[1] > 16) && // any mino if above row 16
            this.game.settings.game.gamemode != 'combo'; // not combo mode
        if (condition && !this.inDanger) {
            this.game.sounds.playSound("damage_alert");
        }
        this.game.pixi.toggleDangerBG(condition);
        this.inDanger = condition;
    }

    dangerParticles() {
        if (!this.inDanger) return;
        this.game.particles.spawnParticles(0, 0, "dangerboard");
        this.game.particles.spawnParticles(0, 20, "dangersides");
    }

    renderActionText(damagetype, isBTB, isPC, damage, linecount) {
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

        // text
        if (this.game.settings.display.actionText == false) return;
        if (damagetype != "") this.game.pixi.showActionText("cleartext", damagetype);
        if (this.game.stats.combo > 0) this.game.pixi.showActionText("combotext", `Combo ${this.game.stats.combo}`);
        if (isBTB && this.game.stats.btbCount > 0) this.game.pixi.showActionText("btbtext", `btb ${this.game.stats.btbCount} `);
        if (this.game.mechanics.spikeCounter > 4 && linecount > 0) this.game.pixi.showSpikeText(`${this.game.mechanics.spikeCounter}`);
        if (isPC) this.game.pixi.showPCText();

    }

    renderStyles(settings = false) {
        // custom background
        const bg = this.game.settings.display.background;
        if (bg == "") bg = "#080B0C";
        document.body.style.background = (bg[0] == "#") ? bg : `url("${bg}") no-repeat center center`
        document.body.style.backgroundSize = "cover";

        const height = Number(this.game.settings.display.boardHeight);
        this.divBoard.style.transform = `scale(${height}%) translate(-50%, -50%)`;

        // todo add board background
        // board opacity
        // const background = `rgba(0, 0, 0, ${Number(this.game.settings.display.boardOpacity) / 100})`;
        // this.divBackboard.style.backgroundColor = background;
        // document.body.style.setProperty('--background', background);

        // sidebar constants
        this.sidebarStats = this.game.settings.game.sidebar;
        this.sidebarFixed = this.sidebarStats.map(stat => reverseLookup(statDecimals)[stat]);
        this.sidebarSecondary = this.sidebarStats.map(stat => statsSecondaries[stat] ?? "None");

        this.sidebarStats.forEach((stat, index) => {
            if (stat == "None") stat = ""
            this.game.pixi.statTexts[index].statText.text = stat.toUpperCase();
        })

        if (settings) this.game.pixi.resize();
    }

    renderSidebar() {
        this.sidebarStats.forEach((stat, index) => {
            if (stat == "None") { // no stat
                this.game.pixi.statTexts[index].stat.text = "";
                return;
            };

            let displayStat = this.game.stats[stat].toFixed(this.sidebarFixed[index]) ?? "";
            if (stat == "time") displayStat = this.formatTime(Number(displayStat), this.sidebarFixed[index]); // reformat time
            this.game.pixi.statTexts[index].stat.text = displayStat;

            if (this.sidebarSecondary[index]) {
                const displaySecond = this.game.stats[this.sidebarSecondary[index]] ?? ""
                this.game.pixi.statTexts[index].statSecondary.text = displaySecond;
            }
        })
    }

    formatTime(s, d) {
        const minutes = Math.floor(s / 60);
        const seconds = (s - minutes * 60).toFixed(d)
        return `${minutes > 0 ? minutes : ""}:${seconds < 10 ? "0" : ""}${seconds}`
    }

    renderTimeLeft(text) {
        this.game.pixi.showTimeLeftText(text);
    }

    setEditPieceColours() {
        const elPieces = [...this.elementEditPieces.children];
        elPieces.forEach(elpiece => {
            const pieceid = elpiece.id.split("_")[0];
            elpiece.style.backgroundColor = getPiece(pieceid).colour
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
}

export function reverseLookup(obj) {
    const reverseLookup = {}
    for (const [key, array] of Object.entries(obj)) {
        array.forEach(item => {
            reverseLookup[item] = key;
        });
    }
    return reverseLookup
}
