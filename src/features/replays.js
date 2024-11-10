import { Game } from "../game.js";
import { Bag } from "../mechanics/randomisers.js";

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
        if (this.state == "replaying") return;
        this.state = "running";
        this.currentFrame = 0;
        this.events = {};
    }

    stop() {
        this.state = "idle";
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

        const event = {}
        if (keyDowns.length > 0) event.keydown = keyDowns;
        if (keyUps.length > 0) event.keyup = keyUps;

        if (Object.keys(event).length == 0) return;
        this.events[this.currentFrame] = event;
    }

    saveReplay() {
        const date = (new Date()).toISOString();
        const fps = Math.round(this.game.pixi.app.ticker.FPS);
        const replay = { events: this.events, date, version: this.game.version, fps, seed:this.game.bag.genseed };
        return JSON.stringify(replay);
    }

    runReplay(replayString) {
        const replay = JSON.parse(replayString);
        this.events = replay.events;
        this.currentFrame = 0;
        this.state = "replaying";

        this.game.startGame(replay.seed);
    }

    replayKey(event) {
        const keydown = event.keydown ?? [];
        const keyup = event.keyup ?? [];
        this.game.controls.keyDownQueue = keydown;
        this.game.controls.keyUpQueue = keyup;
    }
}