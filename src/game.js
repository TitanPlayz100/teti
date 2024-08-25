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
import { Falling } from "./mechanics/fallingpiece.js";
import { GameStats } from "./mechanics/stats.js";

export class Game {
    started;
    ended;

    // TODO: refactor timeouts to either be in main file or in a class
    timeouts = { arr: 0, das: 0, sd: 0, lockdelay: 0, gravity: 0, stats: 0, lockingTimer: 0 };

    elementReason = document.getElementById("reason");
    elementResult = document.getElementById("result");
  

    constructor() {
        this.stats = new GameStats(this);
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
            this.ended = true;
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

        this.ended = true;
        clearInterval(this.timeouts["gravity"]);
        clearInterval(this.timeouts["stats"]);
        clearInterval(this.timeouts["survival"]);
        this.modals.openModal("gameEnd");
        this.elementReason.textContent = top;
        this.elementResult.textContent = bottom;
    }

    resetState() {
        this.ended = false;
        this.falling.piece = null;
        this.falling.location = [];
        this.mechanics.isTspin = false;
        this.mechanics.isMini = false;
        this.hold.piece = null;
        this.hold.occured = false;
        this.bag.nextPieces = [[], []];
        this.stats.clearlines = 0;
        this.stats.score = 0;
        this.stats.cleargarbage = 0;
        this.mechanics.spikeCounter = 0;
        this.stats.btbCount = -1;
        this.mechanics.combonumber = -1;
        this.stats.time = -0.02;
        this.stats.attack = 0;
        this.stats.pieceCount = 0;
        this.started = false;
        this.falling.rotation = 1;
        this.rendering.inDanger = false;
        this.stats.sent = 0;
        this.mechanics.garbageQueue = 0;
        this.stats.maxCombo = 0;
        this.falling.moved = false;
        this.rendering.boardAlpha = 1;
        this.rendering.boardAlphaChange = 0;

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


}
