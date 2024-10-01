import { Bag } from "./mechanics/bag.js";
import { Board } from "./mechanics/board.js";
import { Controls } from "./movement/controls.js";
import { Hold } from "./movement/hold.js";
import { Mechanics } from "./mechanics/mechanics.js";
import { MenuActions } from "./display/menuactions.js";
import { ModalActions } from "./display/modals.js";
import { Movement } from "./movement/movement.js";
import { Renderer } from "./display/renderer.js";
import { Settings } from "./features/settings.js";
import { Sounds } from "./features/sounds.js";
import { Falling } from "./mechanics/fallingpiece.js";
import { GameStats } from "./features/stats.js";
import { BoardEditor } from "./display/editboard.js";
import { History } from "./features/history.js";
import { BoardEffects } from "./display/boardEffects.js";
import { ProfileStats } from "./features/profileStats.js";
import { Modes } from "./features/modes.js";
import { BoardRenderer } from "./display/renderBoard.js";

export class Game {
    started;
    ended;
    gameTimer = 0; // id of timeout
    survivalTimer = 0; // id of timeout
    version = '1.2.4';
    tickrate = 60;

    elementReason = document.getElementById("reason");
    elementResult = document.getElementById("result");
    elementGameEndTitle = document.getElementById("gameEndTitle");


    constructor() {
        this.boardeffects = new BoardEffects(this);
        this.profilestats = new ProfileStats(this);
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
        this.renderer = new Renderer(this);
        this.boardrender = new BoardRenderer(this);
        this.boardeditor = new BoardEditor(this);
        this.controls = new Controls(this);
        this.history = new History(this);
        this.modes = new Modes(this);

        this.renderer.sizeCanvas();
        this.renderer.setEditPieceColours();
        this.sounds.initSounds();
        this.startGame();
        this.renderer.renderingLoop();
        this.boardeditor.addListeners();
        this.menuactions.addRangeListener();
        this.versionChecker();
        this.profilestats.loadPBs();
        this.modals.generateGamemodeMenu();
    }

    startGame() {
        this.menuactions.loadSettings();
        this.resetState();
        this.renderer.renderStyles();
        this.mechanics.spawnPiece(this.bag.randomiser(), true);
        this.history.save();
    }

    stopGameTimers() { //stop all the game's timers
        clearInterval(this.mechanics.gravityTimer);
        clearInterval(this.gameTimer);
        clearInterval(this.survivalTimer);
        this.mechanics.locking.lockingPause();
    }

    endGame(top, bottom = "Better luck next time") {
        const dead = ["Lockout", "Topout", "Blockout"].includes(top); // survival mode end instead of lose
        if (this.settings.game.gamemode == 'survival' && dead) {
            this.ended = true;
            return;
        }

        if (top == "Topout" || top == "Blockout" || top == "Lockout") {
            this.sounds.playSound("topout");
            this.sounds.playSound("failure");
        } else if (top == undefined) {
            return;
        } else {
            this.sounds.playSound("finish");
        }

        this.ended = true;
        this.modals.openModal("gameEnd");
        this.stopGameTimers()
        this.elementReason.textContent = top;
        this.elementResult.textContent = bottom;
        this.profilestats.saveSession();
    }

    resetState() { // todo maybe refactor this to each class
        this.bag.nextPieces = [[], []];
        this.boardeffects.hasPace = true;
        this.boardeffects.paceCooldown = 0;
        this.falling.location = [];
        this.falling.moved = false;
        this.falling.piece = null;
        this.falling.rotation = 1;
        this.history.currentState = 0;
        this.history.historyConnections = [];
        this.history.historyStates = [];
        this.hold.occured = false;
        this.hold.piece = null;
        this.mechanics.garbageQueue = 0;
        this.mechanics.isAllspin = false;
        this.mechanics.isMini = false;
        this.mechanics.isTspin = false;
        this.mechanics.spikeCounter = 0;
        this.boardrender.boardAlpha = 1;
        this.renderer.inDanger = false;

        this.started = false;
        this.ended = false;
        this.stats = new GameStats(this);

        this.stopGameTimers()

        this.mechanics.clear.progressDamage.value = 0;
        ['btbtext', 'cleartext', 'combotext', 'pctext', 'linessent'].forEach(id => {
            document.getElementById(id).style.opacity = "0";
        })
        this.board.resetBoard();
        this.mechanics.locking.clearLockDelay();
        this.renderer.renderDanger();
        this.gameClock();
        this.renderer.clearHold();
        this.boardeffects.toggleRainbow(false);
    }

    gameClock() {
        this.renderer.renderSidebar();
        this.modes.checkFinished();
        this.stats.updateStats();
        this.renderer.updateAlpha();
        this.boardeffects.rainbowBoard(); // todo maybe check performance
    }

    versionChecker() {
        const userver = window.localStorage.getItem('version');
        document.getElementById('updatetext').style.display = this.version == userver ? "none" : "block";
        window.localStorage.setItem('version', this.version);
    }

}
