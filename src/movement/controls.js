//@ts-check

import { Game } from "../main.js";

export class Controls {
    /**@type {DirectionStates} */
    directionState = { RIGHT: false, LEFT: false, DOWN: false };
    /**@type {ArrTimings} */
    timings = { arr: null, sd: null };
    menuKey = "Escape"; // html modals close using escape
    cursorVisible = true;
    resetting = false;
    /**@type {string[]} */
    keyDownQueue = [];
    /**@type {string[]} */
    keyUpQueue = [];

    onKeyDown(key) {
        const keys = Game.settings.control;
        if (!movementAllowed()) return;
        if (!Game.started && Game.settings.game.readysetgo == false)
            Game.movement.startTimers();
        if (key == keys.resetKey)
            this.retry(true);

        const keytype = Object.keys(keys).find(type => keys[type] == key);
        if (keytype == undefined) return;
        this.keyDownQueue.push(keytype);
        this.toggleCursor(false);
        Game.stats.inputs++;
    }

    onKeyUp(key) {
        const keys = Game.settings.control;
        if (Game.replay.state == "replaying") return;

        const keytype = Object.keys(keys).find(type => keys[type] == key);
        if (keytype == undefined) return;
        this.keyUpQueue.push(keytype);
    }

    onKeyDownRepeat(key) { // allows for arr undo/redo
        const keys = Game.settings.control;
        if (Game.replay.state == "replaying") return;

        if (key == keys.undoKey) Game.history.undo();
        else if (key == keys.redoKey) Game.history.redo()
    }

    pressMenuKey(key) {
        const keys = Game.settings.control;
        if (key == this.menuKey)
            Game.menuactions.toggleDialog();
        if (key == keys.editMenuKey)
            Game.menuactions.openEditMenu();
        if (key == keys.pauseReplayKey && Game.replay.state != "running" && !Game.modals.open)
            Game.replay.togglePause();
    }

    runKeyQueue(curTime) {
        this.keyDownQueue.forEach(key => {
            if (key == "cwKey") Game.movement.rotate("CW");
            else if (key == "ccwKey") Game.movement.rotate("CCW");
            else if (key == "rotate180Key") Game.movement.rotate("180");
            else if (key == "hdKey") Game.movement.harddrop();
            else if (key == "holdKey") Game.mechanics.switchHold();
            else if (key == "rightKey") this.startDas("RIGHT", curTime);
            else if (key == "leftKey") this.startDas("LEFT", curTime);
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

    /** @param {DirectionType} direction*/
    startDas(direction, time) {
        Game.movement.movePieceSide(direction);
        this.directionState[direction] = "das";
        this.timings.arr.reset();
        this.startedDas = time;
    }

    timer(curTime) {
        const dir = this.getDasDirection();
        if (dir == undefined || this.startedDas == undefined) return;
        if (curTime - this.startedDas < Game.settings.handling.das) return;
        this.startArr(dir)
        this.startedDas = undefined;
    }

    /** @param { "RIGHT" | "LEFT" | null } direction*/
    startArr(direction) {
        if (direction == null) return;
        this.directionState[direction] = "arr"
        this.timings.arr.reset();
        if (Game.settings.handling.arr == 0) {
            Game.movement.movePieceSide(direction, Infinity);
        } else {
            this.timings.arr.startAuto();
        }
    }

    getDirection() {
        if (this.directionState["RIGHT"] == "arr" && this.directionState["LEFT"] == "arr") return null;
        if (this.directionState["RIGHT"] == "arr") return "RIGHT";
        if (this.directionState["LEFT"] == "arr") return "LEFT";
    }

    getDasDirection() {
        if (this.directionState["RIGHT"] == "das" && this.directionState["LEFT"] == "das") return null;
        if (this.directionState["RIGHT"] == "das") return "RIGHT";
        if (this.directionState["LEFT"] == "das") return "LEFT";
    }

    startArrSD() {
        this.directionState["DOWN"] = "arr";
        this.timings.sd.reset();
        if (Game.settings.handling.sdarr == 0) {
            Game.movement.movePieceDown(true, true);
            return;
        }
        this.timings.sd.startAuto();
    }

    /** @param {DirectionType} direction*/
    endDasArr(direction) {
        this.directionState[direction] = false;
        if (direction == "RIGHT" || direction == "LEFT") {
            const oppDirection = direction == "RIGHT" ? "LEFT" : "RIGHT";
            if (this.directionState[oppDirection] == "das") return;
            if (this.directionState[oppDirection] == "arr") {
                this.startArr(oppDirection);
                return;
            }
            this.startedDas = undefined;
            this.timings.arr.reset();
        }
        if (direction == "DOWN") this.timings.sd.reset()
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

    retry(showAnimation) {
        if (this.resetting) return; // no overlap
        Game.ended = true;
        Game.sounds.playSound("retry");

        if (!showAnimation || Game.settings.game.stride) {
            Game.startGame();
        } else {
            Game.animations.resetAnimation()
        }
    }

    toggleCursor(enable) {
        if (this.cursorVisible == enable) return; // only toggle when they are different
        this.cursorVisible = enable;
        document.body.style.cursor = enable ? 'auto' : 'none';
    }
}


function movementAllowed() {
    return Game.replay.state != "replaying" && Game.replay.state != "paused"
        && !Game.modals.open && !Game.modals.closing && !Game.ended
        && Game.locking.clearTimer.progress == 0
        && (Game.started || !Game.settings.game.readysetgo)
}
