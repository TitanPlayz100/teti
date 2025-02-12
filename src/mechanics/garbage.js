import { Game } from "../main.js";

export class Garbage {
    /** @type {Array<{damage: number, travel: number}>>} */
    garbageQueue = [];

    constructor() {
        Game.pixi.updateGarbageBar(this.garbageQueue);
    }

    addGarbageQueue(damage) {
        if (damage <= 0) return;
        this.garbageQueue.push({ damage: damage, travel: Game.tickrate * Game.settings.game.garbageTravelTime });
        if (damage > 4) Game.sounds.playSound("garbage_in_large");
        else if (damage > 0) Game.sounds.playSound("garbage_in_small");

        Game.pixi.addGarbage(damage, this.garbageQueueTotal(), false);
    }

    removeGarbage(damage) {
        if (damage <= 0) return;

        while (damage > 0 && this.garbageQueue.length > 0) {
            if (damage >= this.garbageQueue[0].damage) {
                damage -= this.garbageQueue[0].damage;
                this.garbageQueue.shift();
            } else {
                this.garbageQueue[0].damage -= damage;
                damage = 0;
            }
        }
        Game.pixi.updateGarbageBar(this.garbageQueue);
        Game.sounds.playSound("offset");
    }

    sendGarbageQueue() {
        const garbage = this.garbageQueue.filter(g => g.travel <= 0);
        garbage.forEach(g => {
            Game.mechanics.addGarbage(g.damage, 0);
            Game.stats.recieved += g.damage;
        })
        this.garbageQueue = this.garbageQueue.filter(g => g.travel > 0);
        Game.pixi.updateGarbageBar(this.garbageQueue);
    }

    cancelGarbage(damage) {
        if (Game.settings.game.gamemode == "backfire") {
            Game.modes.backfireGarbage(damage);
            return;
        }
        this.removeGarbage(damage);
    }

    garbageQueueTotal() {
        return this.garbageQueue.reduce((total, g) => total + g.damage, 0);
    }

    tickGarbage() {
        this.garbageQueue.forEach(g => g.travel--);
        if (this.garbageQueue.filter(g => g.travel == 0).length > 0) Game.pixi.updateGarbageBar(this.garbageQueue);
    }
}