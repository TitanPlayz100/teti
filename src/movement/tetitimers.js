import { Game } from "../main.js";

export class TetiTimer {
    progress = 0;
    maxTime = 0;
    callback;
    timerId = 0;
    static Timer = [];
    type;

    /**@param {"interval"|"timeout"} type   */
    constructor(fn, intervalTime, type) {
        this.callback = fn;
        this.maxTime = intervalTime;
        this.type = type
        TetiTimer.Timer.push(this);
    }

    static tickAll() {
        TetiTimer.Timer.forEach(tmr => tmr.tick());
    }

    tick(dt) {
        this.progress += dt;
        if (this.progress >= this.maxTime) {
            this.callback();
            if (this.type == "interval") this.progress = 0;
        }
    }

    startAuto() {
        if (Game.replay.seeking) return;
        this.timerId = this.type == "interval"
            ? setInterval(this.callback, this.maxTime)
            : setTimeout(this.callback, this.maxTime)
    }

    reset() {
        this.type == "interval"
            ? clearInterval(this.timerId)
            : clearTimeout(this.timerId);
        this.timerId = 0;
        this.progress = 0;
    }
}

export function initTetiTimers() {
    Game.gravityTimer = new TetiTimer(
        () => Game.movement.movePieceDown(false),
        Game.settings.game.gravitySpeed,
        "interval"
    );

    Game.controls.timings.arr = new TetiTimer(
        () => Game.movement.movePieceSide(Game.controls.getDirection()),
        Game.settings.handling.arr,
        "interval"
    );
    Game.controls.timings.sd = new TetiTimer(
        () => {
            Game.movement.movePieceDown(false);
            Game.stats.score += 1;
        },
        Game.settings.handling.sdarr,
        "interval"
    );

    Game.locking.lockTimer = new TetiTimer(
        () => Game.locking.lockPiece(),
        Game.settings.game.lockDelay,
        "timeout"
    );
    Game.locking.clearTimer = new TetiTimer(
        () => {
            Game.mechanics.spawnPiece(Game.bag.cycleNext());
            Game.history.save();
        },
        Game.settings.game.clearDelay,
        "timeout"
    )
}

