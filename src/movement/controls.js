import { disabledKeys } from "../data/data.js";
import { Game } from "../game.js";

export class Controls {
    /**
     * @type {{RIGHT: boolean|string, LEFT: boolean|string, DOWN: boolean|string}}
     */
    directionState = { RIGHT: false, LEFT: false, DOWN: false };
    timings = { arr: 0, das: 0, sd: 0 }; // timeout and interval ids
    menuKey = "Escape"; // html modals close using escape
    cursorVisible = true;
    resetting = false;

    keyQueue = [];

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.moves = game.movement;
    }

    onKeyDown(event, key) {
        const keys = this.game.settings.control;
        if (disabledKeys.includes(event.key)) event.preventDefault();

        if (key == this.menuKey) this.game.menuactions.toggleDialog();
        else if (key == keys.editMenuKey) this.game.menuactions.openEditMenu();

        if (this.game.modals.open || this.game.modals.closing || this.game.mechanics.locking.timings.clearDelay != 0) return;
        if (event.key != this.menuKey && !this.game.started) this.moves.firstMovement();
        if (key == keys.resetKey) this.retry(true);
        if (this.game.ended) return;

        this.keyQueue.push(key);
        this.toggleCursor(false);
        this.game.stats.inputs++;
    }

    runKeyQueue() {
        const keys = this.game.settings.control;
        this.keyQueue.forEach(key => {
            if (key == keys.cwKey) this.moves.rotate("CW");
            else if (key == keys.ccwKey) this.moves.rotate("CCW");
            else if (key == keys.rotate180Key) this.moves.rotate("180");
            else if (key == keys.hdKey) this.moves.harddrop();
            else if (key == keys.holdKey) this.game.mechanics.switchHold();
            else if (key == keys.rightKey) this.startDas("RIGHT");
            else if (key == keys.leftKey) this.startDas("LEFT");
            else if (key == keys.sdKey) this.startArrSD();
        });
        this.keyQueue = [];
    }

    onKeyDownRepeat(event, key) { // allows for arr undo/redo
        const keys = this.game.settings.control;
        if (event.key == this.menuKey) event.preventDefault();

        if (key == keys.undoKey) this.game.history.undo();
        else if (key == keys.redoKey) this.game.history.redo()
    }

    onKeyUp(event, key) {
        this.keys = this.game.settings.control;

        if (key == this.keys.rightKey) this.endDasArr("RIGHT");
        if (key == this.keys.leftKey) this.endDasArr("LEFT");
        if (key == this.keys.sdKey) this.endDasArr("DOWN");
    }

    startDas(direction) {
        this.moves.movePieceSide(direction);
        this.directionState[direction] = "das";
        this.stopTimeout("das");
        this.stopInterval("arr");
        this.timings.das = setTimeout(() => this.startArr(direction),
            this.game.settings.handling.das
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
        this.stopInterval("arr");
        if (this.game.settings.handling.arr == 0) {
            this.timings.arr = -1;
            this.moves.movePieceSide(direction, Infinity);
        } else {
            this.timings.arr = setInterval(
                () => this.moves.movePieceSide(direction),
                this.game.settings.handling.arr
            );
        }
    }

    startArrSD() {
        this.directionState["DOWN"] = "arr";
        clearInterval(this.timings.sd);
        if (this.game.settings.handling.sdarr == 0) {
            this.timings.sd = -1;
            this.moves.movePieceDown(true, true);
            return;
        }
        this.timings.sd = setInterval(
            () => {
                this.moves.movePieceDown(false);
                this.game.stats.score += 1;
            },
            this.game.settings.handling.sdarr
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
            this.stopTimeout("das");
            this.stopInterval("arr");
        }
        if (direction == "DOWN") this.stopInterval("sd");
    }

    resetMovements() {
        this.directionState = { RIGHT: false, LEFT: false, DOWN: false };
        this.endDasArr("RIGHT");
        this.endDasArr("LEFT");
        this.endDasArr("DOWN");
    }

    checkSD() {
        if (this.directionState["DOWN"] == "arr")
            this.startArrSD();
    }

    stopTimeout(name) {
        clearTimeout(this.timings[name]);
        this.timings[name] = 0;
    }

    stopInterval(name) {
        clearInterval(this.timings[name]);
        this.timings[name] = 0;
    }

    retry(animation) {
        if (this.resetting) return; // no overlap
        this.game.ended = true;
        this.game.sounds.playSound("retry");

        if (!animation || this.game.settings.game.stride) {
            this.game.startGame();
        } else {
            this.game.pixi.resetAnimation()
        }
    }

    toggleCursor(enable) {
        if (!(this.cursorVisible ^ enable)) return; // only toggle when they are different
        this.cursorVisible = enable;
        document.body.style.cursor = enable ? 'auto' : 'none';
    }
}