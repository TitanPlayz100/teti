import { Bag } from "./mechanics/bag.js";
import { Board } from "./mechanics/board.js";
import { Controls } from "./movement/controls.js";
import { Hold } from "./mechanics/hold.js";
import { Mechanics } from "./mechanics/mechanics.js";
import { MenuActions } from "./menus/menuactions.js";
import { ModalActions } from "./menus/modals.js";
import { Movement } from "./movement/movement.js";
import { Renderer } from "./display/renderer.js";
import { Settings } from "./features/settings.js";
import { Sounds } from "./features/sounds.js";
import { Falling } from "./mechanics/fallingpiece.js";
import { GameStats } from "./features/stats.js";
import { BoardEditor } from "./features/editboard.js";
import { History } from "./features/history.js";
import { BoardEffects } from "./display/boardEffects.js";
import { ProfileStats } from "./features/profileStats.js";
import { Modes } from "./features/modes.js";
import { BoardRenderer } from "./display/renderBoard.js";
import { Particles } from "./display/particles.js";

export class Game {
    started;
    ended;
    gameTimer = 0; // id of timeout
    survivalTimer = 0; // id of timeout
    gravityTimer = 0;
    version = '1.3.0';
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
        this.particles = new Particles(this);
        this.boardeditor = new BoardEditor(this);
        this.controls = new Controls(this);
        this.history = new History(this);
        this.modes = new Modes(this);

        this.boardrender.loadImage();
        this.renderer.sizeCanvas();
        this.particles.initBoard();
        this.renderer.setEditPieceColours();
        this.sounds.initSounds();
        this.startGame();
        this.renderer.renderingLoop();
        this.boardeditor.addListeners();
        this.menuactions.addRangeListener();
        this.modals.generate.addScrollListeners();
        this.profilestats.loadPBs();
        this.modals.generate.generateGamemodeMenu();
        this.versionChecker();
    }

    startGame() {
        this.menuactions.loadSettings();
        this.resetState();
        this.renderer.renderStyles();
        this.mechanics.spawnPiece(this.bag.randomiser(), true);
        this.history.save();
    }

    stopGameTimers() { //stop all the game's timers
        clearInterval(this.gravityTimer);
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

    resetState() {
        this.boardeffects.hasPace = true;
        this.boardeffects.paceCooldown = 0;
        this.boardrender.boardAlpha = 1;
        this.renderer.inDanger = false;
        this.started = false;
        this.ended = false;

        this.board.resetBoard();
        this.mechanics.locking.clearLockDelay();
        this.boardeffects.toggleRainbow(false);
        this.renderer.resetActionText();
        this.renderer.renderDanger();
        this.renderer.clearHold();
        this.stopGameTimers();

        this.bag = new Bag(this);
        this.mechanics = new Mechanics(this);
        this.falling = new Falling(this);
        this.hold = new Hold(this);
        this.stats = new GameStats(this);
        this.history = new History(this);

        this.gameClock();
    }

    gameClock() {
        this.renderer.renderSidebar();
        this.modes.checkFinished();
        this.stats.updateStats();
        this.renderer.updateAlpha();
        this.boardeffects.rainbowBoard();
    }

    versionChecker() {
        const userver = window.localStorage.getItem('version');
        document.getElementById('updatetext').style.display = this.version == userver ? "none" : "block";
        window.localStorage.setItem('version', this.version);
    }

}
