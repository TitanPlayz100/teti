// @ts-check

import { Board } from "./board.js";
import { Main } from "./main.js";
import { Mechanics } from "./mechanics.js";
import { MenuItems as MenuActions } from "./menuactions.js";
import { MenuActions as Modals } from "./modals.js";
import { Movement } from "./movement.js";
import { Rendering } from "./rendering.js";
import { Sounds } from "./sound.js";
import { Utils } from "./util.js";

export class Game {
    attackValues;
    controlSettings;
    currentLoc;
    currentPiece;
    curSongIdx = 0;
    displaySettings;
    firstMove;
    gameEnd;
    gameSettings;
    holdPiece;
    movedPieceFirst;
    nextPieces;
    pieces;
    sfx = {};
    timeouts = { arr: 0, das: 0, sd: 0, lockdelay: 0, gravity: 0, stats: 0, lockingTimer: 0 };
    totalTimeSeconds;

    progressDamage = document.getElementById("garbageQueue");
    elementObjective = document.getElementById("objective");
    elSongProgress = document.getElementById("songProgress");
  

    constructor(defaultSettings, piecesJSON, attackValuesJSON) {
        this.displaySettings = defaultSettings[0];
        this.gameSettings = defaultSettings[1];
        this.controlSettings = defaultSettings[2];
        this.pieces = piecesJSON;
        this.attackValues = attackValuesJSON;

        this.main = new Main(this);
        this.mechanics = new Mechanics(this);
        this.modals = new Modals(this);
        this.movement = new Movement(this);
        this.rendering = new Rendering(this);
        this.sounds = new Sounds(this);
        this.utils = new Utils(this);
        this.board = new Board(this);
        this.menuactions = new MenuActions(this);
    }

    startGame() {
        this.menuactions.loadSettings();
        this.resetState();
        this.rendering.renderStyles();
        this.mechanics.spawnPiece(this.mechanics.randomiser(), true);
    }

    resetState() {
        this.gameEnd = false;
        this.currentPiece = null;
        this.currentLoc = [];
        this.mechanics.isTspin = false;
        this.mechanics.isMini = false;
        this.holdPiece = { piece: null, occured: false };
        this.nextPieces = [[], []];
        this.mechanics.totalLines = 0;
        this.mechanics.totalScore = 0;
        this.mechanics.garbRowsLeft = this.gameSettings.requiredGarbage;
        this.mechanics.spikeCounter = 0;
        this.mechanics.btbCount = -1;
        this.mechanics.combonumber = -1;
        this.totalTimeSeconds = -0.02;
        this.mechanics.totalAttack = 0;
        this.mechanics.totalPieceCount = 0;
        this.firstMove = true;
        this.rotationState = 1;
        this.inDanger = false;
        this.mechanics.totalSentLines = 0;
        this.mechanics.garbageQueue = 0;
        this.mechanics.maxCombo = 0;
        this.movedPieceFirst = false;
        this.boardAlpha = 1;
        this.boardAlphaChange = 0;

        clearInterval(this.timeouts["gravity"]);
        clearInterval(this.timeouts["survival"]);
    }

    objectives() {
        const time = (Math.round(this.totalTimeSeconds * 100) / 100).toFixed(2),
            gs = this.gameSettings.gamemode;
        const pieces = this.gameSettings.lookAheadPieces;
        this.elementObjective.textContent = {
            0: "",
            1: `${this.mechanics.totalLines}/${this.gameSettings.requiredLines}`,
            2: `${this.mechanics.totalScore}`,
            3: `${this.mechanics.totalAttack}/${this.gameSettings.requiredAttack}`,
            4: `${this.mechanics.garbRowsLeft}`,
            5: `${this.mechanics.totalSentLines}`,
            6: `${this.mechanics.totalAttack}/${this.gameSettings.requiredAttack}`,
            7: `${this.mechanics.combonumber}`,
            8: `${this.mechanics.totalLines}/${this.gameSettings.requiredLines}`,
        }[gs];

        const obj1 = this.mechanics.totalLines >= this.gameSettings.requiredLines,
            obj2 = this.totalTimeSeconds >= Number(this.gameSettings.timeLimit),
            obj3 = this.mechanics.totalAttack >= this.gameSettings.requiredAttack,
            obj4 = this.mechanics.garbRowsLeft < 1,
            obj5 = this.gameEnd,
            obj6 = this.mechanics.combonumber == -1 && this.mechanics.totalLines >= 1;
        const ts = ` in ${time} seconds`,
            cl = `Cleared ${this.mechanics.totalLines} lines`;
        const total = this.mechanics.totalScore,
            reqGarb = this.gameSettings.requiredGarbage;

        switch (gs) {
            case 1: if (obj1) { this.endGame(`${time}s`, cl + ts); } break;
            case 2: if (obj2) { this.endGame(`${total} points`, `Scored ${total} points` + ts); } break;
            case 3: if (obj3) { this.endGame(`${time}s`, `Sent ${this.mechanics.totalAttack} damage` + ts); } break;
            case 4: if (obj4) { this.endGame(`${time}s`, `Dug ${reqGarb} lines` + ts); } break;
            case 5: if (obj5) { this.endGame(`${time}s`, `Survived ${this.mechanics.totalSentLines} lines` + ts); } break;
            case 6: if (obj3) { this.endGame(`${time}s`, `Sent ${this.mechanics.totalAttack} damage` + ts); } break;
            case 7: if (obj6) { this.endGame(`${time}s`, `Got a ${this.mechanics.maxCombo} combo` + ts); } break;
            case 8: if (obj1) { this.endGame(`${time}s`, cl + ` using ${pieces} lookahead`); } break;
        }
    }

    endGame(top, bottom = "Better luck next time") {
        const ded = ["Lockout", "Topout", "Blockout"].includes(top);
        if (this.gameSettings.gamemode == 5 && ded) {
            this.gameEnd = true;
            return;
        }
        switch (top) {
            case "Lockout":
            case "Topout":
            case "Blockout":
                playSound("failure");
                playSound("topout");
                break;
            case undefined:
                return;
                break;
            default:
                playSound("finish");
                break;
        }

        this.gameEnd = true;
        clearInterval(this.timeouts["gravity"]);
        clearInterval(this.timeouts["stats"]);
        clearInterval(this.timeouts["survival"]);
        this.modals.openModal("gameEnd");
        document.getElementById("reason").textContent = top;
        document.getElementById("result").textContent = bottom;
    }
}
