import blocksprites from '../data/blocksprites.json' with { type: 'json' };
import kicks from '../data/kicks.json' with { type: 'json' };
import { defaultSkins } from '../data/data.js';
import { Game } from '../game.js';
import { clearSplash } from '../main.js';
import { getPiece } from '../mechanics/randomisers.js';
import { Visuals } from './visuals.js';

export class PixiRender {
    textures = {};
    minoSize;
    width;
    height;
    boardAlpha = 1;
    queueAlpha = 1;
    justPlacedCoords = [];
    justPlacedAlpha = 1;
    minoSprites = {};
    editButtonVisible = false;
    currentlyFlashing = {}
    statTexts = [];
    /**@type {Record<string,{sprite:PIXI.Text, animation:any}>} */
    texts = {};

    divlock = document.getElementById("lockTimer");

    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
        this.visuals = new Visuals(game);
    }

    async init() {
        this.app = new PIXI.Application();
        await this.app.init({ backgroundAlpha: 0, resizeTo: window, autoDensity: true });
        document.body.prepend(this.app.canvas);

        const labels = ["grid", "board", "clickArea", "next", "hold", "textContainer", "particles"]
        const containers = this.visuals.generateContainers(labels);
        this.board = containers["board"];
        this.particleContainer = containers["particles"];

        this.game.particles.initBoard();
        await this.generateTextures();
        this.resize();
        this.generateAllSprites("board", this.game.board.boardState, 39);
        this.generateAllSprites("hold", this.game.renderer.holdQueueGrid, 2);
        this.generateAllSprites("next", this.game.renderer.nextQueueGrid, 15);
        this.game.renderer.updateHold();

        this.app.ticker.add(time => this.tick(time));
    }

    resize() {
        const scale = Number(this.game.settings.display.boardHeight) / 100;
        const screenHeight = Math.floor(this.app.screen.height / 2);
        const screenWidth = Math.floor(this.app.screen.width / 2);
        this.height = Math.floor(screenHeight * 2 * 0.6 * scale / 40) * 40;
        this.width = this.height / 2;
        this.minoSize = this.height / 20;

        const scaleConsts = { sw: screenWidth, sh: screenHeight, bw: this.width, bh: this.height };
        const icons = this.buttonGraphics(this.width);

        this.visuals.onResize(scaleConsts);
        this.visuals.createGridGraphics(scaleConsts, icons, this);
        this.visuals.createTexts(this, scaleConsts);
        this.generateGrid();
        this.resetAnimGraphic();
        this.generateClickMinos();
    }

    // GRAPHICS and GENERATORS
    buttonGraphics(width) {
        const iconframe = (texture, scale, y) => {
            const icon = new PIXI.Sprite(texture)
            icon.scale.set(scale)
            icon.x = width * 1.525
            icon.y = y
            icon.interactive = true
            icon.cursor = 'pointer'
            icon.alpha = 0.6
            icon.on("pointerover", () => gsap.to(icon, { duration: 0.1, pixi: { alpha: 1, scale: scale * 1.1 }, ease: "power1.inOut" }))
            icon.on("pointerout", () => gsap.to(icon, { duration: 0.3, pixi: { alpha: 0.6, scale: scale }, ease: "power1.inOut" }))
            return icon
        }

        const reset = iconframe(this.resetIcon, 0.23, 0)
        reset.on("pointerdown", () => this.game.controls.retry(true));
        const settings = iconframe(this.settingsIcon, 0.18, width * 3 / 20)
        settings.on("pointerdown", () => this.game.modals.openModal("settingsPanel"));
        const edit = iconframe(this.editIcon, 0.21, width * 6 / 20)
        edit.on("pointerdown", () => this.game.modals.openModal("editMenu"));
        edit.visible = this.editButtonVisible

        return { settings, reset, edit };
    }

    toggleEditButton(bool) {
        this.editButtonVisible = bool
        this.editButton.visible = this.editButtonVisible;
    }

    resetAnimGraphic() {
        if (this.resetTriangle) this.resetTriangle.destroy();
        const triangleGraphic2 = new PIXI.Graphics().poly([0, 0, 100, 0, 0, 100]).fill(0xffffff);
        triangleGraphic2.rotation = Math.PI * 3 / 2
        triangleGraphic2.y = this.height * 2
        triangleGraphic2.label = "invincible"
        this.resetTriangle = triangleGraphic2;

        if (this.resetMask) this.resetMask.destroy();
        const maskTriangle = new PIXI.Graphics().poly([-this.height, 0, this.width, 0, this.width, this.height + this.width]).fill(0xffffff, 0.4);
        maskTriangle.x = this.width;
        maskTriangle.y = this.height;
        maskTriangle.pivot.x = this.width;
        maskTriangle.label = "invincible";
        this.resetMask = maskTriangle;
    }

    async generateTextures() {
        let url = this.game.settings.display.skin;
        if (defaultSkins.includes(url)) url = `./assets/skins/${url}.png`;
        const texture = await PIXI.Assets.load(url);
        const spritesheet = new PIXI.Spritesheet(texture, blocksprites);
        await spritesheet.parse();
        this.textures = spritesheet.textures;

        this.settingsIcon = await PIXI.Assets.load('./assets/icons/settings.svg');
        this.resetIcon = await PIXI.Assets.load('./assets/icons/reset.svg');
        this.editIcon = await PIXI.Assets.load('./assets/icons/edit.svg');

        const triangleGraphic = new PIXI.Graphics().poly([0, 0, 10, 0, 0, 10]).fill(0xffffff, 0.4);
        this.triangle = this.app.renderer.generateTexture(triangleGraphic);

        this.game.particles.texture = await PIXI.Assets.load('./assets/particle.png');
        clearSplash();
    }

    generateAllSprites(type, array, yPosChange) {
        const container = this.app.stage.getChildByLabel(type);
        const shadowArray = [];
        array.forEach((row, y) => {
            const shadowRow = []
            row.forEach((col, x) => {
                const posX = x * this.minoSize;
                const posY = (yPosChange - y) * this.minoSize;
                const sprite = new PIXI.Sprite(this.textures['g']);
                sprite.position.set(posX, posY);
                sprite.setSize(this.minoSize);
                sprite.visible = false;
                sprite.label = "invincible";
                shadowRow.push(sprite);
                container.addChild(sprite);
            });
            shadowArray.push(shadowRow);
        });
        this.minoSprites[type] = shadowArray
    }

    generateClickMinos() {
        const clickArea = this.app.stage.getChildByLabel("clickArea");
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                const mino = new PIXI.Sprite(this.textures['g']);
                mino.interactive = true;
                mino.on("mousedown", () => this.game.boardeditor.mouseDown([x, y], mino));
                mino.on("mouseenter", () => this.game.boardeditor.mouseEnter([x, y], mino));
                mino.on("mouseleave", () => this.game.boardeditor.mouseLeave([x, y], mino));
                clickArea.addChild(mino);
                mino.position.set(x * this.minoSize, y * this.minoSize);
                mino.setSize(this.minoSize);
                mino.alpha = 0;
            }
        }
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
        this.game.controls.runKeyQueue();
        this.game.controls.timer();
        this.render("board", this.game.board.boardState);
        this.game.boardeffects.move(0, 0);
        this.game.boardeffects.rotate(0);
        this.game.particles.update();
        this.game.renderer.dangerParticles();
        this.updateAlpha();
        this.showTextOnTime(60, "60S LEFT");
        this.showTextOnTime(90, "90S LEFT");
    }

    showTextOnTime(time, text) {
        if (this.game.settings.game.gamemode == "ultra") {
            if (Math.floor(this.game.stats.time) == time) {
                this.game.renderer.renderTimeLeft(text);
            }
        }
    }

    // RENDERING
    render(type, array) {
        const container = this.app.stage.getChildByLabel(type);
        const shadowArray = this.minoSprites[type];

        [...container.children].forEach(child => {
            if (child.label.split(" ")[0] == "invincible") return;
            child.destroy(); // fixed a memory leak (-2 hours)
            container.removeChild(child);
        });

        array.forEach((row, y) => {
            row.forEach((col, x) => {
                const cell = col.split(" ");
                const sprite = shadowArray[y][x];
                sprite.visible = false;
                sprite.tint = undefined;
                if (cell.includes("A") || cell.includes("S")) { // active or stopped piece
                    sprite.visible = true;
                    sprite.texture = this.getTexture(type, cell);
                    sprite.alpha = this.getOpacity(cell, type, x, y) ?? this.queueAlpha;
                } else if (cell.includes("NP") && this.game.renderer.inDanger) { // next piece overlay
                    sprite.visible = true;
                    sprite.texture = this.textures["topout"];
                    sprite.alpha = 0.32;
                } else if (cell.includes("Sh")) { // shadow piece
                    sprite.visible = true;
                    sprite.texture = this.textures["shadow"];
                    sprite.alpha = this.getShadowOpacity();
                    this.setShadowTint(sprite)
                }
            });
        });
    }

    getTexture(type, cell) {
        const piece = this.game.hold.occured && type == "hold" ? "hold" : cell[1].toLowerCase();
        const override = kicks[this.game.settings.game.kicktable].color_overrides ?? {};
        return this.textures[override[piece] ?? piece];
    }

    setShadowTint(sprite) {
        if (!this.game.settings.display.colouredShadow) return;
        const pieceName = this.game.falling.piece.name;
        const override = kicks[this.game.settings.game.kicktable].color_overrides ?? {};
        sprite.tint = getPiece(override[pieceName] ?? pieceName).colour;
    }

    flash(coords) {
        coords.forEach(([x, y]) => {
            const triangle = new PIXI.Sprite(this.triangle);
            triangle.x = x * this.minoSize;
            triangle.y = (39 - y) * this.minoSize;
            triangle.label = "invincible";
            this.board.addChild(triangle);
            this.currentlyFlashing[`${x},${y}`] = gsap.timeline({ onComplete: () => this.board.removeChild(triangle) })
                .to(triangle, { duration: 0, pixi: { width: this.minoSize, height: this.minoSize } })
                .to(triangle, { duration: 0.15, pixi: { width: 0, height: 0 }, ease: "power1.inOut", })
        })
    }

    endFlash([x, y]) {
        const a = this.currentlyFlashing[`${x},${y}`];
        if (!a) return;
        a.totalProgress(1).kill();
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

    addNewParticle(colour) {
        const p = new PIXI.Sprite(this.game.particles.texture);
        p.tint = colour
        p.scale.set(0.5);
        this.particleContainer.addChild(p);
        return p;
    }
}
