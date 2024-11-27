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

    keyDownQueue = [];
    keyUpQueue = [];

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
        if (key == keys.pauseReplayKey && this.game.replay.state != "running") {
            this.game.replay.togglePause(); return;
        }

        if (this.game.replay.state == "replaying") return;

        if (this.game.modals.open || this.game.modals.closing || this.game.mechanics.locking.timings.clearDelay != 0) return;
        if (event.key != this.menuKey && !this.game.started) this.moves.startTimers();
        if (key == keys.resetKey) this.retry(true);
        if (this.game.ended) return;

        const keytype = Object.keys(keys).find(type => keys[type] == key);
        if (keytype == undefined) return;
        this.keyDownQueue.push(keytype);
        this.toggleCursor(false);
        this.game.stats.inputs++;
    }

    onKeyUp(event, key) {
        if (this.game.replay.state == "replaying") return;

        const keys = this.game.settings.control;
        const keytype = Object.keys(keys).find(type => keys[type] == key);
        if (keytype == undefined) return;
        this.keyUpQueue.push(keytype);
    }

    onKeyDownRepeat(event, key) { // allows for arr undo/redo
        if (this.game.replay.state == "replaying") return;

        const keys = this.game.settings.control;
        if (event.key == this.menuKey) event.preventDefault();

        if (key == keys.undoKey) this.game.history.undo();
        else if (key == keys.redoKey) this.game.history.redo()
    }

    runKeyQueue() {
        if (this.keyDownQueue.length > 1) console.log("double");
        this.keyDownQueue.forEach(key => {
            if (key == "cwKey") this.moves.rotate("CW");
            else if (key == "ccwKey") this.moves.rotate("CCW");
            else if (key == "rotate180Key") this.moves.rotate("180");
            else if (key == "hdKey") this.moves.harddrop();
            else if (key == "holdKey") this.game.mechanics.switchHold();
            else if (key == "rightKey") this.startDas("RIGHT");
            else if (key == "leftKey") this.startDas("LEFT");
            else if (key == "sdKey") this.startArrSD();
        });
        this.keyDownQueue = [];
        this.keyUpQueue.forEach(key => {
            if (key == "rightKey") this.endDasArr("RIGHT");
            else if (key == "leftKey") this.endDasArr("LEFT");
            else if (key == "sdKey") this.endDasArr("DOWN");
        });
        this.keyUpQueue = [];
    }

    startDas(direction) {
        this.moves.movePieceSide(direction);
        this.directionState[direction] = "das";
        this.stopInterval("arr");
        this.startedDas = performance.now();
        this.currentDirection = direction;
    }

    timer() {
        if (this.currentDirection == undefined || this.startedDas == undefined) return;
        const now = performance.now();
        if (now - this.startedDas < this.game.settings.handling.das) return;
        this.startArr(this.currentDirection)
        this.currentDirection = undefined;
        this.startedDas = undefined;
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
            // this.stopTimeout("das");
            this.currentDirection = undefined;
            this.startedDas = undefined;
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
            this.game.animations.resetAnimation()
        }
    }

    toggleCursor(enable) {
        if (!(this.cursorVisible ^ enable)) return; // only toggle when they are different
        this.cursorVisible = enable;
        document.body.style.cursor = enable ? 'auto' : 'none';
    }
}