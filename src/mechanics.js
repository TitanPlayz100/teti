// @ts-check

import { Game } from "./game.js";
import { ClearLines } from "./clearlines.js";
import { LockPiece } from "./locking.js";
import pieces from "./data/pieces.json" with { type: "json" };
import { Bag } from "./bag.js";

export class Mechanics {
    garbRowsLeft;
    isTspin;
    isMini;
    combonumber;
    btbCount;
    maxCombo;
    totalAttack;
    spikeCounter;
    totalLines;
    totalScore;
    garbageQueue;
    lockCount;
    totalSentLines;
    totalPieceCount;
    board;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;
        this.clear = new ClearLines(this, this.game.sounds); 
        this.Locking = new LockPiece(this, game);
    }

    checkDeath(coords, collider) {
        const collision = coords.every(c => this.game.movement.checkCollision([c], "PLACE", []));
        const collision2 = this.game.movement.checkCollision(coords, "SPAWN", collider);
        const isGarbage = collider.some(c => this.board.checkMino(c, "G"));
        if (collision && this.game.gameSettings.allowLockout) return "Lockout";
        if (collision2 && isGarbage) return "Topout";
        if (collision2) return "Blockout";
    }

    spawnPiece(piece, start = false) {
        if (this.game.gameEnd) return;
        const dx = piece.name == "o" ? 4 : 3;
        const dy = piece.name == "o" ? 21 : piece.name == "i" ? 19 : 20;
        this.board.addMinos("A " + piece.name, this.board.pieceToCoords(piece.shape1), [dx, dy]);
        this.game.currentLoc = [dx, dy];
        this.game.movement.rotationState = 1;
        this.game.currentPiece = piece;
        this.spawnOverlay();
        this.game.rendering.updateNext();
        this.game.rendering.updateHold();
        this.setShadow();
        const rows =
            this.game.gameSettings.requiredGarbage < 10
                ? this.game.gameSettings.requiredGarbage
                : 10;
        if (this.garbRowsLeft > 0 && start && this.game.gameSettings.gamemode == 4)
            this.addGarbage(rows);
        if (this.game.gameSettings.gamemode == 7) this.board.setComboBoard(start);
        if (this.game.gameSettings.preserveARR) this.game.movement.startArr("current");
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
        if (this.game.movement.checkCollision(this.board.getMinos("A"), "DOWN"))
            this.Locking.incrementLock();
        if (this.game.gameSettings.gravitySpeed > 1000) return;
        if (this.game.gameSettings.gravitySpeed == 0) {
            this.game.movement.movePieceDown(true);
            return;
        }
        this.game.movement.movePieceDown(false);
        this.game.timeouts["gravity"] = setInterval(
            () => this.game.movement.movePieceDown(false),
            this.game.gameSettings.gravitySpeed
        );
    }

    addGarbage(lines, messiness = 100) {
        let randCol = Math.floor(Math.random() * 10);
        for (let i = 0; i < lines; i++) {
            if (this.game.movement.checkCollision(this.board.getMinos("A"), "DOWN")) {
                if (this.game.timeouts["lockdelay"] == 0) this.Locking.incrementLock();
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
        this.totalSentLines += lines;
    }

    switchHold() {
        if (this.game.holdPiece.occured) return;
        this.Locking.clearLockDelay();
        this.board.MinoToNone("A");
        this.isTspin = false;
        this.isMini = false;
        if (this.game.holdPiece.piece == null) {
            this.game.holdPiece.piece = this.game.currentPiece;
            this.spawnPiece(this.game.bag.randomiser());
        } else {
            [this.game.holdPiece.piece, this.game.currentPiece] = [
                this.game.currentPiece,
                this.game.holdPiece.piece,
            ];
            this.spawnPiece(this.game.currentPiece);
        }
        if (this.checkDeath(this.board.getMinos("A"), this.board.getMinos("S")) == "Blockout") {
            this.game.endGame("Blockout");
            return;
        }
        if (!this.game.gameSettings.infiniteHold) this.game.holdPiece.occured = true;
        this.game.sounds.playSound("hold");
        this.game.rendering.renderDanger();
        clearInterval(this.game.timeouts["gravity"]);
        this.startGravity();
        this.game.rendering.updateHold();
    }
}
