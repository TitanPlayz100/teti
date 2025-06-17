import { disabledKeys } from "../data/data.js";
import { Game } from "../main.js";

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

    onKeyDown(event, key) {
        const keys = Game.settings.control;
        if (disabledKeys.includes(event.key)) event.preventDefault();

        if (key == this.menuKey) Game.menuactions.toggleDialog();
        else if (key == keys.editMenuKey) Game.menuactions.openEditMenu();
        if (key == keys.pauseReplayKey && Game.replay.state != "running" && !Game.modals.open) {
            Game.replay.togglePause(); return;
        }

        if (Game.replay.state == "replaying") return;

        if (Game.modals.open || Game.modals.closing || Game.mechanics.locking.timings.clearDelay != 0) return;
        if (event.key != this.menuKey && !Game.started && Game.settings.game.readysetgo == false) Game.movement.startTimers();
        if (key == keys.resetKey) this.retry(true);
        if (!Game.started && Game.settings.game.readysetgo == true) return;
        if (Game.ended) return;

        const keytype = Object.keys(keys).find(type => keys[type] == key);
        if (keytype == undefined) return;
        this.keyDownQueue.push(keytype);
        this.toggleCursor(false);
        Game.stats.inputs++;
    }

    onKeyUp(event, key) {
        if (Game.replay.state == "replaying") return;

        const keys = Game.settings.control;
        const keytype = Object.keys(keys).find(type => keys[type] == key);
        if (keytype == undefined) return;
        this.keyUpQueue.push(keytype);
    }

    onKeyDownRepeat(event, key) { // allows for arr undo/redo
        if (Game.replay.state == "replaying") return;

        const keys = Game.settings.control;
        if (event.key == this.menuKey) event.preventDefault();

        if (key == keys.undoKey) Game.history.undo();
        else if (key == keys.redoKey) Game.history.redo()
    }

    runKeyQueue() {
        this.keyDownQueue.forEach(key => {
            if (key == "cwKey") Game.movement.rotate("CW");
            else if (key == "ccwKey") Game.movement.rotate("CCW");
            else if (key == "rotate180Key") Game.movement.rotate("180");
            else if (key == "hdKey") Game.movement.harddrop();
            else if (key == "holdKey") Game.mechanics.switchHold();
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
        Game.movement.movePieceSide(direction);
        this.directionState[direction] = "das";
        this.stopInterval("arr");
        this.startedDas = performance.now();
        this.currentDirection = direction;
    }

    timer() {
        if (this.currentDirection == undefined || this.startedDas == undefined) return;
        const now = performance.now();
        if (now - this.startedDas < Game.settings.handling.das) return;
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
        if (Game.settings.handling.arr == 0) {
            this.timings.arr = -1;
            Game.movement.movePieceSide(direction, Infinity);
        } else {
            this.timings.arr = setInterval(
                () => Game.movement.movePieceSide(direction),
                Game.settings.handling.arr
            );
        }
    }

    startArrSD() {
        this.directionState["DOWN"] = "arr";
        clearInterval(this.timings.sd);
        if (Game.settings.handling.sdarr == 0) {
            this.timings.sd = -1;
            Game.movement.movePieceDown(true, true);
            return;
        }
        this.timings.sd = setInterval(
            () => {
                Game.movement.movePieceDown(false);
                Game.stats.score += 1;
            },
            Game.settings.handling.sdarr
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
        Game.ended = true;
        Game.sounds.playSound("retry");

        if (!animation || Game.settings.game.stride) {
            Game.startGame();
        } else {
            Game.animations.resetAnimation()
        }
    }

    toggleCursor(enable) {
        if (!(this.cursorVisible ^ enable)) return; // only toggle when they are different
        this.cursorVisible = enable;
        document.body.style.cursor = enable ? 'auto' : 'none';
    }
}