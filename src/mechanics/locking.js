import { Game } from "../game.js";

export class LockPiece {
    divLockTimer = document.getElementById("lockTimer");
    divLockCounter = document.getElementById("lockCounter");
    lockCount;
    timings = { lockdelay: 0, lockingTimer: 0, clearDelay: 0 }

    startTime = 0;
    remaining = 0;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    incrementLock() {
        if (this.timings.lockdelay != 0) {
            this.lockCount++;
            this.game.mechanics.locking.clearLockDelay(false);
            if (this.game.settings.game.maxLockMovements != 0 && this.game.settings.display.lockBar) {
                const amountToAdd = 100 / this.game.settings.game.maxLockMovements;
                this.divLockCounter.value += amountToAdd;
            }
        }
        if (this.game.movement.checkCollision(this.game.mechanics.board.getMinos("A"), "DOWN")) {
            this.game.mechanics.locking.scheduleLock();
        }
    }

    scheduleLock() {
        const LockMoves =
            this.game.settings.game.maxLockMovements == 0
                ? Infinity
                : this.game.settings.game.maxLockMovements;
        if (this.lockCount >= LockMoves) {
            this.game.mechanics.locking.lockPiece();
            return;
        }
        if (this.game.settings.game.lockDelay == 0) return;

        this.lockDelayStart(this.game.settings.game.lockDelay);
    }

    lockDelayStart(delay) {
        clearTimeout(this.timings.lockdelay);
        clearInterval(this.timings.lockingTimer);
        this.startTime = Date.now();
        this.timings.lockdelay = setTimeout(
            () => this.game.mechanics.locking.lockPiece(),
            delay);
        this.timings.lockingTimer = setInterval(() => {
            const amountToAdd = 1000 / this.game.settings.game.lockDelay;
            if (this.game.settings.display.lockBar) this.divLockTimer.value += amountToAdd;
        }, 10);
    }

    lockingPause() {
        if (this.timings.lockdelay == 0) return;
        this.remaining = this.game.settings.game.lockDelay - (Date.now() - this.startTime);
        clearTimeout(this.timings.lockdelay);
        clearInterval(this.timings.lockingTimer);
    }

    lockingResume() {
        if (this.timings.lockdelay == 0) return;
        this.lockDelayStart(this.remaining);
    }

    lockPiece() {
        const lockCoords = this.game.mechanics.board.getMinos("A");
        this.game.pixi.justPlacedCoords = lockCoords;
        this.game.pixi.justPlacedAlpha = 1;

        lockCoords.forEach(([x, y]) => {
            this.game.mechanics.board.rmValue([x, y], "A");
            this.game.mechanics.board.addValFront([x, y], "S");
        });
        this.game.pixi.flash(lockCoords);

        this.game.mechanics.locking.clearLockDelay();
        clearInterval(this.game.gravityTimer);
        const cleared = this.game.mechanics.clear.clearLines(lockCoords);
        this.game.endGame( // check stopped overlap next
            this.game.mechanics.checkDeath(
                this.game.mechanics.board.getMinos("S"),
                this.game.mechanics.board.getMinos("NP")
            )
        );
        this.game.endGame( // check lockout
            this.game.mechanics.checkDeath(
                lockCoords,
                this.game.mechanics.board.getMinos("NP")
            )
        );
        this.game.stats.pieceCount++;
        this.game.hold.occured = false;
        this.game.mechanics.isTspin = false;
        this.game.mechanics.isAllspin = false;
        this.game.mechanics.isMini = false;
        this.game.falling.moved = false;
        if (this.game.stats.tgm_level % 100 != 99 && this.game.stats.tgm_level != this.game.settings.game.raceTarget - 1) this.game.stats.tgm_level++;


        const xvals = [...new Set(lockCoords.map(([x, y]) => x))];
        const yval = Math.min(...lockCoords.map(([x, y]) => y));
        this.game.particles.spawnParticles(Math.min(...xvals), yval, "lock", xvals.length);
        this.game.renderer.renderDanger();

        const delay = (cleared > 0) ? this.game.settings.game.clearDelay : 0;
        const onClear = () => {
            this.game.mechanics.spawnPiece(this.game.bag.cycleNext());
            this.game.history.save();
            this.timings.clearDelay = 0;
        }
        if (delay == 0) onClear();
        else this.timings.clearDelay = setTimeout(() => onClear(), delay);
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
}
