import { Game } from "../main.js";
import { TetiTimer } from "../movement/tetitimers.js";

export class Replay {
    /**@type {ReplayEvents} */
    events = {};
    currentFrame = 0;
    /**@type { "idle" | "running" | "replaying" | "paused" } */
    state = "idle";
    seeking = false;
    fps = 60; // by default

    start() {
        if (this.state == "replaying" || this.state == "paused") return;
        this.state = "running";
        this.currentFrame = 0;
        this.events = {};
    }

    stop() {
        this.state = "idle";
        Game.menuactions.loadSettings();
    }

    togglePause() {
        if (this.state == "replaying") {
            this.state = "paused"
            Game.stopGameTimers();
        } else if (this.state == "paused") {
            this.state = "replaying";
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
            this.updateSeekPos(this.currentFrame);
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
        this.fps = replay.header.fps;
        this.events = {}

        Object.getOwnPropertyNames(oldEvents).map(key => {
            const frame = this.toFrame(key, this.fps);
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
        Game.pixi.seekBar.visible = true;

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

    updateSeekPos(frame) {
        const frames = Object.keys(this.events)
        const max = frames[frames.length - 1];
        const percent = frame/Number(max);
        Game.pixi.setSeekPos(percent);
    }

    seekToPercent(percent) {
        const frames = Object.keys(this.events)
        const max = frames[frames.length - 1];
        const frame = Math.round(Number(max) * percent)
        this.seekToFrame(frame);
        Game.pixi.setSeekPos(percent);
    }

    seekToFrame(frame) {
        this.seeking = true;
        let curtime = performance.now();

        // start from beginning if going backwards
        if (frame < this.currentFrame) {
            const seed = Game.bag.genseed
            Game.startGame(seed);
            Game.movement.startTimers();
            this.currentFrame = 0;
        }

        this.state = "paused"
        Game.stopGameTimers();

        while (this.currentFrame < frame) {
            const event = this.events[this.currentFrame];
            if (event) {
                const keydown = event.keydown ?? [];
                const keyup = event.keyup ?? [];
                Game.controls.keyDownQueue = keydown;
                Game.controls.keyUpQueue = keyup;
                Game.controls.runKeyQueue(curtime);
            }

            const dt = this.toMillisecond(1, this.fps)

            Game.controls.timer(curtime);
            Game.stats.updateStats(dt);
            Game.locking.tickLockTimer(dt);
            TetiTimer.tickAll();
            this.currentFrame++;
            curtime += dt;
        }

        this.seeking = false;
    }

    toMillisecond(frame, fps) {
        return Math.round(frame * 1000 / fps);
    }

    toFrame(time, fps) {
        return Math.round(time * fps / 1000);
    }
}