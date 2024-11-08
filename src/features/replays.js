import { Game } from "../game.js";

// start recording replay with start()
// save replay with copyReplay()
// run replay with runReplay()
export class Replay {
    events = {};
    currentFrame = 0;
    /**@type {"idle" | "running" | "replaying"} */
    state = "idle";

    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

    start() {
        this.state = "running";
        this.currentFrame = 0;
        this.events = {};
    }

    tick() {
        if (this.state == "running") {
            this.currentFrame++;
            this.saveKeys();
        } else if (this.state == "replaying") {
            this.currentFrame++;
            const event = this.events[this.currentFrame];
            if (event != undefined) this.replayKey(event);
        }
    }

    saveKeys() {
        const keyDowns = this.game.controls.keyDownQueue;
        const keyUps = this.game.controls.keyUpQueue;
        if (keyDowns.length == 0 && keyUps.length == 0) return;
        this.events[this.currentFrame] = { "keydown": keyDowns, "keyup": keyUps };
    }

    copyReplay() {
        navigator.clipboard.writeText(JSON.stringify(this.events));
    }

    runReplay(replayString) {
        this.events = JSON.parse(replayString);
        this.currentFrame = 0;
        this.state = "replaying";
    }

    replayKey(event) {
        const { keydown, keyup } = event;
        this.game.controls.keyDownQueue = keydown;
        this.game.controls.keyUpQueue = keyup;
    }
}