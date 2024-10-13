import { Game } from "../game.js";
import { ClearLines } from "./clearlines.js";
import { LockPiece } from "./locking.js";

export class Mechanics {
    board;
    isTspin = false;
    isAllspin = false;
    isMini = false;
    garbageQueue = 0;
    spikeCounter = 0;
    toppingOut = false; 
    zenithTimer = 0;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;
        this.clear = new ClearLines(game);
        this.locking = new LockPiece(game);
    }

    checkDeath(coords, collider) {
        if (coords.length == 0) return;
        const collision = coords.every(c => this.game.movement.checkCollision([c], "PLACE", []));
        const collision2 = this.game.movement.checkCollision(coords, "SPAWN", collider);
        const isGarbage = collider.some(c => this.board.checkMino(c, "G"));
        if (collision && this.game.settings.game.allowLockout) return "Lockout";
        if (collision2 && isGarbage) return "Topout";
        if (collision2) return "Blockout";
    }

    deathAlert() {
        const check = this.checkDeath(this.board.getMinos('Sh'), this.board.getMinos('NP'));
        const check2 = this.checkDeath(this.board.getMinos('G'), this.board.getMinos('NP'));
        const warn = document.getElementById('warningText');
        if (!!(check || check2)) {
            if (this.toppingOut) return;
            this.game.sounds.playSound('hyperalert');
            this.toppingOut = true;
            warn.classList.toggle('warn', true);
        } else {
            this.toppingOut = false;
            warn.classList.toggle('warn', false);
        }
    }

    spawnPiece(piece, start = false) {
        if (this.game.ended) return;
        this.game.falling.spawn(piece);
        this.spawnOverlay();
        this.game.renderer.updateNext();
        this.game.renderer.updateHold();
        this.setShadow();
        this.locking.incrementLock();
        this.game.modes.diggerGarbageSet(start);
        this.game.modes.set4WCols(start);
        if (this.game.settings.game.preserveARR) this.game.controls.startArr("current");
        if (this.game.started) this.startGravity();
    }

    spawnOverlay() {
        this.board.MinoToNone("NP");
        const next = this.game.bag.nextPiece();
        const x = next.name == "o" ? 4 : 3;
        const y = next.name == "o" ? 21 : next.name == "i" ? 19 : 20;
        this.board.pieceToCoords(next.shape1, [x, y]).forEach(([x, y]) => this.board.addValue([x, y], "NP"));
    }

    setShadow() {
        this.board.MinoToNone("Sh");
        const coords = this.board.getMinos("A");
        if (coords.length == 0) return;
        coords.forEach(([x, y]) => this.board.addValue([x, y], "Sh"));
        let count = 0;
        const shadow = this.board.getMinos("Sh");
        while (!this.game.movement.checkCollision(shadow.map(c => [c[0], c[1] - count]), "DOWN"))
            count++;
        this.board.moveMinos(shadow, "DOWN", count, "Sh");
        this.deathAlert();
    }

    startGravity() {
        clearInterval(this.game.gravityTimer);
        if (this.game.settings.game.gravitySpeed > 1000) return;
        if (this.game.settings.game.gravitySpeed == 0) {
            this.game.movement.movePieceDown(true);
            return;
        }
        this.game.movement.movePieceDown(false);
        this.game.gravityTimer = setInterval(
            () => this.game.movement.movePieceDown(false),
            this.game.settings.game.gravitySpeed
        );
    }

    addGarbage(lines, messiness = 100) {
        let randCol = Math.floor(Math.random() * 10);
        for (let i = 0; i < lines; i++) {
            if (this.game.movement.checkCollision(this.board.getMinos("A"), "DOWN")) {
                if (this.locking.timings.lockdelay == 0) this.locking.scheduleLock();
                this.board.moveMinos(this.board.getMinos("A"), "UP", 1);
            }
            this.board.moveMinos(this.board.getMinos("S"), "UP", 1);
            const mustchange = Math.floor(Math.random() * 100);
            if (mustchange < messiness) randCol = Math.floor(Math.random() * 10);
            for (let col = 0; col < 10; col++) {
                if (col != randCol) this.board.addMinos("S G", [[col, 0]], [0, 0]);
            }
        }
        this.setShadow();
    }

    switchHold() {
        if (this.game.hold.occured || !this.game.settings.game.allowHold) return;
        this.locking.clearLockDelay();
        this.board.MinoToNone("A");
        this.isTspin = false;
        this.isAllspin = false;
        this.isMini = false;
        this.game.stats.holds++;
        if (this.game.hold.piece == null) {
            this.game.hold.setHold();
            this.spawnPiece(this.game.bag.randomiser());
        } else {
            this.game.hold.swapHold();
            this.spawnPiece(this.game.falling.piece);
        }
        if (this.checkDeath(this.board.getMinos("A"), this.board.getMinos("S")) == "Blockout") {
            this.game.endGame("Blockout");
            return;
        }
        if (!this.game.settings.game.infiniteHold) this.game.hold.occured = true;
        this.game.sounds.playSound("hold");
        this.game.renderer.renderDanger();
        this.startGravity();
        this.game.renderer.updateHold();
    }
}
