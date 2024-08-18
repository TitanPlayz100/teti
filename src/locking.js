// @ts-check

import { Game } from "./game";

export class LockPiece {
    divLockTimer = document.getElementById("lockTimer");
    divLockCounter = document.getElementById("lockCounter");


    /**
     * @param {Game} game
     */
    constructor(mechanics, game) {
        this.mechanics = mechanics;
        this.game = game;
    }

    incrementLock() {
        if (this.game.timeouts["lockdelay"] != 0) {
            this.mechanics.clearLockDelay(false);
            this.mechanics.mechanics.lockCount++;
            if (this.game.gameSettings.maxLockMovements != 0 && this.game.displaySettings.lockBar) {
                const amountToAdd = 100 / this.game.gameSettings.maxLockMovements;
                this.divLockCounter.value += amountToAdd;
            }
        }
        if (this.game.movement.checkCollision(this.mechanics.board.getMinos("A"), "DOWN"))
            this.mechanics.scheduleLock();
    }

    scheduleLock() {
        const LockMoves =
            this.game.gameSettings.maxLockMovements == 0
                ? 99999
                : this.game.gameSettings.maxLockMovements;
        if (this.mechanics.lockCount >= LockMoves) {
            this.mechanics.lockPiece();
            return;
        }
        if (this.game.gameSettings.lockDelay == 0) {
            this.game.timeouts["lockdelay"] = -1;
            return;
        }
        this.game.timeouts["lockdelay"] = setTimeout(
            () => this.mechanics.lockPiece(),
            this.game.gameSettings.lockDelay
        );
        this.game.timeouts["lockingTimer"] = setInterval(() => {
            const amountToAdd = 1000 / this.game.gameSettings.lockDelay;
            if (this.game.displaySettings.lockBar) this.divLockTimer.value += amountToAdd;
        }, 10);
    }

    lockPiece() {
        this.mechanics.board.getMinos("A").forEach(c => {
            this.mechanics.board.rmValue(c, "A");
            this.mechanics.board.addValFront(c, "S");
        });
        endGame(
            this.mechanics.checkDeath(
                this.mechanics.board.getMinos("S"),
                this.mechanics.board.getMinos("NP")
            )
        );
        this.mechanics.clearLockDelay();
        clearInterval(this.game.timeouts["gravity"]);
        this.mechanics.clear.clearLines();
        this.mechanics.totalPieceCount++;
        this.game.holdPiece.occured = false;
        this.mechanics.isTspin = false;
        this.mechanics.isMini = false;
        this.game.movedPieceFirst = false;
        this.mechanics.spawnPiece(this.mechanics.randomiser());
        this.mechanics.startGravity();
        this.game.rendering.renderDanger();
    }

    clearLockDelay(clearCount = true) {
        clearInterval(this.game.timeouts["lockingTimer"]);
        this.game.utils.stopTimeout("lockdelay");
        this.divLockTimer.value = 0;
        if (!clearCount) return;
        this.divLockCounter.value = 0;
        this.mechanics.lockCount = 0;
        if (this.game.gameSettings.preserveARR) return;
        this.game.movement.resetMovements();
    }
}
