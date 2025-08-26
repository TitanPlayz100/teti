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
import { tetrisAI } from "./ai/tetris_ai_wrapper.js";

export class GameClass {
    started;
    ended;
    gameTimer = false; // is timer running
    survivalTimer = 0; // id of timeout
    gravityTimer = null;
    zenithTimer = false
    grandmasterTimer = 0;
    version = '1.4.4';

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
        this.tetrisAI = tetrisAI;
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
        await this.tetrisAI.init();
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
        if (this.gravityTimer) this.gravityTimer.stopAuto();
        this.gameTimer = false;
        clearInterval(this.survivalTimer);
        this.zenithTimer = false;
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
            this.pixi.seekBar.visible = false;
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
            this.history.save();
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
        this.controls.resetMovements();
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
        this.stats.updateStats(1);
        this.pixi.updateAlpha(1);
        this.boardeffects.rainbowBoard();
    }

    versionChecker() {
        const userver = window.localStorage.getItem('version');
        document.getElementById('updatetext').style.display = this.version == userver ? "none" : "block";
        window.localStorage.setItem('version', this.version);
    }

    /**
     * Toggle AI control for Tetris gameplay
     */
    toggleAI() {
        const isActive = this.tetrisAI.toggle();
        const button = document.getElementById('aiToggleButton');
        const text = document.getElementById('aiToggleText');
        
        if (button && text) {
            if (isActive) {
                button.classList.add('ai-active');
                button.title = 'AI Active - Click to stop AI control';
                text.textContent = 'STOP';
            } else {
                button.classList.remove('ai-active');
                button.title = 'Click to enable AI control';
                text.textContent = 'AI';
            }
        }

        // Show notification
        if (isActive) {
            this.renderer.renderTimeLeft("🤖 AI CONTROL ENABLED");
        } else {
            this.renderer.renderTimeLeft("👤 MANUAL CONTROL");
        }

        return isActive;
    }

    /**
     * Update AI with current game state
     */
    async updateAI() {
        if (!this.tetrisAI.isActive || !this.started || this.ended) {
            console.log('🚫 AI update skipped:', {
                aiActive: this.tetrisAI?.isActive,
                gameStarted: this.started,
                gameEnded: this.ended,
                gamemode: this.settings?.game?.gamemode
            });
            return;
        }

        // Check if we have a falling piece
        if (!this.falling || !this.falling.piece) {
            console.log('⏸️ AI waiting: No falling piece');
            return;
        }

        const gameState = {
            board: this.board,
            falling: this.falling,
            next: this.hold.nextQueue,
            hold: this.hold.piece,
            stats: this.stats
        };

        console.log('🎮 AI updating with game state:', {
            hasFallingPiece: !!this.falling.piece,
            pieceType: this.falling.piece?.name,
            position: {x: this.falling.x, y: this.falling.y}
        });

        const suggestion = await this.tetrisAI.updateGameState(gameState);
        if (suggestion && suggestion.moves && suggestion.moves.length > 0) {
            console.log('🎯 AI suggestion:', suggestion.moves[0]);
            // Execute the AI's suggested move
            setTimeout(() => this.executeAIMove(suggestion.moves[0]), 50);
        } else {
            console.log('❌ AI no suggestion');
        }
    }

    /**
     * Execute an AI move
     */
    executeAIMove(move) {
        if (!this.tetrisAI.isActive || !move || !move.location) {
            console.log('❌ AI executeAIMove skipped:', {
                aiActive: this.tetrisAI?.isActive,
                hasMove: !!move,
                hasLocation: !!move?.location
            });
            return;
        }

        console.log('🎮 AI executing move:', move);

        // For now, just do a simple hard drop
        const hardDropKey = this.settings.keybinds.hd;
        console.log('🔽 AI executing hard drop with key:', hardDropKey);
        
        if (hardDropKey && this.controls) {
            this.controls.handleKeyDown({ code: hardDropKey });
            console.log('✅ AI hard drop executed');
        } else {
            console.log('❌ AI could not execute hard drop - missing key or controls');
        }
    }

    /**
     * Calculate the sequence of moves needed to reach target position
     */
    calculateMoveSequence(current, target) {
        const moves = [];
        const targetX = target.x;
        const currentX = current.x;
        const targetRotation = target.orientation;
        const currentRotation = current.rotation;

        // Add rotation moves
        const rotationDiff = this.getRotationDifference(currentRotation, targetRotation);
        if (rotationDiff > 0) {
            for (let i = 0; i < rotationDiff; i++) {
                moves.push('cw');
            }
        } else if (rotationDiff < 0) {
            for (let i = 0; i < Math.abs(rotationDiff); i++) {
                moves.push('ccw');
            }
        }

        // Add horizontal movement
        const horizontalDiff = targetX - currentX;
        if (horizontalDiff > 0) {
            for (let i = 0; i < horizontalDiff; i++) {
                moves.push('right');
            }
        } else if (horizontalDiff < 0) {
            for (let i = 0; i < Math.abs(horizontalDiff); i++) {
                moves.push('left');
            }
        }

        // Add hard drop
        moves.push('hd');

        return moves;
    }

    /**
     * Get rotation difference between current and target orientation
     */
    getRotationDifference(current, target) {
        const orientations = { 'north': 0, 'east': 1, 'south': 2, 'west': 3 };
        const currentIdx = orientations[current] || 0;
        const targetIdx = orientations[target] || 0;
        
        let diff = targetIdx - currentIdx;
        
        // Normalize to shortest rotation path
        if (diff > 2) diff -= 4;
        if (diff < -2) diff += 4;
        
        return diff;
    }

    /**
     * Execute a sequence of moves with timing
     */
    executeMoveSequence(moveSequence) {
        if (moveSequence.length === 0) return;

        let currentIndex = 0;
        const executeNext = () => {
            if (currentIndex >= moveSequence.length || !this.tetrisAI.isActive) {
                return;
            }

            const move = moveSequence[currentIndex];
            const keycode = this.getMoveKeycode(move);
            
            if (keycode) {
                this.controls.handleKeyDown({ code: keycode });
            }

            currentIndex++;
            
            // Schedule next move with a small delay
            if (currentIndex < moveSequence.length) {
                setTimeout(executeNext, 50); // 50ms delay between moves
            }
        };

        executeNext();
    }

    /**
     * Get keycode for a move type
     */
    getMoveKeycode(move) {
        const keybinds = this.settings.keybinds;
        
        switch(move) {
            case 'left': return keybinds.left;
            case 'right': return keybinds.right;
            case 'cw': return keybinds.cw;
            case 'ccw': return keybinds.ccw;
            case '180': return keybinds.rotate180;
            case 'sd': return keybinds.sd;
            case 'hd': return keybinds.hd;
            case 'hold': return keybinds.hold;
            default: return null;
        }
    }
}
