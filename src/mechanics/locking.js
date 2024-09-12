import { Game } from "../game.js";
import { Mechanics } from "./mechanics.js";

export class LockPiece {
    divLockTimer = document.getElementById("lockTimer");
    divLockCounter = document.getElementById("lockCounter");
    lockCount;
    timings = { lockdelay: 0, lockingTimer: 0 }

    /**
     * @param {Game} game
     * @param {Mechanics} mechanics
     */
    constructor(mechanics, game) {
        this.mechanics = mechanics;
        this.game = game;
    }

    incrementLock() {
        if (this.timings.lockdelay != 0) {
            this.lockCount++;
            this.mechanics.locking.clearLockDelay(false);
            if (this.game.settings.game.maxLockMovements != 0 && this.game.settings.display.lockBar) {
                const amountToAdd = 100 / this.game.settings.game.maxLockMovements;
                this.divLockCounter.value += amountToAdd;
            }
        }
        if (this.game.movement.checkCollision(this.mechanics.board.getMinos("A"), "DOWN")) {
            this.mechanics.locking.scheduleLock();
        }
    }

    scheduleLock() {
        const LockMoves =
            this.game.settings.game.maxLockMovements == 0
                ? Infinity
                : this.game.settings.game.maxLockMovements;
        if (this.lockCount >= LockMoves) {
            this.mechanics.locking.lockPiece();
            return;
        }
        if (this.game.settings.game.lockDelay == 0) {
            this.timings.lockdelay = -1;
            return;
        }
        this.timings.lockdelay = setTimeout(
            () => this.mechanics.locking.lockPiece(),
            this.game.settings.game.lockDelay
        );
        this.timings.lockingTimer = setInterval(() => {
            const amountToAdd = 1000 / this.game.settings.game.lockDelay;
            if (this.game.settings.display.lockBar) this.divLockTimer.value += amountToAdd;
        }, 10);

    }

    lockPiece() {
        this.mechanics.board.getMinos("A").forEach(([x, y]) => {
            this.mechanics.board.rmValue([x, y], "A");
            this.mechanics.board.addValFront([x, y], "S");
        });
        this.game.endGame(
            this.mechanics.checkDeath(
                this.mechanics.board.getMinos("S"),
                this.mechanics.board.getMinos("NP")
            )
        );
        this.mechanics.locking.clearLockDelay();
        clearInterval(this.mechanics.gravityTimer);
        this.mechanics.clear.clearLines();
        this.game.stats.pieceCount++;
        this.game.hold.occured = false;
        this.mechanics.isTspin = false;
        this.mechanics.isAllspin = false;
        this.mechanics.isMini = false;
        this.game.falling.moved = false;
        if(this.game.stats.level % 100 != 99 && this.game.stats.level != this.game.settings.game.raceTarget - 1 )  this.game.stats.level++;
        this.mechanics.spawnPiece(this.game.bag.randomiser());
        this.game.history.save();
        this.game.rendering.renderDanger();
    }

    clearLockDelay(clearCount = true) {
        clearInterval(this.timings.lockingTimer);
        this.stopTimeout("lockdelay");
        this.divLockTimer.value = 0;
        if (!clearCount) return;
        this.divLockCounter.value = 0;
        this.lockCount = 0;
        if (this.game.settings.game.preserveARR) return;
        this.game.controls.resetMovements();
    }

    stopTimeout(name) {
        clearTimeout(this.timings[name]);
        this.timings[name] = 0;
    }

    stopInterval(name) {
        clearInterval(this.timings[name]);
        this.timings[name] = 0;
    }

}
