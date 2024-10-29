import { pbTrackingStat } from "../data/data.js";
import { Game } from "../game.js";

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

    /**
     * 
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

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
            this.game.pixi.app.canvas.style.translate = `${this.X}px ${this.Y}px`
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
            this.game.pixi.app.canvas.style.rotate = `${this.R}deg`
        }
    }

    clamp(num, min) {
        if (num < min && num > -min) return 0;
        return num
    }

    rainbowBoard() {
        const stats = this.game.stats;
        const pbs = this.game.profilestats.personalBests;
        const gamemode = this.game.settings.game.gamemode;

        if (!this.game.settings.display.rainbowPB ||
            !this.game.settings.game.competitiveMode ||
            stats.time < 0.5 || pbs[gamemode] == undefined) return;
        if (this.paceCooldown > 0) { this.paceCooldown--; return; }

        const trackingStat = pbTrackingStat[this.game.modes.modeJSON.goalStat];
        const current = stats[trackingStat];
        const pbpace = pbs[gamemode].pbstats[trackingStat];
        if (current < pbpace && this.hasPace) {
            this.game.sounds.playSound("pbend");
            this.toggleRainbow(false);
        } else if (current >= pbpace && !this.hasPace) {
            this.game.sounds.playSound("pbstart");
            this.toggleRainbow(true);
        }

        this.paceCooldown = this.game.tickrate * 3;
    }

    toggleRainbow(pace) {
        // todo add back
        // this.border.style.setProperty('--blur-size', pace ? `0.3vmin` : `0vmin`)
        // this.border.style.setProperty('--blur-strength', pace ? '0.7vmin' : '0')
        // this.backboard.style.setProperty('--blur-strength', pace ? '0.5vmin' : '0')
        // this.hasPace = pace;
    }
}