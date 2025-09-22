import { Game } from "../main.js";
import { TetiTimeout } from "../movement/tetitimers.js";

export class LockPiece {
    divLockTimer = document.getElementById("lockTimer");
    divLockCounter = document.getElementById("lockCounter");
    lockCount;
    /**@type {?TetiTimeout} */
    lockdelay = null
    /**@type {?TetiTimeout} */
    clearDelay = null
    isLocking = false;

    startTime = 0;
    remaining = 0;

    incrementLock() {
        if (this.lockdelay != null) {
            this.lockCount++;
            Game.mechanics.locking.clearLockDelay(false);
            if (Game.settings.game.maxLockMovements != 0 && Game.settings.display.lockBar) {
                const amountToAdd = 100 / Game.settings.game.maxLockMovements;
                this.divLockCounter.value += amountToAdd;
            }
        }
        if (Game.movement.checkCollision(Game.board.getMinos("A"), "DOWN")) {
            Game.mechanics.locking.scheduleLock();
        }
    }

    scheduleLock() {
        const LockMoves =
            Game.settings.game.maxLockMovements == 0
                ? Infinity
                : Game.settings.game.maxLockMovements;
        if (this.lockCount >= LockMoves) {
            Game.mechanics.locking.lockPiece();
            return;
        }
        if (Game.settings.game.lockDelay == 0) return;

        this.lockDelayStart(Game.settings.game.lockDelay);
    }

    lockDelayStart(delay) {
        if (this.lockdelay != null) this.lockdelay.stopAuto();
        this.isLocking = false;

        this.startTime = Date.now();
        this.lockdelay = new TetiTimeout(
            () => Game.mechanics.locking.lockPiece(),
            delay);
        if (!Game.replay.seeking) this.lockdelay.startAuto();
        this.isLocking = true;
    }

    tickLockTimer(dt) {
        if (!this.isLocking || !Game.settings.display.lockBar) return;
        const dx = dt * 100 / Game.settings.game.lockDelay;
        this.divLockTimer.value += dx;
    }

    lockingPause() {
        if (this.lockdelay == null) return;
        this.remaining = Game.settings.game.lockDelay - (Date.now() - this.startTime);
        this.lockdelay.stopAuto();
        this.isLocking = false;
    }

    lockingResume() {
        if (this.lockdelay == null) return;
        this.lockDelayStart(this.remaining);
    }

    lockPiece() {
        const lockCoords = Game.board.getMinos("A");
        Game.pixi.justPlacedCoords = lockCoords;
        Game.pixi.justPlacedAlpha = 1;

        lockCoords.forEach(([x, y]) => {
            Game.board.rmValue([x, y], "A");
            Game.board.addValFront([x, y], "S");
        });
        Game.pixi.flash(lockCoords);

        Game.mechanics.locking.clearLockDelay();
        if (Game.gravityTimer) Game.gravityTimer.stopAuto()
        const cleared = Game.mechanics.clear.clearLines(lockCoords);
        Game.endGame( // check stopped overlap next
            Game.mechanics.checkDeath(
                Game.board.getMinos("S"),
                Game.board.getMinos("NP")
            )
        );
        Game.endGame( // check lockout
            Game.mechanics.checkDeath(
                lockCoords,
                Game.board.getMinos("NP")
            )
        );
        Game.stats.pieceCount++;
        Game.hold.occured = false;
        Game.mechanics.isTspin = false;
        Game.mechanics.isAllspin = false;
        Game.mechanics.isMini = false;
        Game.falling.moved = false;
        if (Game.stats.tgm_level % 100 != 99 && Game.stats.tgm_level != Game.settings.game.raceTarget - 1) Game.stats.tgm_level++;

        const xvals = [...new Set(lockCoords.map(([x, y]) => x))];
        const yval = Math.min(...lockCoords.map(([x, y]) => y));
        Game.particles.spawnParticles(Math.min(...xvals), yval, "lock", xvals.length);
        Game.renderer.renderDanger();

        const isPC = Game.board.getMinos("S").length == 0;
        const doNewPuzzle = isPC && Game.settings.game.gamemode === 'puzzle';
        const delay = doNewPuzzle ? 500 : (cleared > 0) ? Game.settings.game.clearDelay : 0;

        const onClear = () => {
            if (doNewPuzzle) {
                Game.animations.resetAnimation();
            } else {
                Game.mechanics.spawnPiece(Game.bag.cycleNext());
            }
            Game.history.save();
            this.clearDelay = null;
        }

        if (delay == 0) onClear();
        else {
            this.clearDelay = new TetiTimeout(() => onClear(), delay)
            if (!Game.replay.seeking) this.clearDelay.startAuto();
        }
    }

    clearLockDelay(clearCount = true) {
        this.isLocking = false;
        if (this.lockdelay != null) {
            this.lockdelay.stopAuto()
            this.lockdelay = null;
        }

        this.divLockTimer.value = 0;
        if (!clearCount) return;
        this.divLockCounter.value = 0;
        this.lockCount = 0;
        if (Game.settings.game.preserveARR) return;
        Game.controls.resetMovements();
    }
}
