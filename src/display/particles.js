//@ts-check
import { Game } from "../game.js";

class Point {
    constructor(particleInfo, ctx) {
        const { x, y, colour, size, life, dx, dy, sway, xF, yF, swayF, gravity, twinkle, twinkleTime } = particleInfo;
        this.x = x;
        this.y = y;
        this.size = size;
        this.colour = colour;
        this.maxLife = life;
        this.life = life;
        this.dx = dx;
        this.dy = dy;
        this.sway = sway ?? 0;
        this.frictionX = xF ?? 1;
        this.frictionY = yF ?? 1;
        this.frictionSway = swayF ?? 1;
        this.gravity = gravity ?? 0;
        this.twinkle = twinkle ?? false;
        this.twinkleTime = twinkleTime ?? this.life;

        this.ctx = ctx;
    }

    draw() {
        this.ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        this.ctx.fillStyle = this.colour;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    update() {
        this.life -= 1;
        this.x += this.dx + Math.sin(this.sway * this.life);
        this.y += this.dy;
        this.dx *= this.frictionX;
        this.dy *= this.frictionY;
        this.sway *= this.frictionSway
        this.dy += this.gravity;
        if (this.twinkle && this.life < this.twinkleTime) this.size = Math.abs((Math.sin(this.life / 15))) * 2;
    }
}

export class Particles {
    particles = [];

    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
        this.ctx = this.game.renderer.ctx;
        this.volume = 60;
        this.size = 1;
    }

    initBoard() {
        this.boardWidth = this.game.renderer.boardWidth;
        this.boardHeight = this.game.renderer.boardHeight;
        this.minosize = this.game.boardrender.minoSize;
    }

    spawnParticles(posX, posY, type, pieceWidth = 1, cw = false, colour = "white") { // todo add danger particles
        const dx = (type == "place" || type == "spin") ? 1 : 0
        const [x, y] = [(posX + dx) * this.minosize, (40 - posY) * this.minosize];
        if (type == "place") this.createPlaceParticles(x, y, colour, this.minosize * pieceWidth, -this.boardHeight);
        if (type == "clear") this.createClearParticles(x, y, colour, this.boardWidth, -10);
        if (type == "pc") this.createPCParticles(x, y, this.boardWidth, 10);
        if (type == "dangerboard") this.createDangerBoardParticles(x, this.boardHeight, colour, this.boardWidth, 10);
        if (type == "dangersides") this.createDangerSidesParticles(x, y, "red", this.boardWidth, 0, 1);
        if (type == "spin") this.createSpinParticles(x, y, colour, cw, this.minosize * pieceWidth, -this.minosize * pieceWidth);
        if (type == "spike") this.createSpikeParticles(x, this.boardHeight, colour, this.boardWidth, -this.boardHeight);
    }

    createPlaceParticles(x, y, colour, len, height) {
        for (let i = 0; i < this.volume / 3; i++) {
            const posX = x + Math.random() * len - len / 2;
            const posY = y + Math.random() * height / 2;
            const life = Math.random() * 35 + 70;
            const dx = Math.random() * 1 - 0.5;
            const dy = Math.random() * -1.2 - 2.4;
            const sway = Math.random() * 0.04 - 0.02;

            const placeParticle = { x: posX, y: posY, colour, size: this.size, life, dx, dy, sway, xF: 0.95, yF: 0.95, swayF: 0.96 }
            const particle = new Point(placeParticle, this.ctx);
            this.particles.push(particle);
        }
    }

    createClearParticles(x, y, colour, len, height) {
        for (let i = 0; i < this.volume; i++) {
            const posX = x + Math.random() * len
            const posY = y + Math.random() * height;
            const life = Math.random() * 20 + 40;
            const dx = Math.random() * 1.5 - 0.75 + (posX - x) / 200;
            const dy = Math.random() * -0.8 - 1.5;

            const clearParticle = { x: posX, y: posY, colour, size: this.size, life, dx, dy, yF: 0.99, gravity: 0.1 }
            const particle = new Point(clearParticle, this.ctx);
            this.particles.push(particle);
        }
    }

    createPCParticles(x, y, len, height) {
        for (let i = 0; i < this.volume; i++) {
            const posX = x + Math.random() * len
            const posY = y + Math.random() * height;
            const life = Math.random() * 100 + 200;
            const dx = Math.random() * 1.5 - 0.75;
            const dy = Math.random() * -8 - 2;
            const colour = `hsl(${Math.random() * 360}, 80%, 60%)`

            const pcParticle = { x: posX, y: posY, colour, size: this.size, life, dx, dy, xF: 0.98, yF: 0.98, twinkle: true, twinkleTime: 130 }
            const particle = new Point(pcParticle, this.ctx);
            this.particles.push(particle);
        }
    }

    createDangerBoardParticles(x, y, colour, len, height) {
        for (let i = 0; i < this.volume / 10; i++) {
            if (Math.random() > this.volume / 500) continue
            const posX = x + Math.random() * len
            const posY = y + Math.random() * height / 2;
            const life = Math.random() * 100 + 200;
            const dx = Math.random() * 1 - 0.5;
            const dy = Math.random() * -1.2 - 2.4;
            const sway = Math.random() * 0.005 - 0.0025;

            const dangerParticle = { x: posX, y: posY, colour, size: this.size, life, dx, dy, sway, swayF: 0.98 }
            const particle = new Point(dangerParticle, this.ctx);
            this.particles.push(particle);
        }
    }

    createDangerSidesParticles(x, y, colour, width, len, height) {
        for (let i = 0; i < this.volume / 10; i++) {
            if (Math.random() > this.volume / 250) continue
            const direction = Math.random() > 0.5;

            const posX = (direction ? 0 : width) + x + Math.random() * len
            const posY = y + Math.random() * height;
            const life = Math.random() * 15 + 30;
            const dx = (direction ? 1 : -1) * (Math.random() * 2 + 2);
            const dy = Math.random() * 2 - 1;

            const dangerSideParticle = { x: posX, y: posY, colour, size: this.size, life, dx, dy, gravity: 0.05 }
            const particle = new Point(dangerSideParticle, this.ctx);
            this.particles.push(particle);
        }
    }

    createSpinParticles(x, y, colour, cw, len, height) {
        len *= 0.5;
        height *= 0.5;
        for (let i = 0; i < this.volume / 3; i++) {
            const posX = x + Math.random() * len - len / 2
            const posY = y + Math.random() * height - height / 2;
            const life = Math.random() * 35 + 70;
            let dx = Math.random() * 1 - 0.5 + (posY - y) / 30;
            let dy = Math.random() * 1 - 0.5 + (posX - x) / 30;
            if (cw) { dx *= -1 } else { dy *= -1 }

            const spinParticle = { x: posX, y: posY, colour, size: this.size, life, dx, dy, xF: 0.98, yF: 0.98 }
            const particle = new Point(spinParticle, this.ctx);
            this.particles.push(particle);
        }
    }

    createSpikeParticles(x, y, colour, len, height) {
        for (let i = 0; i < this.volume / 2; i++) {
            const posX = x + Math.random() * len
            const posY = y + Math.random() * height / 2;
            const life = Math.random() * 35 + 70;
            const dx = Math.random() * 1 - 0.5;
            const dy = Math.random() * 1 - 0.5;

            const spikeParticle = { x: posX, y: posY, colour, size: this.size, life, dx, dy, xF: 0.96, yF: 0.96, twinkle: true }
            const particle = new Point(spikeParticle, this.ctx);
            this.particles.push(particle);
        }
    }

    update() {
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
    }
}