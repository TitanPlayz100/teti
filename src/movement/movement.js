import { spinChecks } from "../data/data.js";
import { Game } from "../main.js";

export class Movement {
    startTimers() {
        Game.zenith.startZenithMode();
        Game.grandmaster.startGrandmasterTimer();
        if (Game.zenith.tickPass == 0 && Game.settings.game.gamemode == "zenith") Game.renderer.renderTimeLeft("FLOOR 1")
        Game.started = true;
        Game.mechanics.startGravity();
        Game.modes.startSurvival();
        Game.mechanics.locking.lockingResume();
        Game.gameTimer = setInterval(() =>
            Game.gameClock(), (1000 / Game.tickrate)
        );
    }

    startCountdown() {
        
        this.startTimers()
        // setTimeout(() => {
        // }, 1000);
    }

    checkCollision(coords, action, collider) {
        collider = collider ?? Game.board.getMinos("S");
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
        if (Game.falling.piece.name != "t") return false;
        Game.mechanics.isMini = false;
        const minos = spinChecks[(rotation + 1) % 4]
            .concat(spinChecks[rotation - 1])
            .map(([ddx, ddy]) => this.checkCollision([[ddx + x, ddy + y]], "ROTATE"));
        if (minos[2] && minos[3] && (minos[0] || minos[1])) return true;
        if ((minos[2] || minos[3]) && minos[0] && minos[1]) {
            if ((dx == 1 || dx == -1) && dy == -2) return true;
            Game.mechanics.isMini = true;
            return true;
        }
    }

    checkAllspin(pieceCoords) {
        if (Game.falling.piece.name == "t") return false;
        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        const validSpin = directions.every(([dx, dy]) =>
            this.checkCollision(pieceCoords.map(([x, y]) => [x + dx, y + dy]), "ROTATE"));
        if (validSpin && Game.settings.game.allspinminis) Game.mechanics.isMini = true;
        return validSpin;
    }

    rotate(type) {
        if (Game.falling.piece.name == "o") return;
        const newRotation = Game.falling.getRotateState(type);
        const kickdata = Game.falling.getKickData(newRotation);
        const rotatingCoords = Game.falling.getNewCoords(newRotation);
        const change = kickdata.find(([dx, dy]) =>
            !this.checkCollision(rotatingCoords.map(c => [c[0] + dx, c[1] + dy]), "ROTATE"));
        if (!change) return;
        Game.board.MinoToNone("A");
        Game.board.addMinos("A " + Game.falling.piece.name, rotatingCoords, change);
        Game.falling.updateLocation(change);
        Game.mechanics.isTspin = this.checkTspin(newRotation, Game.falling.location, change);
        Game.mechanics.isAllspin = this.checkAllspin(Game.board.getMinos("A"));
        Game.falling.rotation = newRotation;
        Game.mechanics.locking.incrementLock();
        Game.stats.rotates++;
        Game.sounds.playSound("rotate");
        Game.mechanics.setShadow();
        if (Game.settings.game.gravitySpeed == 0) Game.mechanics.startGravity();
        Game.controls.startArr("current");
        Game.controls.checkSD();
        if (Game.mechanics.isTspin || (Game.mechanics.isAllspin && Game.settings.game.allspin)) {
            Game.renderer.rotateBoard(type);
            Game.particles.spawnParticles(...Game.falling.location,
                "spin", 5, type == "CW", Game.falling.piece.colour);
            Game.sounds.playSound("spin");
        }
    }

    movePieceSide(direction, max = 1) {
        Game.controls.checkSD();
        const minos = Game.board.getMinos("A");
        let amount = 0;
        const check = dx => !this.checkCollision(minos.map(([x, y]) => [x + dx, y]), direction);
        while (check(amount) && Math.abs(amount) < max) direction == "RIGHT" ? amount++ : amount--;
        if (!check(amount)) Game.renderer.bounceBoard(direction);
        if (amount == 0) {
            Game.controls.stopInterval("arr");
            return;
        }
        Game.board.moveMinos(minos, "RIGHT", amount);
        Game.falling.updateLocation([amount, 0]);
        Game.mechanics.isTspin = false;
        Game.mechanics.isAllspin = false;
        Game.mechanics.isMini = false;
        Game.mechanics.locking.incrementLock();
        Game.sounds.playSound("move");
        Game.mechanics.setShadow();
        Game.controls.checkSD();
        if (Game.settings.game.gravitySpeed == 0) Game.mechanics.startGravity();
    }

    movePieceDown(sonic, scoring = false) {
        const minos = Game.board.getMinos("A");
        if (this.checkCollision(minos, "DOWN")) return;
        Game.board.moveMinos(minos, "DOWN", 1);

        Game.mechanics.isTspin = false;
        Game.mechanics.isAllspin = false;
        Game.mechanics.isMini = false;
        Game.falling.updateLocation([0, -1]);
        if (this.checkCollision(Game.board.getMinos("A"), "DOWN")) {
            Game.mechanics.locking.scheduleLock();
            Game.renderer.bounceBoard("DOWN");
            Game.controls.startArr("current");
        }
        if (scoring && sonic) Game.stats.score += 1;
        if (sonic) this.movePieceDown(true, scoring);
    }

    harddrop() {
        const minos = Game.board.getMinos("A");
        let amount = 0;
        while (!this.checkCollision(minos.map(([x, y]) => [x, y - amount]), "DOWN")) amount++;
        if (amount > 0) {
            Game.mechanics.isTspin = false;
            Game.mechanics.isAllspin = false;
            Game.mechanics.isMini = false;
        }
        Game.board.moveMinos(minos, "DOWN", amount);
        Game.falling.updateLocation([0, -amount]);
        Game.stats.score += 2 * amount;
        Game.sounds.playSound("harddrop");
        Game.renderer.bounceBoard('DOWN');
        const xvals = [...new Set(minos.map(([x, y]) => x))];
        Game.particles.spawnParticles(Math.min(...xvals), Game.falling.location[1], "drop", xvals.length);
        Game.mechanics.locking.lockPiece();
    }
}
