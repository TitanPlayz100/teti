import { Game } from "../main.js";
import { TetiTimer } from "../movement/tetitimers.js";

export class LockPiece {
    divLockTimer = document.getElementById("lockTimer");
    divLockCounter = document.getElementById("lockCounter");
    lockCount = 999;
    /**@type {TetiTimer} */
    lockTimer;
    /**@type {TetiTimer} */
    clearTimer;
    isLocking = false;
    startTime = 0;
    remaining = 0;

    incrementLock() {
        if (this.isLocking) {
            this.lockCount++;
            Game.locking.clearLockDelay(false);
            if (Game.settings.game.maxLockMovements != 0 && Game.settings.display.lockBar) {
                const amountToAdd = 100 / Game.settings.game.maxLockMovements;
                this.divLockCounter.value += amountToAdd;
            }
        }
        if (Game.movement.checkCollision(Game.board.getMinos("A"), "DOWN")) {
            Game.locking.scheduleLock();
        }
    }

    scheduleLock() {
        const LockMoves =
            Game.settings.game.maxLockMovements == 0
                ? Infinity
                : Game.settings.game.maxLockMovements;
        if (this.lockCount >= LockMoves) {
            Game.locking.lockPiece();
            return;
        }
        if (Game.settings.game.lockDelay == 0) return;

        this.lockDelayStart();
    }

    lockDelayStart() {
        this.lockTimer.reset();
        this.isLocking = true;
    }

    tickLockTimer(dt) {
        if (!this.isLocking || !Game.settings.display.lockBar) return;
        const dx = dt * 100 / Game.settings.game.lockDelay;
        this.divLockTimer.value += dx;
        this.lockTimer.tick(dt);
    }

    lockingPause() {
        this.isLocking = false;
    }

    lockingResume() {
        if (this.lockTimer.progress == 0) return;
        this.isLocking = true;
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

        Game.locking.clearLockDelay();
        Game.gravityTimer.reset()
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

        const delay = (cleared > 0) ? Game.settings.game.clearDelay : 0;

        if (delay == 0) {
            Game.mechanics.spawnPiece(Game.bag.cycleNext());
            Game.history.save();
        } else {
            this.clearTimer.reset();
            this.clearTimer.startAuto();
        }
    }

    clearLockDelay(clearCount = true) {
        this.isLocking = false;
        this.lockTimer.reset();

        this.divLockTimer.value = 0;
        if (!clearCount) return;
        this.divLockCounter.value = 0;
        this.lockCount = 0;
        if (Game.settings.game.preserveARR) return;
        Game.controls.resetMovements();
    }
}
