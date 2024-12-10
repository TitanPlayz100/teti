import { pbTrackingStat } from "../data/data.js";
import { Game } from "../main.js";

export class BoardEffects {
    X = 0;
    Y = 0;
    dX = 0;
    dY = 0;
    friction = 0.7;
    springConstant = 0.015;
    targetX = 0;
    targetY = 0;
    R = 0;
    dR = 0;
    targetR = 0;

    hasPace = true;
    paceCooldown = 0;

    divBoard = document.getElementById("board");

    move(forceX, forceY) {
        this.dX += forceX;
        this.dY += forceY;

        const newdx = this.targetX - this.X;
        const newdy = this.targetY - this.Y;
        const fX = newdx * this.springConstant;
        const fY = newdy * this.springConstant;

        this.dX += fX;
        this.dY += fY;
        this.dX *= this.friction;
        this.dY *= this.friction;
        this.X += this.dX;
        this.Y += this.dY;

        this.X = this.clamp(this.X, 0.5);
        this.Y = this.clamp(this.Y, 0.5);

        if (this.X != 0 || this.Y != 0) {
            Game.pixi.app.canvas.style.translate = `${this.X}px ${this.Y}px`
        }
    }

    rotate(torque) {
        this.dR += torque;
        let newangle = this.targetR - this.R;
        const fangle = newangle * this.springConstant;

        this.dR += fangle;
        this.dR *= this.friction;
        this.R += this.dR;
        this.R = this.clamp(this.R, 0.1);

        if (this.R != 0) {
            Game.pixi.app.canvas.style.rotate = `${this.R}deg`
        }
    }

    clamp(num, min) {
        if (num < min && num > -min) return 0;
        return num
    }

    rainbowBoard() {
        const stats = Game.stats;
        const pbs = Game.profilestats.personalBests;
        const gamemode = Game.settings.game.gamemode;

        if (!Game.settings.display.rainbowPB ||
            !Game.settings.game.competitiveMode ||
            stats.time < 0.5 || pbs[gamemode] == undefined) return;
        if (this.paceCooldown > 0) { this.paceCooldown--; return; }

        const trackingStat = pbTrackingStat[Game.modes.modeJSON.goalStat];
        const current = stats[trackingStat];
        const pbpace = pbs[gamemode].pbstats[trackingStat];
        if (current < pbpace && this.hasPace) {
            Game.sounds.playSound("pbend");
            this.toggleRainbow(false);
        } else if (current >= pbpace && !this.hasPace) {
            Game.sounds.playSound("pbstart");
            this.toggleRainbow(true);
        }

        this.paceCooldown = Game.tickrate * 3;
    }

    toggleRainbow(pace) {
        Game.animations.playRainbowAnimation(pace);
        this.hasPace = pace;
    }
}