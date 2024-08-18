// @ts-check
import { disabledKeys, spinChecks } from "./data.js";
import { Game } from "./game.js";
import { KickData, KickData180 } from "./kicks.js";

export class Movement {
    /**
     * @type {{RIGHT: boolean|string, LEFT: boolean|string, DOWN: boolean|string}}
     */
    directionState = { RIGHT: false, LEFT: false, DOWN: false };
    rotationState;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.keys = game.controlSettings;
        this.mechs = this.game.mechanics;
        this.getMinos = this.game.board.getMinos;
        this.addMinos = this.game.board.addMinos;
        this.moveMinos = this.game.board.moveMinos;
        this.MinoToNone = this.game.board.MinoToNone;
        this.pieceToCoords = this.game.board.pieceToCoords;
    }

    initKeyListeners() {
        window.addEventListener("keydown", event => {
            if (event.key == "Escape") event.preventDefault();
            if (event.key == "Escape" && this.game.menuactions.bindingKey == undefined)
                this.game.menuactions.toggleDialog();
            if (event.repeat || this.game.modals.isDialogOpen) return;
            if (disabledKeys.includes(event.key)) event.preventDefault();
            if (this.game.firstMove && event.key != "Escape") this.firstMovement();
            if (event.key == this.keys.resetKey) {
                playSound("retry");
                this.game.startGame();
            }
            if (this.game.gameEnd) return;
            if (event.key == this.keys.cwKey) this.rotate("CW");
            if (event.key == this.keys.ccwKey) this.rotate("CCW");
            if (event.key == this.keys.rotate180Key) this.rotate("180");
            if (event.key == this.keys.hdKey) this.harddrop();
            if (event.key == this.keys.holdKey) this.mechs.switchHold();
            if (event.key == this.keys.rightKey) this.startDas("RIGHT");
            if (event.key == this.keys.leftKey) this.startDas("LEFT");
            if (event.key == this.keys.sdKey) this.startArrSD();
        });

        window.addEventListener("keyup", event => {
            if (event.key == this.keys.rightKey) this.endDasArr("RIGHT");
            if (event.key == this.keys.leftKey) this.endDasArr("LEFT");
            if (event.key == this.keys.sdKey) this.endDasArr("DOWN");
        });
    }

    // keypresses
    firstMovement() {
        this.mechs.startGravity();
        this.game.firstMove = false;
        this.game.timeouts["stats"] = setInterval(() => this.game.rendering.renderStats(), 20);
        const time = (60 * 1000) / this.game.gameSettings.survivalRate;
        if (this.game.gameSettings.gamemode == 5)
            this.game.timeouts["survival"] = setInterval(() => this.mechs.addGarbage(1), time);
    }

    startDas(direction) {
        this.movePieceSide(direction);
        this.directionState[direction] = "das";
        this.game.utils.stopTimeout("das");
        this.game.utils.stopInterval("arr");
        this.game.timeouts["das"] = setTimeout(
            () => this.startArr(direction),
            this.game.gameSettings.das
        );
    }

    startArr(direction) {
        if (direction == "current") {
            if (this.directionState["RIGHT"] == "arr" && this.directionState["LEFT"] == "arr")
                return;
            if (this.directionState["RIGHT"] == "arr") this.startArr("RIGHT");
            if (this.directionState["LEFT"] == "arr") this.startArr("LEFT");
            return;
        }
        this.directionState[direction] = "arr";
        this.game.utils.stopInterval("arr");
        if (this.game.gameSettings.arr == 0) {
            this.game.timeouts["arr"] = -1;
            this.movePieceSide(direction, Infinity);
        } else {
            this.game.timeouts["arr"] = setInterval(
                () => this.movePieceSide(direction),
                this.game.gameSettings.arr
            );
        }
    }

    startArrSD() {
        this.directionState["DOWN"] = "arr";
        clearInterval(this.game.timeouts["sd"]);
        if (this.game.gameSettings.sdarr == 0) {
            this.game.timeouts["sd"] = -1;
            this.movePieceDown(true);
            return;
        }
        this.game.timeouts["sd"] = setInterval(
            () => this.movePieceDown(false),
            this.game.gameSettings.sdarr
        );
    }

    endDasArr(direction) {
        this.directionState[direction] = false;
        if (direction == "RIGHT" || direction == "LEFT") {
            const oppDirection = direction == "RIGHT" ? "LEFT" : "RIGHT";
            if (this.directionState[oppDirection] == "das") return;
            if (this.directionState[oppDirection] == "arr") {
                this.startArr(oppDirection);
                return;
            }
            this.game.utils.stopTimeout("das");
            this.game.utils.stopInterval("arr");
        }
        if (direction == "DOWN") this.game.utils.stopInterval("sd");
    }

    resetMovements() {
        this.directionState = { RIGHT: false, LEFT: false, DOWN: false };
        this.endDasArr("RIGHT");
        this.endDasArr("LEFT");
        this.endDasArr("DOWN");
    }

    // piece movement
    checkCollision(coords, action, collider) {
        collider = collider || this.getMinos("S");
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
        if (this.game.currentPiece.name != "t") return false;
        this.mechs.isMini = false;
        const minos = spinChecks[(rotation + 1) % 4]
            .concat(spinChecks[rotation - 1])
            .map(([ddx, ddy]) => this.checkCollision([[ddx + x, ddy + y]], "ROTATE"));
        if (minos[2] && minos[3] && (minos[0] || minos[1])) return true;
        if ((minos[2] || minos[3]) && minos[0] && minos[1]) {
            if ((dx == 1 || dx == -1) && dy == -2) return true;
            this.mechs.isMini = true;
            return true;
        }
    }

    rotate(type) {
        if (this.game.currentPiece.name == "o") return;
        const newRotation = this.newRotateState(type, this.rotationState);
        const kickdata = this.getKickData(this.game.currentPiece, type, newRotation);
        const rotatingCoords = this.pieceToCoords(
            this.game.currentPiece[`shape${newRotation}`],
            this.game.currentLoc
        );
        const change = kickdata.find(
            ([dx, dy]) =>
                !this.checkCollision(
                    rotatingCoords.map(c => [c[0] + dx, c[1] + dy]),
                    "ROTATE"
                )
        );
        if (!change) return;
        this.MinoToNone("A");
        this.addMinos("A " + this.game.currentPiece.name, rotatingCoords, change);
        this.game.currentLoc = [
            this.game.currentLoc[0] + change[0],
            this.game.currentLoc[1] + change[1],
        ];
        this.mechs.isTspin = this.checkTspin(newRotation, this.game.currentLoc, change);
        this.rotationState = newRotation;
        movedPieceFirst = true;
        incrementLock();
        playSound("rotate");
        displayShadow();
        if (this.mechs.isTspin) playSound("spin");
        if (this.game.gameSettings.gravitySpeed == 0) this.mechs.startGravity();
        this.startArr("current");
        if (this.directionState["DOWN"] == "arr") this.startArrSD();
    }

    newRotateState(type, state) {
        const newState = (state + { CW: 1, CCW: -1, 180: 2 }[type]) % 4;
        return newState == 0 ? 4 : newState;
    }

    getKickData(piece, rotationType, shapeNo) {
        const isI = piece.name == "i" ? 1 : 0;
        const direction = rotationType == "CCW" ? (shapeNo > 3 ? 0 : shapeNo) : shapeNo - 1;
        return {
            180: KickData180[isI][direction],
            CW: KickData[isI][direction],
            CCW: KickData[isI][direction].map(row => row.map(x => x * -1)),
        }[rotationType];
    }

    movePieceSide(direction, max = 1) {
        if (this.directionState["DOWN"] == "arr") this.startArrSD();
        const minos = this.getMinos("A");
        let amount = 0;
        const check = dx =>
            !this.checkCollision(
                minos.map(([x, y]) => [x + dx, y]),
                direction
            );
        while (check(amount) && Math.abs(amount) < max) direction == "RIGHT" ? amount++ : amount--;
        if (this.game.gameSettings.gravitySpeed == 0) this.mechs.startGravity();
        if (amount == 0) {
            this.game.utils.stopInterval("arr");
            return;
        }
        this.moveMinos(minos, "RIGHT", amount);
        this.game.currentLoc[0] += amount;
        this.game.mechanics.isTspin = false;
        this.mechs.isMini = false;
        this.game.movedPieceFirst = true;
        incrementLock();
        playSound("move");
        displayShadow();
        if (this.directionState["DOWN"] == "arr") this.startArrSD();
    }

    movePieceDown(sonic) {
        const minos = this.getMinos("A");
        if (this.checkCollision(minos, "DOWN")) return;
        this.moveMinos(minos, "DOWN", 1);
        this.game.mechanics.isTspin = false;
        this.mechs.isMini = false;
        this.game.currentLoc[1] -= 1;
        this.game.mechanics.totalScore += 1;
        this.game.movedPieceFirst = true;
        if (this.checkCollision(this.getMinos("A"), "DOWN")) scheduleLock();
        this.startArr("current");
        if (sonic) this.movePieceDown(true);
    }

    harddrop() {
        const minos = this.getMinos("A");
        let amount = 0;
        while (
            !this.checkCollision(
                minos.map(([x, y]) => [x, y - amount]),
                "DOWN"
            )
        )
            amount++;
        if (amount > 0) {
            this.game.mechanics.isTspin = false;
            this.mechs.isMini = false;
        }
        this.moveMinos(minos, "DOWN", amount);
        this.game.currentLoc[1] -= amount;
        this.game.mechanics.totalScore += 2;
        playSound("harddrop");
        lockPiece();
    }
}
