// @ts-check

import { Bag } from "./mechanics/bag.js";
import { Board } from "./mechanics/board.js";
import { Controls } from "./movement/controls.js";
import { Hold } from "./movement/hold.js";
import { Mechanics } from "./mechanics/mechanics.js";
import { MenuActions } from "./display/menuactions.js";
import { ModalActions } from "./display/modals.js";
import { Movement } from "./movement/movement.js";
import { Rendering } from "./display/rendering.js";
import { Settings } from "./settings.js";
import { Sounds } from "./sound.js";
import { Utils } from "./util.js";
import { Falling } from "./movement/fallingpiece.js";

export class Game {
    firstMove;
    gameEnd;
    
    timeouts = { arr: 0, das: 0, sd: 0, lockdelay: 0, gravity: 0, stats: 0, lockingTimer: 0 };
    totalTimeSeconds;

    elementObjective = document.getElementById("objective");
    elementReason = document.getElementById("reason");
    elementResult = document.getElementById("result");
  

    constructor() {
        this.falling = new Falling(this);
        this.settings = new Settings(this);
        this.hold = new Hold(this);
        this.sounds = new Sounds(this);
        this.board = new Board(this);
        this.bag = new Bag(this);
        this.mechanics = new Mechanics(this);
        this.menuactions = new MenuActions(this);
        this.modals = new ModalActions(this);
        this.movement = new Movement(this);
        this.rendering = new Rendering(this);
        this.utils = new Utils(this);
        this.controls = new Controls(this);

        this.rendering.sizeCanvas();
        this.sounds.initSounds();
        this.startGame();
        this.rendering.renderingLoop();
    }

    startGame() {
        this.menuactions.loadSettings();
        this.resetState();
        this.rendering.renderStyles();
        this.mechanics.spawnPiece(this.bag.randomiser(), true);
    }

    endGame(top, bottom = "Better luck next time") {
        const dead = ["Lockout", "Topout", "Blockout"].includes(top);
        if (this.settings.game.gamemode == 5 && dead) {
            this.gameEnd = true;
            return;
        }
        switch (top) {
            case "Lockout":
            case "Topout":
            case "Blockout":
                this.sounds.playSound("failure");
                this.sounds.playSound("topout");
                break;
            case undefined:
                return;
                break;
            default:
                this.sounds.playSound("finish");
                break;
        }

        this.gameEnd = true;
        clearInterval(this.timeouts["gravity"]);
        clearInterval(this.timeouts["stats"]);
        clearInterval(this.timeouts["survival"]);
        this.modals.openModal("gameEnd");
        this.elementReason.textContent = top;
        this.elementResult.textContent = bottom;
    }

    resetState() {
        this.gameEnd = false;
        this.falling.piece = null;
        this.falling.location = [];
        this.mechanics.isTspin = false;
        this.mechanics.isMini = false;
        this.hold.piece = null;
        this.hold.occured = false;
        this.bag.nextPieces = [[], []];
        this.mechanics.totalLines = 0;
        this.mechanics.totalScore = 0;
        this.mechanics.garbRowsLeft = this.settings.game.requiredGarbage;
        this.mechanics.spikeCounter = 0;
        this.mechanics.btbCount = -1;
        this.mechanics.combonumber = -1;
        this.totalTimeSeconds = -0.02;
        this.mechanics.totalAttack = 0;
        this.mechanics.totalPieceCount = 0;
        this.firstMove = true;
        this.falling.rotation = 1;
        this.inDanger = false;
        this.mechanics.totalSentLines = 0;
        this.mechanics.garbageQueue = 0;
        this.mechanics.maxCombo = 0;
        this.falling.moved = false;
        this.boardAlpha = 1;
        this.boardAlphaChange = 0;

        clearInterval(this.timeouts["gravity"]);
        clearInterval(this.timeouts["survival"]);
        clearInterval(this.timeouts['stats']);

        this.mechanics.clear.progressDamage.value = 0;
        ['btbtext', 'cleartext', 'combotext', 'pctext', 'linessent'].forEach(id => {
            document.getElementById(id).style.opacity = "0";
        })
        this.board.resetBoard();
        this.mechanics.Locking.clearLockDelay();
        this.rendering.renderDanger();
        this.rendering.renderStats();
        this.rendering.clearHold();
    }

    checkObjectives() {
        const time = (Math.round(this.totalTimeSeconds * 100) / 100).toFixed(2),
            gs = this.settings.game.gamemode;
        const pieces = this.settings.game.lookAheadPieces;
        this.elementObjective.textContent = {
            0: "",
            1: `${this.mechanics.totalLines}/${this.settings.game.requiredLines}`,
            2: `${this.mechanics.totalScore}`,
            3: `${this.mechanics.totalAttack}/${this.settings.game.requiredAttack}`,
            4: `${this.mechanics.garbRowsLeft}`,
            5: `${this.mechanics.totalSentLines}`,
            6: `${this.mechanics.totalAttack}/${this.settings.game.requiredAttack}`,
            7: `${this.mechanics.combonumber}`,
            8: `${this.mechanics.totalLines}/${this.settings.game.requiredLines}`,
        }[gs];

        const obj1 = this.mechanics.totalLines >= this.settings.game.requiredLines,
            obj2 = this.totalTimeSeconds >= Number(this.settings.game.timeLimit),
            obj3 = this.mechanics.totalAttack >= this.settings.game.requiredAttack,
            obj4 = this.mechanics.garbRowsLeft < 1,
            obj5 = this.gameEnd,
            obj6 = this.mechanics.combonumber == -1 && this.mechanics.totalLines >= 1;
        const ts = ` in ${time} seconds`,
            cl = `Cleared ${this.mechanics.totalLines} lines`;
        const total = this.mechanics.totalScore,
            reqGarb = this.settings.game.requiredGarbage;

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

}
