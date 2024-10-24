import { spinChecks } from "../data/data.js";
import { Game } from "../game.js";

export class Movement {
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    firstMovement() {
        this.game.zenith.startZenithMode();
        this.game.grandmaster.startGrandmasterTimer();
        if(this.game.zenith.tickPass == 0 && this.game.settings.game.gamemode == "zenith") this.game.renderer.renderTimeLeft("FLOOR 1")
        this.game.started = true;
        this.game.mechanics.startGravity();
        this.game.modes.startSurvival();
        this.game.mechanics.locking.lockingResume();
        this.game.gameTimer = setInterval(() =>
            this.game.gameClock(), (1000 / this.game.tickrate)
        );
    }

    checkCollision(coords, action, collider) {
        collider = collider ?? this.game.board.getMinos("S");
        for (let [x, y] of coords) {
            if (
                (action == "RIGHT" && x > 8) ||
                (action == "LEFT" && x < 1) ||
                (action == "DOWN" && y < 1) ||
                (action == "ROTATE" && x < 0) ||
                x > 9 ||
                y < 0 ||
                (action == "PLACE" && y > 19)
            )
                return true;
            for (let [x2, y2] of collider) {
                const col = (dx, dy) => x + dx == x2 && y + dy == y2;
                if (
                    (action == "RIGHT" && col(1, 0)) ||
                    (action == "LEFT" && col(-1, 0)) ||
                    (action == "DOWN" && col(0, -1)) ||
                    ((action == "ROTATE" || action == "SPAWN") && col(0, 0))
                )
                    return true;
            }
        }
    }

    checkTspin(rotation, [x, y], [dx, dy]) {
        if (this.game.falling.piece.name != "t") return false;
        this.game.mechanics.isMini = false;
        const minos = spinChecks[(rotation + 1) % 4]
            .concat(spinChecks[rotation - 1])
            .map(([ddx, ddy]) => this.checkCollision([[ddx + x, ddy + y]], "ROTATE"));
        if (minos[2] && minos[3] && (minos[0] || minos[1])) return true;
        if ((minos[2] || minos[3]) && minos[0] && minos[1]) {
            if ((dx == 1 || dx == -1) && dy == -2) return true;
            this.game.mechanics.isMini = true;
            return true;
        }
    }

    checkAllspin(pieceCoords) {
        if (this.game.falling.piece.name == "t") return false;
        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        const validSpin = directions.every(([dx, dy]) =>
            this.checkCollision(pieceCoords.map(([x, y]) => [x + dx, y + dy]), "ROTATE"));
        if (validSpin && this.game.settings.game.allspinminis) this.game.mechanics.isMini = true;
        return validSpin;
    }

    rotate(type) {
        if (this.game.falling.piece.name == "o") return;
        const newRotation = this.game.falling.getRotateState(type);
        const kickdata = this.game.falling.getKickData(type, newRotation);
        const rotatingCoords = this.game.falling.getNewCoords(newRotation);
        const change = kickdata.find(([dx, dy]) =>
            !this.checkCollision(rotatingCoords.map(c => [c[0] + dx, c[1] + dy]), "ROTATE"));
        if (!change) return;
        this.game.board.MinoToNone("A");
        this.game.board.addMinos(this.game.falling.newName(), rotatingCoords, change);
        this.game.falling.updateLocation(change);
        this.game.mechanics.isTspin = this.checkTspin(newRotation, this.game.falling.location, change);
        this.game.mechanics.isAllspin = this.checkAllspin(this.game.board.getMinos("A"));
        this.game.falling.rotation = newRotation;
        this.game.mechanics.locking.incrementLock();
        this.game.stats.rotates++;
        this.game.sounds.playSound("rotate");
        this.game.mechanics.setShadow();
        if (this.game.settings.game.gravitySpeed == 0) this.game.mechanics.startGravity();
        this.game.controls.startArr("current");
        this.game.controls.checkSD();
        if (this.game.mechanics.isTspin || (this.game.mechanics.isAllspin && this.game.settings.game.allspin)) {
            this.game.renderer.rotateBoard(type);
            this.game.particles.spawnParticles(this.game.falling.location[0], this.game.falling.location[1] + 2,
                "spin", 5, type == "CW", this.game.falling.piece.colour);
                this.game.sounds.playSound("spin");
        }
    }

    movePieceSide(direction, max = 1) {
        this.game.controls.checkSD();
        const minos = this.game.board.getMinos("A");
        let amount = 0;
        const check = dx => !this.checkCollision(minos.map(([x, y]) => [x + dx, y]), direction);
        while (check(amount) && Math.abs(amount) < max) direction == "RIGHT" ? amount++ : amount--;
        if (!check(amount)) this.game.renderer.bounceBoard(direction);
        if (amount == 0) {
            this.game.controls.stopInterval("arr");
            return;
        }
        this.game.board.moveMinos(minos, "RIGHT", amount);
        this.game.falling.updateLocation([amount, 0]);
        this.game.mechanics.isTspin = false;
        this.game.mechanics.isAllspin = false;
        this.game.mechanics.isMini = false;
        this.game.mechanics.locking.incrementLock();
        this.game.sounds.playSound("move");
        this.game.mechanics.setShadow();
        this.game.controls.checkSD();
        if (this.game.settings.game.gravitySpeed == 0) this.game.mechanics.startGravity();
    }

    movePieceDown(sonic, scoring = false) {
        const minos = this.game.board.getMinos("A");
        if (this.checkCollision(minos, "DOWN")) return;
        this.game.board.moveMinos(minos, "DOWN", 1);

        this.game.mechanics.isTspin = false;
        this.game.mechanics.isAllspin = false;
        this.game.mechanics.isMini = false;
        this.game.falling.updateLocation([0, -1]);
        if (this.checkCollision(this.game.board.getMinos("A"), "DOWN")) {
            this.game.mechanics.locking.scheduleLock();
            this.game.renderer.bounceBoard("DOWN");
            this.game.controls.startArr("current");
        }
        if (scoring && sonic) this.game.stats.score += 1;
        if (sonic) this.movePieceDown(true, scoring);
    }

    harddrop() {
        const minos = this.game.board.getMinos("A");
        let amount = 0;
        while (!this.checkCollision(minos.map(([x, y]) => [x, y - amount]), "DOWN")) amount++;
        if (amount > 0) {
            this.game.mechanics.isTspin = false;
            this.game.mechanics.isAllspin = false;
            this.game.mechanics.isMini = false;
        }
        this.game.board.moveMinos(minos, "DOWN", amount);
        this.game.falling.updateLocation([0, -amount]);
        this.game.stats.score += 2 * amount;
        this.game.sounds.playSound("harddrop");
        this.game.renderer.bounceBoard('DOWN');
        const xvals = [...new Set(minos.map(([x, y]) => x))];
        this.game.particles.spawnParticles(Math.min(...xvals)+1, this.game.falling.location[1], "drop", xvals.length);
        this.game.mechanics.locking.lockPiece();
    }
}
