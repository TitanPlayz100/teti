import { Game } from "../game.js";

class Point {
    constructor(particleInfo, particleInstance) {
        const { x, y, colour, life, dx, dy, sway, xF, yF, swayF, gravity, twinkle, twinkleTime } = particleInfo;
        this.x = x;
        this.y = y;
        this.maxSize = particleInstance.size;
        this.size = this.maxSize;
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

        const particle = new PIXI.Sprite(particleInstance.texture);
        this.particle = particle;
        this.particle.tint = colour;
        particleInstance.container.addChild(particle);
        particleInstance.particles.push(this);
    }

    draw() {
        this.particle.alpha = Math.max(0, this.life / this.maxLife);
        this.particle.x = this.x;
        this.particle.y = this.y;
        this.particle.scale.set(0.5 * this.size)
    }

    update() {
        this.life -= 1;
        this.x += this.dx + Math.sin(this.sway * this.life);
        this.y += this.dy;
        this.dx *= this.frictionX;
        this.dy *= this.frictionY;
        this.sway *= this.frictionSway
        this.dy += this.gravity;
        if (this.twinkle && this.life < this.twinkleTime)
            this.size = Math.abs((Math.sin(this.life / 15))) * this.maxSize;
    }
}

export class Particles {
    /** @type {Point[]} */
    particles = [];

    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

    initBoard() {
        this.container = this.game.pixi.app.stage.getChildByLabel("particles");
    }

    async loadTexture() {
        this.texture = await PIXI.Assets.load('./assets/particle.png');
    }

    spawnParticles(posX, posY, type, pieceWidth = 1, cw = false, colour = "white") {
        if (!this.game.settings.display.particles) return;

        const boardWidth = this.game.pixi.width;
        const boardHeight = this.game.pixi.height * 2;
        const minosize = this.game.pixi.minoSize;
        const [x, y] = [posX * minosize, (40 - posY) * minosize];
        this.volume = this.game.settings.display.particleVolume;
        this.size = this.game.settings.display.particleSize;
        if (type == "drop") this.creatDropParticles(x, y, colour, minosize * pieceWidth, -boardHeight);
        if (type == "lock") this.createLockParticles(x, y, colour, minosize * pieceWidth, 10);
        if (type == "clear") this.createClearParticles(x, y, colour, boardWidth, -10);
        if (type == "pc") this.createPCParticles(x, y, boardWidth, 10);
        if (type == "dangerboard") this.createDangerBoardParticles(x, boardHeight, colour, boardWidth, 10);
        if (type == "dangersides") this.createDangerSidesParticles(x, y, "red", boardWidth, 0, 1);
        if (type == "spin") this.createSpinParticles(x, y, colour, cw, minosize * pieceWidth, -minosize * pieceWidth);
        if (type == "spike") this.createSpikeParticles(x, boardHeight, colour, boardWidth, -boardHeight);
        if (type == "BTB") this.createBTBParticle(x, y, "gold", boardWidth, 0, boardHeight);
    }

    creatDropParticles(x, y, colour, len, height) {
        for (let i = 0; i < this.volume / 3; i++) {
            const posX = x + Math.random() * len
            const posY = y + Math.random() * height / 2;
            const life = Math.random() * 35 + 70;
            const dx = Math.random() * 0.8 - 0.2;
            const dy = Math.random() * -1.2 - 2.4;
            const sway = Math.random() * 0.04 - 0.02;

            const placeParticle = { x: posX, y: posY, colour, life, dx, dy, sway, xF: 0.93, yF: 0.93, swayF: 0.93 }
            new Point(placeParticle, this);
        }
    }

    createLockParticles(x, y, colour, len, height) {
        for (let i = 0; i < this.volume / 4; i++) {
            const posX = x + Math.random() * len;
            const posY = y + Math.random() * height;
            const life = Math.random() * 15 + 30;
            const dx = Math.random() * 1 - 0.5 + (posX - x - len / 2) / 30
            const dy = Math.random() * -0.7 - 1.4;

            const clearParticle = { x: posX, y: posY, colour, life, dx, dy, xF: 0.96, yF: 0.96, gravity: 0.05 }
            new Point(clearParticle, this);
        }
    }

    createClearParticles(x, y, colour, len, height) {
        for (let i = 0; i < this.volume; i++) {
            const posX = x + Math.random() * len
            const posY = y + Math.random() * height;
            const life = Math.random() * 20 + 40;
            const dx = Math.random() * 1.5 - 0.75 + (posX - x - len / 2) / 150;
            const dy = Math.random() * -0.8 - 1.5;

            const clearParticle = { x: posX, y: posY, colour, life, dx, dy, yF: 0.99, gravity: 0.1 }
            new Point(clearParticle, this);
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

            const pcParticle = { x: posX, y: posY, colour, life, dx, dy, xF: 0.98, yF: 0.98, twinkle: true, twinkleTime: 130 }
            new Point(pcParticle, this);
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

            const dangerParticle = { x: posX, y: posY, colour, life, dx, dy, sway, swayF: 0.98 }
            new Point(dangerParticle, this);
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

            const dangerSideParticle = { x: posX, y: posY, colour, life, dx, dy, gravity: 0.05 }
            new Point(dangerSideParticle, this);
        }
    }

    createSpinParticles(x, y, colour, cw, len, height) {
        len *= 0.5;
        height *= 0.5;
        for (let i = 0; i < this.volume / 5; i++) {
            const posX = x + Math.random() * len
            const posY = y + Math.random() * height
            const life = Math.random() * 35 + 70;
            let dx = Math.random() * 1 - 0.5 + (posY - y) / 50;
            let dy = Math.random() * 1 - 0.5 + (posX - x) / 50;
            if (cw) { dx *= -1 } else { dy *= -1 }

            const spinParticle = { x: posX, y: posY, colour, life, dx, dy, xF: 0.98, yF: 0.98 }
            new Point(spinParticle, this);
        }
    }

    createSpikeParticles(x, y, colour, len, height) {
        for (let i = 0; i < this.volume / 2; i++) {
            const posX = x + Math.random() * len
            const posY = y + Math.random() * height / 2;
            const life = Math.random() * 35 + 70;
            const dx = Math.random() * 1 - 0.5;
            const dy = Math.random() * 1 - 0.5;

            const spikeParticle = { x: posX, y: posY, colour, life, dx, dy, xF: 0.96, yF: 0.96, twinkle: true }
            new Point(spikeParticle, this);
        }
    }

    createBTBParticle(x, y, colour, width, len, height) {
        for (let i = 0; i < this.volume * 2; i++) {
            const direction = Math.random() > 0.5;

            const posX = (direction ? 0 : width) + x + Math.random() * len
            const posY = y + Math.random() * height;
            const life = Math.random() * 25 + 50;
            const dx = (direction ? 1 : -1) * (Math.random() * 2);
            const dy = Math.random() * 2 - 1;

            const BTBParticle = { x: posX, y: posY, colour, life, dx, dy, gravity: 0.15 }
            new Point(BTBParticle, this);
        }
    }

    clearParticles() { // there was a memory leak... so i fixed it
        if (this.container == undefined) return;
        const c = [...this.container.children]
        c.forEach(child => { child.destroy(); this.container.removeChild(child); });
        this.particles = new Array();
    }

    update() {
        this.particles.forEach(particle => {
            if (particle.life <= 0) { // something here worked to fix memory leak
                this.container.removeChild(particle.particle);
                // particle.particle.destroy();
            }
        })
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
    }
}