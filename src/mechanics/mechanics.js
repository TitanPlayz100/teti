import { Game } from "../game.js";
import { ClearLines } from "./clearlines.js";
import { LockPiece } from "./locking.js";
import pieces from "../data/pieces.json" with { type: "json" };

export class Mechanics {
    board;
    isTspin;
    isAllspin;
    isMini;
    combonumber;
    garbageQueue;
    spikeCounter;
    gravityTimer = 0;
    

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;
        this.clear = new ClearLines(this, game); 
        this.locking = new LockPiece(this, game);
    }

    checkDeath(coords, collider) {
        const collision = coords.every(c => this.game.movement.checkCollision([c], "PLACE", []));
        const collision2 = this.game.movement.checkCollision(coords, "SPAWN", collider);
        const isGarbage = collider.some(c => this.board.checkMino(c, "G"));
        if (collision && this.game.settings.game.allowLockout) return "Lockout";
        if (collision2 && isGarbage) return "Topout";
        if (collision2) return "Blockout";
    }

    spawnPiece(piece, start = false) {
        if (this.game.ended) return;
        this.game.falling.spawn(piece);
        this.spawnOverlay();
        this.game.rendering.updateNext();
        this.game.rendering.updateHold();
        this.setShadow();
        this.locking.incrementLock();
        const rows =
            this.game.settings.game.requiredGarbage < 10
                ? this.game.settings.game.requiredGarbage
                : 10;
        if (this.game.stats.getRemainingGarbage() > 0 && start && this.game.settings.game.gamemode == 4)
            this.addGarbage(rows);
        if (this.game.settings.game.gamemode == 7) this.board.setComboBoard(start);
        if (this.game.settings.game.preserveARR) this.game.controls.startArr("current");
        if (this.game.started) this.startGravity();
    }

    spawnOverlay() {
        this.board.MinoToNone("NP");
        const next = pieces.filter(
            p => p.name == this.game.bag.firstNextPiece()
        )[0];
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
        while (
            !this.game.movement.checkCollision(
                shadow.map(c => [c[0], c[1] - count]),
                "DOWN"
            )
        )
            count++;
        this.board.moveMinos(shadow, "DOWN", count, "Sh");
    }

    startGravity() {
        clearInterval(this.gravityTimer);
        if (this.game.settings.game.gravitySpeed > 1000) return;
        if (this.game.settings.game.gravitySpeed == 0) {
            this.game.movement.movePieceDown(true);
            return;
        }
        this.game.movement.movePieceDown(false);
        this.gravityTimer = setInterval(
            () => this.game.movement.movePieceDown(false),
            this.game.settings.game.gravitySpeed
        );
    }

    addGarbage(lines, messiness = 100) {
        let randCol = Math.floor(Math.random() * 10);
        for (let i = 0; i < lines; i++) {
            if (this.game.movement.checkCollision(this.board.getMinos("A"), "DOWN")) {
                if (this.locking.timings.lockdelay == 0) this.locking.incrementLock();
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
        this.game.stats.sent += lines;
    }

    switchHold() {
        if (this.game.hold.occured) return;
        this.locking.clearLockDelay();
        this.board.MinoToNone("A");
        this.isTspin = false;
        this.isAllspin = false;
        this.isMini = false;
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
        this.game.rendering.renderDanger();
        this.startGravity();
        this.game.rendering.updateHold();
    }
}
