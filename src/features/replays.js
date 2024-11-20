import { Game } from "../game.js";

// start recording replay with start()
// save replay with copyReplay()
// run replay with runReplay()
export class Replay {
    events = {};
    currentFrame = 0;
    /**@type { "idle" | "running" | "replaying" } */
    state = "idle";
    
    totalLength;

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
        this.game.menuactions.loadSettings();
    }

    togglePause() {
        this.state = (this.state == "replaying") ? "idle" : "replaying";
        if (this.state == "idle") {
            this.game.stopGameTimers();
        } else {
            this.game.movement.startTimers();
        }
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
        const replay = {
            events: this.events,
            header: {
                date,
                version: this.game.version,
                fps,
                seed: this.game.bag.genseed,
            },
            handling: this.game.settings.handling,
            settings: this.game.settings.game,
            length: this.currentFrame
        };
        return JSON.stringify(replay);
    }

    runReplay(replayString) {
        const replay = JSON.parse(replayString);
        this.events = replay.events;
        this.currentFrame = 0;
        this.state = "replaying";
        this.game.settings.handling = replay.handling;
        this.game.settings.game = replay.settings;
        this.totalLength = replay.length;

        this.game.startGame(replay.header.seed);
    }

    replayKey(event) {
        const keydown = event.keydown ?? [];
        const keyup = event.keyup ?? [];
        this.game.controls.keyDownQueue = keydown;
        this.game.controls.keyUpQueue = keyup;

        if (!this.game.started && keydown.length > 0) this.game.movement.startTimers();
    }
}