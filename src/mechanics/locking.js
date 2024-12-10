import { Game } from "../main.js";

export class LockPiece {
    divLockTimer = document.getElementById("lockTimer");
    divLockCounter = document.getElementById("lockCounter");
    lockCount;
    timings = { lockdelay: 0, lockingTimer: 0, clearDelay: 0 }

    startTime = 0;
    remaining = 0;

    incrementLock() {
        if (this.timings.lockdelay != 0) {
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
        clearTimeout(this.timings.lockdelay);
        clearInterval(this.timings.lockingTimer);
        this.startTime = Date.now();
        this.timings.lockdelay = setTimeout(
            () => Game.mechanics.locking.lockPiece(),
            delay);
        this.timings.lockingTimer = setInterval(() => {
            const amountToAdd = 1000 / Game.settings.game.lockDelay;
            if (Game.settings.display.lockBar) this.divLockTimer.value += amountToAdd;
        }, 10);
    }

    lockingPause() {
        if (this.timings.lockdelay == 0) return;
        this.remaining = Game.settings.game.lockDelay - (Date.now() - this.startTime);
        clearTimeout(this.timings.lockdelay);
        clearInterval(this.timings.lockingTimer);
    }

    lockingResume() {
        if (this.timings.lockdelay == 0) return;
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
        clearInterval(Game.gravityTimer);
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
        const onClear = () => {
            Game.mechanics.spawnPiece(Game.bag.cycleNext());
            Game.history.save();
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
        if (Game.settings.game.preserveARR) return;
        Game.controls.resetMovements();
    }

    stopTimeout(name) {
        clearTimeout(this.timings[name]);
        this.timings[name] = 0;
    }
}
