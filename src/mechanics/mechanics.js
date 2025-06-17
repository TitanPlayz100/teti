import { Game } from "../main.js";
import { ClearLines } from "./clearlines.js";
import { LockPiece } from "./locking.js";
import { PerlinNoise } from "./perlin.js";

export class Mechanics {
    board;
    isTspin = false;
    isAllspin = false;
    isMini = false;
    spikeCounter = 0;
    toppingOut = false;

    curGarbageCol;
    garbageMessiness = 100;

    constructor() {
        this.clear = new ClearLines();
        this.locking = new LockPiece();
        this.perlin = new PerlinNoise(1, 0.2);
    }

    checkDeath(coords, collider) {
        if (coords.length == 0) return;
        const collision = coords.every(c => Game.movement.checkCollision([c], "PLACE", []));
        const collision2 = Game.movement.checkCollision(coords, "SPAWN", collider);
        const isGarbage = collider.some(c => Game.board.checkMino(c, "G"));
        if (collision && Game.settings.game.allowLockout) return "Lockout";
        if (collision2 && isGarbage) return "Topout";
        if (collision2) return "Blockout";
    }

    deathAlert() {
        const check = this.checkDeath(Game.board.getMinos('Sh'), Game.board.getMinos('NP'));
        const check2 = this.checkDeath(Game.board.getMinos('G'), Game.board.getMinos('NP'));
        if (!!(check || check2)) {
            if (this.toppingOut) return;
            Game.sounds.playSound('hyperalert');
            this.toppingOut = true;
            Game.animations.flashWarning(true);
        } else {
            this.toppingOut = false;
            Game.animations.flashWarning(false);
        }
    }

    spawnPiece(piece, start = false) {
        if (Game.ended) return;
        Game.falling.spawn(piece);
        this.spawnOverlay();
        Game.renderer.updateNext();
        Game.renderer.updateHold();
        this.setShadow();
        this.locking.incrementLock();
        Game.modes.diggerGarbageSet(start);
        Game.modes.set4WCols(start);
        if (Game.settings.game.preserveARR) Game.controls.startArr("current");
        if (Game.started) this.startGravity();
        if (start == true && Game.settings.game.readysetgo) Game.movement.startCountdown();
    }

    spawnOverlay() {
        Game.board.MinoToNone("NP");
        const next = Game.bag.getFirstN(1)[0];
        const x = next.name == "o" ? 4 : 3;
        const y = next.name == "o" ? 21 : next.name == "i" ? 19 : 20;
        Game.board.pieceToCoords(next.shape1, [x, y]).forEach(([x, y]) => Game.board.addValue([x, y], "NP"));
    }

    setShadow() {
        Game.board.MinoToNone("Sh");
        const coords = Game.board.getMinos("A");
        if (coords.length == 0) return;
        coords.forEach(([x, y]) => Game.board.addValue([x, y], "Sh"));
        let count = 0;
        const shadow = Game.board.getMinos("Sh");
        while (!Game.movement.checkCollision(shadow.map(c => [c[0], c[1] - count]), "DOWN"))
            count++;
        Game.board.moveMinos(shadow, "DOWN", count, "Sh");
        this.deathAlert();
    }

    startGravity() {
        clearInterval(Game.gravityTimer);
        if (Game.settings.game.gravitySpeed > 1000) return;
        if (Game.settings.game.gravitySpeed == 0) {
            Game.movement.movePieceDown(true);
            return;
        }
        Game.movement.movePieceDown(false);
        Game.gravityTimer = setInterval(
            () => Game.movement.movePieceDown(false),
            Game.settings.game.gravitySpeed
        );
    }

    addGarbage(lines) {
        // switch col depending on messiness
        let switchColumn = Math.floor(Math.random() * 100) < this.garbageMessiness;
        if (this.curGarbageCol == undefined || switchColumn) {
            this.curGarbageCol = Math.floor(Math.random() * 10);
        }

        for (let i = 0; i < lines; i++) {
            const col = this.curGarbageCol;
            this.addSingleGarbageLine(col);
        }

        this.setShadow();
        if (lines >= 8) Game.sounds.playSound("garbagesmash");
        else Game.sounds.playSound("garbagerise");
    }

    addSingleGarbageLine(column) {
        const allminos = Game.board.getMinos("A"); // move all minos up
        if (Game.movement.checkCollision(allminos, "DOWN")) {
            if (this.locking.timings.lockdelay == 0) this.locking.scheduleLock();
            Game.board.moveMinos(allminos, "UP", 1);
        }

        Game.board.moveMinos(Game.board.getMinos("S"), "UP", 1);
        for (let col = 0; col < 10; col++) {
            if (col != column) Game.board.addMinos("S G", [[col, 0]], [0, 0]);
        }
    }

    switchHold() {
        if (Game.hold.occured || !Game.settings.game.allowHold) return;
        this.locking.clearLockDelay();
        Game.board.MinoToNone("A");
        this.isTspin = false;
        this.isAllspin = false;
        this.isMini = false;
        Game.stats.holds++;
        if (Game.hold.piece == null) {
            Game.hold.setHold();
            this.spawnPiece(Game.bag.cycleNext());
        } else {
            Game.hold.swapHold();
            this.spawnPiece(Game.falling.piece);
        }
        if (this.checkDeath(Game.board.getMinos("A"), Game.board.getMinos("S")) == "Blockout") {
            Game.endGame("Blockout");
            return;
        }
        if (!Game.settings.game.infiniteHold) Game.hold.occured = true;
        Game.sounds.playSound("hold");
        Game.renderer.renderDanger();
        this.startGravity();
        Game.renderer.updateHold();
    }

    attackCaps = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 5]
    sendMeter = 0;
    simulateGarbage(time) {
        if (Game.settings.game.gamemode != "zenith") return;
        if (time % (Game.tickrate / 2) != 0) return; // 0.5s clock
        const floor = Game.zenith.GetFloorLevel(Game.zenith.altitude);

        const val = this.perlin.getVal(time / Game.tickrate) - (0.6 - floor * 0.02);
        if (val > 0) this.sendMeter += val

        this.perlin.amplitude = 1.1 + (floor * 0.05);
        const maxAttack = this.attackCaps[floor];

        if (this.sendMeter >= 4) {
            const attack = Math.ceil(Math.random() * maxAttack);
            Game.garbage.addGarbageQueue(attack);
            this.sendMeter = 0
        }
    }
}
