import { disabledKeys } from "../data/data.js";
import { Game } from "../main.js";
import { TetiInterval } from "./tetitimers.js";

export class Controls {
    /**
     * @type {{RIGHT: boolean|string, LEFT: boolean|string, DOWN: boolean|string}}
     */
    directionState = { RIGHT: false, LEFT: false, DOWN: false };
    /**@type {Record<string, TetiInterval? >} */
    timings = { arr: null, sd: null };
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

        if (Game.replay.state == "replaying" | Game.replay.state == "paused") return;

        if (Game.modals.open || Game.modals.closing || Game.mechanics.locking.clearDelay != null) return;
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

    startDas(direction, time) {
        Game.movement.movePieceSide(direction);
        this.directionState[direction] = "das";
        this.stopInterval("arr");
        this.startedDas = time;
        this.currentDirection = direction;
    }

    timer(curTime) {
        if (this.currentDirection == undefined || this.startedDas == undefined) return;
        if (curTime - this.startedDas < Game.settings.handling.das) return;
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
            this.timings.arr = null;
            Game.movement.movePieceSide(direction, Infinity);
        } else {
            this.timings.arr = new TetiInterval(
                () => Game.movement.movePieceSide(direction),
                Game.settings.handling.arr
            )
            if (!Game.replay.seeking) this.timings.arr.startAuto();
        }
    }

    startArrSD() {
        this.directionState["DOWN"] = "arr";
        this.stopInterval("sd")
        if (Game.settings.handling.sdarr == 0) {
            this.timings.sd = null;
            Game.movement.movePieceDown(true, true);
            return;
        }
        this.timings.sd = new TetiInterval(
            () => {
                Game.movement.movePieceDown(false);
                Game.stats.score += 1;
            },
            Game.settings.handling.sdarr
        );
        if (!Game.replay.seeking) this.timings.sd.startAuto();
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

    stopInterval(name) {
        if (this.timings[name] != null) {
            this.timings[name].stopAuto();
            this.timings[name] = null;
        }
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