import { Game } from "../main.js";
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
    
    constructor() {
        this.nextQueueGrid = [...Array(15)].map(() => [...Array(4)].map(() => ""));
        this.holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ""));
    }

    updateNext() {
        this.nextQueueGrid = [...Array(15)].map(() => [...Array(4)].map(() => ""));

        const next5 = Game.bag.getFirstN(Game.settings.game.nextPieces);
        next5.forEach((piece, idx) => {
            let [dx, dy] = [0, 3 * (4 - idx)];
            if (piece.name == "o") [dx, dy] = [dx + 1, dy + 1]; // shift o piece
            const initialRotations = kicks[Game.settings.game.kicktable].spawn_rotation ?? {}
            const rotation = initialRotations[piece.name] ?? 1;
            const coords = Game.board.pieceToCoords(piece[`shape${rotation}`]);
            coords.forEach(([x, y]) => (this.nextQueueGrid[y + dy][x + dx] = "A " + piece.name));
        });

        Game.pixi.render("next", this.nextQueueGrid);
    }

    updateHold() {
        this.holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ""));
        this.clearHold();
        if (Game.hold.piece == undefined) return;

        const name = Game.hold.piece.name;
        const isO = name == "o",
            isI = name == "i";
        const [dx, dy] = [isO ? 1 : 0, isO ? 1 : isI ? -1 : 0];
        const initialRotations = kicks[Game.settings.game.kicktable].spawn_rotation ?? {}
        const rotation = initialRotations[name] ?? 1;
        const coords = Game.board.pieceToCoords(Game.hold.piece[`shape${rotation}`]);
        coords.forEach(([x, y]) => (this.holdQueueGrid[y + dy][x + dx] = "A " + name));

        Game.pixi.render("hold", this.holdQueueGrid);
    }

    clearHold() {
        Game.pixi.render("hold", this.holdQueueGrid);
    }

    renderDanger() {
        const condition =
            Game.board.getMinos("S").some(c => c[1] > 16) && // any mino if above row 16
            Game.settings.game.gamemode != 'combo'; // not combo mode
        if (condition && !this.inDanger) {
            Game.sounds.playSound("damage_alert");
        }
        Game.animations.toggleDangerBG(condition);
        this.inDanger = condition;
    }

    dangerParticles() {
        if (!this.inDanger) return;
        Game.particles.spawnParticles(0, 0, "dangerboard");
        Game.particles.spawnParticles(0, 20, "dangersides");
    }

    renderActionText(damagetype, isBTB, isPC, damage, linecount) {
        // audio
        if (isPC) Game.sounds.playSound("allclear");
        if (Game.stats.btbCount == 2 && isBTB) Game.sounds.playSound("btb_1");
        if (linecount >= 4 && Game.stats.btbCount > 0) {
            Game.sounds.playSound("clearbtb");
        } else if (linecount >= 4) {
            Game.sounds.playSound("clearquad");
        } else if (linecount > 0 && Game.mechanics.isTspin) {
            Game.sounds.playSound("clearspin");
        } else if (linecount > 0 && Game.mechanics.isAllspin && Game.settings.game.allspin) {
            Game.sounds.playSound("clearspin");
        } else if (linecount > 0) {
            Game.sounds.playSound("clearline");
        }
        if (Game.mechanics.spikeCounter >= 15) Game.sounds.playSound("thunder", false);
        if (Game.stats.combo > 0)
            Game.sounds.playSound(`combo_${Game.stats.combo > 16 ? 16 : Game.stats.combo}`);

        // text
        if (Game.settings.display.actionText == false) return;
        if (damagetype != "") Game.animations.showActionText("cleartext", damagetype);
        if (Game.stats.combo > 0) Game.animations.showActionText("combotext", `Combo ${Game.stats.combo}`);
        if (isBTB && Game.stats.btbCount > 0) Game.animations.showActionText("btbtext", `btb ${Game.stats.btbCount} `);
        if (Game.mechanics.spikeCounter > 4 && linecount > 0) Game.animations.showSpikeText(`${Game.mechanics.spikeCounter}`);
        if (isPC) Game.animations.showPCText();

    }

    renderStyles(settings = false) {
        const bg = Game.settings.display.background;
        if (bg == "") bg = "#080B0C";
        document.body.style.background = (bg[0] == "#") ? bg : `url("${bg}") no-repeat center center`
        document.body.style.backgroundSize = "cover";

        if (settings) {
            Game.pixi.resize();
            Game.pixi.generateTextures();
        }
        this.setupSidebar();
        this.divBoard.style.height = `${Game.pixi.height}px`;
    }

    setupSidebar() {
        this.sidebarStats = Game.settings.game.sidebar;
        this.sidebarFixed = this.sidebarStats.map(stat => reverseLookup(statDecimals)[stat]);
        this.sidebarSecondary = this.sidebarStats.map(stat => statsSecondaries[stat] ?? "None");

        this.sidebarStats.forEach((stat, index) => {
            if (stat == "None") stat = ""
            Game.pixi.statTexts[index].statText.text = stat.toUpperCase();
        })
    }

    renderSidebar() {
        this.sidebarStats.forEach((stat, index) => {
            if (stat == "None") {
                Game.pixi.statTexts[index].stat.text = "";
                return;
            };

            let displayStat = Game.stats[stat].toFixed(this.sidebarFixed[index]) ?? "";
            if (stat == "time") displayStat = this.formatTime(Number(displayStat), this.sidebarFixed[index]); // reformats time
            Game.pixi.statTexts[index].stat.text = displayStat;

            if (this.sidebarSecondary[index]) {
                const displaySecond = Game.stats[this.sidebarSecondary[index]] ?? ""
                Game.pixi.statTexts[index].statSecondary.text = displaySecond;
            }
        })
    }

    formatTime(s, d) {
        const minutes = Math.floor(s / 60);
        const seconds = (s - minutes * 60).toFixed(d)
        return `${minutes > 0 ? minutes : ""}:${seconds < 10 ? "0" : ""}${seconds}`
    }

    renderTimeLeft(text) {
        Game.animations.showTimeLeftText(text);
    }

    setEditPieceColours() {
        const elPieces = [...this.elementEditPieces.children];
        elPieces.forEach(elpiece => {
            const pieceid = elpiece.id.split("_")[0];
            elpiece.style.backgroundColor = getPiece(pieceid).colour
        })
    }

    bounceBoard(direction) {
        const force = Number(Game.settings.display.boardBounce);
        const forces = { "LEFT": [-force, 0], "RIGHT": [force, 0], "DOWN": [0, force], };
        Game.boardeffects.move(...forces[direction]);
    }

    rotateBoard(type) {
        const force = Number(Game.settings.display.boardBounce) * 0.5;
        const forces = { "CW": force, "CCW": -force }
        Game.boardeffects.rotate(forces[type]);
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
