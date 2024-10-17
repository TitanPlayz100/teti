import { Game } from '../game.js';
import { defaultSkins } from '../data/data.js';
import blocksprites from '../data/blocksprites.json' with { type: 'json' };

export class PixiRender {
    textures = {};
    minoSize;
    width;
    height;
    resetAnimLength = 30;
    resetAnimCurrent = 30;
    boardAlpha = 1;
    queueAlpha = 1;
    justPlacedCoords = [];
    justPlacedAlpha = 1;
    flashTimes = [];

    divlock = document.getElementById("lockTimer");

    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

    async init() {
        this.app = new PIXI.Application();
        await this.app.init({ backgroundAlpha: 0, resizeTo: window });
        document.body.appendChild(this.app.canvas);

        // grid
        const grid = new PIXI.Container();
        this.app.stage.addChild(grid);
        grid.label = "grid";

        // board
        this.board = new PIXI.Container();
        this.app.stage.addChild(this.board);
        this.board.label = "board";

        const next = new PIXI.Container();
        this.app.stage.addChild(next);
        next.label = "next";

        const hold = new PIXI.Container();
        this.app.stage.addChild(hold);
        hold.label = "hold";

        // particles
        const particles = new PIXI.Container();
        this.app.stage.addChild(particles);
        particles.label = "particles";
        this.game.particles.initBoard();

        // init
        this.generateTextures();
        this.game.particles.loadTexture();
        this.resize();
        this.generateAllSprites("board", this.game.board.boardState, 39, [0, 0]);
        this.generateAllSprites("hold", this.game.renderer.holdQueueGrid, 2, [0, 0]);
        this.generateAllSprites("next", this.game.renderer.nextQueueGrid, 15, [0, 0]);

        this.app.ticker.add(time => this.tick(time));
    }

    resize() {
        const grid = this.app.stage.getChildByLabel("grid");
        const next = this.app.stage.getChildByLabel("next");
        const hold = this.app.stage.getChildByLabel("hold");
        const board = this.app.stage.getChildByLabel("board");
        const particles = this.app.stage.getChildByLabel("particles");

        // clear
        grid.children.forEach(child => child.destroy());
        grid.removeChildren();

        // resize
        const scale = Number(this.game.settings.display.boardHeight) / 100;
        let height = this.app.screen.height * 0.6 * scale; // equivilant to 60vh
        let width = height / 2;
        const screenHeight = Math.floor(this.app.screen.height / 2);
        const screenWidth = Math.floor(this.app.screen.width / 2);
        this.minoSize = height / 20;
        this.width = width;
        this.height = height;

        // board
        const rect = new PIXI.Graphics().rect(0, 0, width, height * 2)
        board.addChild(rect);
        board.x = screenWidth;
        board.y = screenHeight;
        board.pivot.x = width / 2;
        board.pivot.y = height * 3 / 2;

        // hold
        hold.x = screenWidth;
        hold.y = screenHeight;
        hold.pivot.x = width / 2 + width * 2 / 5;
        hold.pivot.y = height / 2;

        // next
        next.x = screenWidth;
        next.y = screenHeight;
        next.pivot.x = width / 2 - width;
        next.pivot.y = height / 2;

        // grid and outline
        const rectGrid = new PIXI.Graphics()
            .rect(0, 0, width, height)
            .stroke({ color: 0xffffff, width: 1, alignment: 0.5 })
        grid.addChild(rectGrid);

        const rectHold = new PIXI.Graphics()
            .rect(0, 0, width * 2 / 5, height * 3 / 20)
            .stroke({ color: 0xffffff, width: 1 })
        grid.addChild(rectHold);
        rectHold.x = - width * 2 / 5;

        const rectNext = new PIXI.Graphics()
            .rect(0, 0, width * 2 / 5, height * 16 / 20)
            .stroke({ color: 0xffffff, width: 1 })
        grid.addChild(rectNext);
        rectNext.x = width;

        grid.x = screenWidth;
        grid.y = screenHeight;
        grid.pivot.x = width / 2;
        grid.pivot.y = height / 2;

        // particles
        particles.x = screenWidth;
        particles.y = screenHeight;
        particles.pivot.x = width / 2;
        particles.pivot.y = height * 3 / 2;

        this.generateGrid();
    }

    // GENRATORS
    async generateTextures() {
        let url = this.game.settings.display.skin;
        if (defaultSkins.includes(url)) url = `./assets/skins/${url}.png`;
        const texture = await PIXI.Assets.load(url);
        const spritesheet = new PIXI.Spritesheet(texture, blocksprites);
        await spritesheet.parse();
        this.textures = spritesheet.textures;
        this.game.renderer.updateNext();
        this.game.renderer.updateHold();

        const triangleGraphic = new PIXI.Graphics().poly([0, 0, 10, 0, 0, 10]).fill(0xffffff, 0.4);
        this.triangle = this.app.renderer.generateTexture(triangleGraphic);

        const triangleGraphic2 = new PIXI.Graphics().poly([0, 0, 100, 0, 0, 100]).fill(0xffffff);
        triangleGraphic2.rotation = Math.PI * 3 / 2
        triangleGraphic2.y = this.height * 2
        triangleGraphic2.label = "invincible"
        this.resetTriangle = triangleGraphic2;

        const maskTriangle = new PIXI.Graphics().poly([-this.height, 0, this.width, 0, this.width, this.height + this.width]).fill(0xffffff, 0.4);
        maskTriangle.x = this.width;
        maskTriangle.y = this.height;
        maskTriangle.pivot.x = this.width;
        maskTriangle.label = "invincible";
        this.resetMask = maskTriangle;
    }

    generateAllSprites(type, array, yPosChange, [dx, dy] = [0, 0]) {
        const container = this.app.stage.getChildByLabel(type);

        array.forEach((row, y) => {
            row.forEach((col, x) => {
                const posX = x * this.minoSize;
                const posY = (yPosChange - y) * this.minoSize;
                const sprite = new PIXI.Sprite(this.textures['g']);
                sprite.x = (posX + dx);
                sprite.y = (posY + dy);
                sprite.width = this.minoSize;
                sprite.height = this.minoSize;
                sprite.visible = false;
                sprite.label = `invincible ${x}${y}`;
                container.addChild(sprite);
            });
        });
    }

    generateGrid() {
        if (this.game.settings.display.showGrid === false) return;
        const grid = this.app.stage.getChildByLabel("grid");
        const type = this.game.settings.display.gridType;
        const opacity = this.game.settings.display.gridopacity / 100;
        const gridGraphic = new PIXI.Graphics();

        if (type == "square") {
            gridGraphic.rect(0, 0, this.minoSize, this.minoSize)
                .stroke({ color: 0xffffff, width: 1, alpha: opacity })
        } else if (type == "round") {
            gridGraphic.roundRect(0, 0, this.minoSize, this.minoSize, 8)
                .stroke({ color: 0xffffff, width: 1, alpha: opacity })
        } else if (type == "dot") {
            gridGraphic.circle(2, 2, 1)
                .fill(0xffffff, opacity)
        }
        const texture = this.app.renderer.generateTexture(gridGraphic);

        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                const gridSquare = new PIXI.Sprite(texture);
                gridSquare.x = x * this.minoSize;
                gridSquare.y = y * this.minoSize;
                grid.addChild(gridSquare);
            }
        }
    }

    // RENDER CLOCK
    tick(time) {
        this.render("board", this.game.board.boardState);
        this.game.boardeffects.move(0, 0);
        this.game.boardeffects.rotate(0);
        this.game.particles.update();
        this.game.renderer.dangerParticles();
        this.game.pixi.resetAnimation();
        this.updateAlpha();
        if (this.game.settings.game.gamemode == "ultra" && Math.floor(this.game.stats.time) == 60) this.game.renderer.renderTimeLeft("60S LEFT");
        if (this.game.settings.game.gamemode == "ultra" && Math.floor(this.game.stats.time) == 90) this.game.renderer.renderTimeLeft("30S LEFT");
    }

    // RENDERING
    render(type, array) {
        if (this.app === undefined) return;

        /** @type {PIXI.Container} */
        const container = this.app.stage.getChildByLabel(type);
        const c = [...container.children];
        c.forEach(child => {
            if (child.label.split(" ")[0] == "invincible") return;
            child.destroy(); // fixed a memory leak (-2 hours)
            container.removeChild(child);
        });

        array.forEach((row, y) => {
            row.forEach((col, x) => {
                const cell = col.split(" ");
                let sprite = container.getChildByLabel(`invincible ${x}${y}`);
                sprite.visible = false;
                if (cell.includes("A") || cell.includes("S")) { // active or stopped piece
                    sprite.visible = true;
                    sprite.texture = this.textures[this.getPiece(type, cell[1].toLowerCase())];
                    sprite.alpha = this.getOpacity(cell, type, x, y) ?? this.queueAlpha;
                } else if (cell.includes("NP") && this.game.renderer.inDanger) { // next piece overlay
                    sprite.visible = true;
                    sprite.texture = this.textures["topout"];
                    sprite.alpha = 0.32;
                } else if (cell.includes("Sh")) { // shadow piece
                    const pieceName = this.game.settings.display.colouredShadow ? this.game.falling.piece.name : "shadow";
                    sprite.visible = true;
                    sprite.texture = this.textures[pieceName];
                    sprite.alpha = this.getShadowOpacity();
                }
            });
        });

        if (type == "board") this.updateMinoFlash(container);
    }

    updateMinoFlash(cont) {
        this.flashTimes = this.flashTimes
            .filter(({ c, t }) => t > 0)
            .map(({ c, t }) => { return { c, t: t - 1 }; });

        for (let { c, t } of this.flashTimes) {
            const [x, y] = c;
            const progress = (t / 15) * this.minoSize;
            const triangle = new PIXI.Sprite(this.triangle);
            triangle.x = x * this.minoSize;
            triangle.y = (39 - y) * this.minoSize;
            triangle.width = progress;
            triangle.height = progress;

            cont.addChild(triangle);
        }
    }

    getPiece(type, cell) {
        return this.game.hold.occured && type == "hold" ? "hold" : cell;
    }

    getOpacity(cell, type, x, y) {
        if (type != "board") return;
        if (this.divlock.value != 0 && cell.includes("A") && this.game.settings.game.gamemode != "lookahead") {
            return 1 - (this.divlock.value / 250);
        }
        if (this.game.settings.game.gamemode == "lookahead") {
            for (let [posX, posY] of this.justPlacedCoords) {
                if (posX == x && posY == y) {
                    return Math.max(this.justPlacedAlpha, this.boardAlpha).toFixed(2);
                }
            }
        }

        return this.boardAlpha.toFixed(2);
    }

    getShadowOpacity() {
        const opacity = this.game.settings.display.shadowOpacity / 100;
        if (this.game.settings.game.gamemode == "lookahead") return (opacity * this.boardAlpha).toFixed(2);
        return opacity;
    }

    removeCoords([x, y]) {
        this.justPlacedCoords = this.justPlacedCoords.filter(c => !(c[0] == x && c[1] == y));
        this.flashTimes = this.flashTimes.filter(({ c, t }) => !(c[0] == x && c[1] == y));
    }

    updateAlpha() {
        if (this.game.settings.game.gamemode != 'lookahead') return;
        const update = (type, amount) => {
            if (this.game.stats.checkInvis()) {
                if (this[type] <= 0) {
                    this[type] = 1;
                    this.game.renderer.updateNext();
                    this.game.renderer.updateHold();
                }
            } else {
                if (this[type] > 0) {
                    this[type] += -amount / this.game.tickrate;
                    this.game.renderer.updateNext();
                    this.game.renderer.updateHold();
                } else {
                    this[type] = 0;
                }
            }
        }
        update("boardAlpha", 3)
        update("queueAlpha", 3)
        update("justPlacedAlpha", 6)
    }

    // RESET ANIMATION
    startResetAnimation() {
        this.board.mask = this.resetMask;
        this.board.addChild(this.resetMask);
        this.board.addChild(this.resetTriangle);
        this.game.stopGameTimers();
        this.game.controls.resetting = true;
        this.resetAnimCurrent = 0;
    }

    resetAnimation() {
        if (this.resetAnimCurrent >= this.resetAnimLength * 2) return;
        this.resetAnimCurrent++; // fade after animation
        if (this.boardAlpha < 0.99) this.boardAlpha += 2 / this.resetAnimLength;
        if (this.resetAnimCurrent > this.resetAnimLength) return;

        // animation using mask
        const progress = this.easeInOutCubic(this.resetAnimCurrent / this.resetAnimLength);
        this.resetMask.scale.set(1 - progress, 1 - progress);
        this.resetTriangle.scale.set(progress * 9, progress * 9);

        this.board.mask = this.resetMask;

        if (this.resetAnimCurrent == this.resetAnimLength) this.endResetAnimation();
    }

    endResetAnimation() {
        this.game.startGame();
        this.game.controls.resetting = false;
        this.boardAlpha = 0;
        setTimeout(() => {
            this.board.removeChild(this.resetMask);
            this.board.mask = null;
            this.board.removeChild(this.resetTriangle);
        }, 0)
    }

    easeInOutCubic(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }
}
