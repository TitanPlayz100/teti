import { Bag } from "./mechanics/bag.js";
import { Board } from "./mechanics/board.js";
import { Controls } from "./movement/controls.js";
import { Hold } from "./movement/hold.js";
import { Mechanics } from "./mechanics/mechanics.js";
import { MenuActions } from "./display/menuactions.js";
import { ModalActions } from "./display/modals.js";
import { Movement } from "./movement/movement.js";
import { Rendering } from "./display/rendering.js";
import { Settings } from "./features/settings.js";
import { Sounds } from "./features/sound.js";
import { Falling } from "./mechanics/fallingpiece.js";
import { GameStats } from "./features/stats.js";
import { BoardEditor } from "./display/editboard.js";
import { History } from "./features/history.js";
import { BoardEffects } from "./display/boardEffects.js";
import { ProfileStats } from "./features/profileStats.js";
import { Modes } from "./features/modes.js";
import { Zenith } from "./mechanics/zenith.js";

export class Game {
    started;
    ended;
    gameTimer = 0; // id of timeout
    survivalTimer = 0; // id of timeout
    version = '1.2.4';
    tickrate = 50;

    elementReason = document.getElementById("reason");
    elementResult = document.getElementById("result");
    elementGameEndTitle = document.getElementById("gameEndTitle");


    constructor() {
        this.boardEffects = new BoardEffects(this);
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
        this.rendering = new Rendering(this);
        this.boardeditor = new BoardEditor(this);
        this.controls = new Controls(this);
        this.history = new History(this);
        this.modes = new Modes(this);
        this.zenith = new Zenith(this)

        this.rendering.sizeCanvas();
        this.rendering.setEditPieceColours();
        this.sounds.initSounds();
        this.startGame();
        this.rendering.renderingLoop();
        this.boardeditor.addListeners();
        this.menuactions.addRangeListener();
        this.versionChecker();
        this.profilestats.loadPBs();
        this.modals.generateGamemodeMenu();
    }

    startGame() {
        this.menuactions.loadSettings();
        this.resetState();
        this.rendering.renderStyles();
        this.mechanics.spawnPiece(this.bag.randomiser(), true);
        this.history.save();
    }

    stopGameTimers() { //stop all the game's timers
        clearInterval(this.mechanics.gravityTimer);
        clearInterval(this.gameTimer);
        clearInterval(this.survivalTimer);
        clearInterval(this.mechanics.zenithTimer)
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
        this.boardEffects.hasPace = true;
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
        this.rendering.boardAlpha = 1;
        this.rendering.inDanger = false;

        this.started = false;
        this.ended = false;
        this.stats = new GameStats(this);
        this.zenith = new Zenith(this);

        this.stopGameTimers()

        this.mechanics.clear.progressDamage.value = 0;
        ['btbtext', 'cleartext', 'combotext', 'pctext', 'linessent'].forEach(id => {
            document.getElementById(id).style.opacity = "0";
        })
        this.board.resetBoard();
        this.mechanics.locking.clearLockDelay();
        this.rendering.renderDanger();
        this.gameClock();
        this.rendering.clearHold();
    }

    gameClock() {
        this.rendering.renderSidebar();
        this.modes.checkFinished();
        this.stats.updateStats();
        this.rendering.updateAlpha();
    }

    versionChecker() {
        const userver = window.localStorage.getItem('version');
        document.getElementById('updatetext').style.display = this.version == userver ? "none" : "block";
        window.localStorage.setItem('version', this.version);
    }

}
