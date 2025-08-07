import { Bag, getPiece } from "./mechanics/randomisers.js";
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
import { Particles } from "./display/particles.js";
import { Zenith, Grandmaster } from "./mechanics/gamemode_extended.js";
import { PixiRender } from "./display/pixirender.js";
import { Animations } from "./display/animations.js";
import { Replay } from "./features/replays.js";
import { Garbage } from "./mechanics/garbage.js";

export class GameClass {
    started;
    ended;
    gameTimer = 0; // id of timeout
    survivalTimer = 0; // id of timeout
    gravityTimer = 0;
    zenithTimer = 0;
    grandmasterTimer = 0;
    version = '1.4.4';
    tickrate = 60;

    elementReason = document.getElementById("reason");
    elementResult = document.getElementById("result");
    elementGameEndTitle = document.getElementById("gameEndTitle");

    async init() {
        this.boardeffects = new BoardEffects();
        this.profilestats = new ProfileStats();
        this.stats = new GameStats();
        this.falling = new Falling();
        this.settings = new Settings();
        this.hold = new Hold();
        this.sounds = new Sounds();
        this.board = new Board();
        this.mechanics = new Mechanics();
        this.menuactions = new MenuActions();
        this.modals = new ModalActions();
        this.movement = new Movement();
        this.renderer = new Renderer();
        this.particles = new Particles();
        this.boardeditor = new BoardEditor();
        this.controls = new Controls();
        this.history = new History();
        this.modes = new Modes();
        this.zenith = new Zenith();
        this.grandmaster = new Grandmaster();
        this.pixi = new PixiRender();
        this.garbage = new Garbage();
        this.animations = new Animations();
        this.replay = new Replay();

        this.menuactions.loadSettings();
        this.board.resetBoard();
        await this.pixi.init();
        this.modes.loadModes();
        this.renderer.renderStyles();
        this.renderer.setEditPieceColours();
        this.sounds.initSounds();
        this.startGame();
        this.loadStateFromString(new URLSearchParams(window.location.search).get("map"));
        this.menuactions.addRangeListener();
        this.modals.generate.addMenuListeners();
        this.modals.generate.generateGamemodeMenu();
        this.modals.generate.generateStatList();
        this.modals.generate.generateSkinList();
        this.sounds.addMenuSFX();
        this.profilestats.loadPBs();
        this.versionChecker();
    }

    startGame(seed = undefined) {
        this.menuactions.loadSettings();
        this.modes.loadModes();
        this.resetState(seed);
        this.renderer.renderStyles();
        this.mechanics.spawnPiece(this.bag.cycleNext(true), true);
        this.history.save();
        this.replay.start();
    }

    stopGameTimers() { //stop all the game's timers
        clearInterval(this.gravityTimer);
        clearInterval(this.gameTimer);
        clearInterval(this.survivalTimer);
        clearInterval(this.zenithTimer);
        clearInterval(this.grandmasterTimer);
        this.mechanics.locking.lockingPause();
        clearTimeout(this.movement.startTimersTimeout);
    }

    endGame(top, bottom = "Better luck next time") {
        if (this.ended) return;
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

        if (this.replay.state == "replaying") { // replay ended
            this.ended = true;
            this.modals.openModal("replaysDialog");
            this.replay.stop();
            return;
        }

        this.ended = true;
        this.replay.stop();
        this.modals.openModal("gameEnd");
        this.stopGameTimers()
        this.elementReason.textContent = top;
        this.elementResult.textContent = bottom;
        this.profilestats.saveSession();
    }

    loadStateFromString(input) {
        if (input) {
            const { board, next, hold } = this.boardeditor.convertFromMap(input);
            this.board.boardState = board;
            this.bag.setQueue(next.split(","));
            this.hold.piece = getPiece(hold);
            this.mechanics.spawnPiece(this.bag.cycleNext());
        }
    }

    resetState(seed = undefined) {
        this.boardeffects.hasPace = true;
        this.boardeffects.paceCooldown = 0;
        this.pixi.boardAlpha = 1;
        this.pixi.queueAlpha = 1;
        this.renderer.inDanger = false;
        this.started = false;
        this.ended = false;

        this.board.resetBoard();
        this.mechanics.locking.clearLockDelay();
        this.boardeffects.toggleRainbow(false);
        this.renderer.renderDanger();
        this.particles.clearParticles();
        this.renderer.clearHold();
        this.stopGameTimers();
        this.animations.resetActionTexts();

        this.bag = new Bag(seed);
        this.mechanics = new Mechanics();
        this.garbage = new Garbage();
        this.falling = new Falling();
        this.hold = new Hold();
        this.stats = new GameStats();
        this.history = new History();
        this.zenith = new Zenith();
        this.grandmaster = new Grandmaster();

        this.renderer.renderSidebar();
        this.modes.checkFinished();
        this.stats.updateStats();
        this.pixi.updateAlpha();
        this.boardeffects.rainbowBoard();
    }

    gameClock() {
        this.renderer.renderSidebar();
        this.modes.checkFinished();
        this.stats.updateStats();
        this.boardeffects.rainbowBoard();
        this.mechanics.simulateGarbage(this.zenith.tickPass);
        this.garbage.tickGarbage();
    }

    versionChecker() {
        const userver = window.localStorage.getItem('version');
        document.getElementById('updatetext').style.display = this.version == userver ? "none" : "block";
        window.localStorage.setItem('version', this.version);
    }

}
