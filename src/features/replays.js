import { Game } from "../main.js";

export class Replay {
    events = {};
    currentFrame = 0;
    /**@type { "idle" | "running" | "replaying" } */
    state = "idle";

    start() {
        if (this.state == "replaying") return;
        this.state = "running";
        this.currentFrame = 0;
        this.events = {};
    }

    stop() {
        this.state = "idle";
        Game.menuactions.loadSettings();
    }

    togglePause() {
        this.state = (this.state == "replaying") ? "idle" : "replaying";
        if (this.state == "idle") {
            Game.stopGameTimers();
        } else {
            Game.movement.startTimers();
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
        const keyDowns = Game.controls.keyDownQueue;
        const keyUps = Game.controls.keyUpQueue;

        const event = {}
        if (keyDowns.length > 0) event.keydown = keyDowns;
        if (keyUps.length > 0) event.keyup = keyUps;

        if (Object.keys(event).length == 0) return;
        this.events[this.currentFrame] = event;
    }

    saveReplay() {
        const date = (new Date()).toISOString();
        const fps = Math.round(Game.pixi.app.ticker.FPS);

        const newEvents = {}
        Object.getOwnPropertyNames(this.events).map(key => {
            const time = this.toMillisecond(key, fps);
            newEvents[time] = this.events[key];
        });

        const replay = {
            events: newEvents,
            header: {
                date,
                version: Game.version,
                fps,
                seed: Game.bag.genseed,
            },
            handling: Game.settings.handling,
            settings: Game.settings.game,
        };
        return JSON.stringify(replay);
    }

    runReplay(replayString) {
        const replay = JSON.parse(replayString);
        const oldEvents = replay.events;
        const fps = replay.header.fps;

        Object.getOwnPropertyNames(oldEvents).map(key => {
            const frame = this.toFrame(key, fps);
            if (this.events[frame] != undefined) {
                this.joinEvent(frame, oldEvents[key]);
            } else {
                this.events[frame] = oldEvents[key];
            }
        });

        this.currentFrame = 0;
        this.state = "replaying";
        Game.settings.handling = replay.handling;
        Game.settings.game = replay.settings;

        Game.startGame(replay.header.seed);
    }

    joinEvent(frame, event) {
        const kd = event.keydown ?? [];
        const ku = event.keyup ?? [];
        const oldKd = this.events[frame].keydown ?? [];
        const oldKu = this.events[frame].keyup ?? [];
        this.events[frame].keydown = oldKd.concat(kd);
        this.events[frame].keyup = oldKu.concat(ku);
    }

    replayKey(event) {
        const keydown = event.keydown ?? [];
        const keyup = event.keyup ?? [];
        Game.controls.keyDownQueue = keydown;
        Game.controls.keyUpQueue = keyup;

        if (!Game.started && keydown.length > 0) Game.movement.startTimers();
    }

    toMillisecond(frame, fps) {
        return Math.round(frame * 1000 / fps);
    }

    toFrame(time, fps) {
        return Math.round(time * fps / 1000);
    }
}