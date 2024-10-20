import { Game } from '../game.js';
import * as PIXI from '../../lib/pixi.min.mjs'
import { defaultSkins } from '../data/data.js';


export class PixiRender {
    textures = {};
    minoSize;
    width;
    height;

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

        // board
        const board = new PIXI.Container();
        this.app.stage.addChild(board);
        board.label = "board";

        const next = new PIXI.Container();
        this.app.stage.addChild(next);
        next.label = "next";

        const hold = new PIXI.Container();
        this.app.stage.addChild(hold);
        hold.label = "hold";

        // grid
        const grid = new PIXI.Container();
        this.app.stage.addChild(grid);
        grid.label = "grid";

        // particles
        const particles = new PIXI.Container();
        this.app.stage.addChild(particles);
        particles.label = "particles";
        this.game.particles.initBoard();

        // debugging
        const debugging = new PIXI.Container();
        this.app.stage.addChild(debugging);

        this.fpsText = new PIXI.Text("0", { fontFamily: "Arial", fontSize: 20, fill: 0xffffff });
        this.fpsText.x = 10;
        this.fpsText.y = 10;
        debugging.addChild(this.fpsText);
        this.memText = new PIXI.Text("0", { fontFamily: "Arial", fontSize: 20, fill: 0xffffff });
        this.memText.x = 10;
        this.memText.y = 30;
        debugging.addChild(this.memText);
        setInterval(() => {
            this.fpsText.text = "fps: " + Math.round(this.app.ticker.FPS)
            this.memText.text = "mem: " + Math.round(window.performance.memory.usedJSHeapSize / 1000000)
        }, 200);
        debugging.eventMode = 'static'
        debugging.on("pointerdown", () => { // todo can remove
            debugging.alpha = debugging.alpha == 0 ? 1 : 0
        });

        // init
        this.generateTextures();
        this.resize();
        this.app.ticker.add((time) => this.tick(time));
    }

    tick(time) {
        this.render("board", this.game.board.boardState, 39, [0, 0]);
        this.game.boardeffects.move(0, 0);
        this.game.boardeffects.rotate(0);
        this.game.particles.update();
        this.game.renderer.dangerParticles();
        this.game.renderer.resetAnimation();
        // if (this.game.settings.game.gamemode == "ultra" && Math.floor(this.game.stats.time) == 60) this.renderTimeLeft("60S LEFT");
        // if (this.game.settings.game.gamemode == "ultra" && Math.floor(this.game.stats.time) == 90) this.renderTimeLeft("30S LEFT");
    }

    resize() {
        const grid = this.app.stage.getChildByLabel("grid");
        const next = this.app.stage.getChildByLabel("next");
        const hold = this.app.stage.getChildByLabel("hold");
        const board = this.app.stage.getChildByLabel("board");
        const particles = this.app.stage.getChildByLabel("particles");

        // clear
        grid.children.forEach(child => child.destroy());
        board.children.forEach(child => child.destroy());
        grid.removeChildren();
        board.removeChildren();

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
            .rect(0, 0, width * 2 / 5, height * 15 / 20)
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

    }

    async generateTextures() {
        let url = this.game.settings.display.skin;
        if (defaultSkins.includes(url)) url = `./assets/skins/${url}.png`;
        const texture = await PIXI.Assets.load(url);

        const pieces = ["z", "l", "o", "s", "i", "j", "t", "shadow", "hold", "g", "darkg", "topout"] // order in texture

        pieces.forEach((piece, index) => {
            const x = index * 31;
            const y = 0;
            const width = 30;
            const height = 30;
            const rect = new PIXI.Rectangle(x, y, width, height);
            const minotexture = new PIXI.Texture(texture);
            minotexture.frame = rect;
            minotexture.updateUvs();
            this.textures[piece] = minotexture;
        })

        this.game.renderer.updateNext();
        this.game.renderer.updateHold();

    }

    render(type, array, yPosChange, [dx, dy] = [0, 0]) {
        if (this.app === undefined) return;

        /** @type {PIXI.Container} */
        const container = this.app.stage.getChildByLabel(type);
        const c = [...container.children];
        c.forEach(child => {
            child.destroy(); // thats all is needed to fix a memory leak ??? im gonna lose it (-2 hours)
            container.removeChild(child);
        });

        array.forEach((row, y) => {
            row.forEach((col, x) => {
                const posX = x * this.minoSize;
                const posY = (yPosChange - y) * this.minoSize;
                const cell = col.split(" ");

                /** @type {PIXI.Sprite} */
                let sprite;

                if (cell.includes("A") || cell.includes("S")) { // active or stopped piece
                    sprite = new PIXI.Sprite(this.textures[this.getPiece(type, cell[1].toLowerCase())]);
                    sprite.alpha = this.getOpacity(cell, type, x, y) ?? this.game.boardrender.queueAlpha;
                    // todo set mino flash
                } else if (cell.includes("NP") && this.game.renderer.inDanger) { // next piece overlay
                    sprite = new PIXI.Sprite(this.textures["topout"]);
                    sprite.alpha = 0.32;
                } else if (cell.includes("Sh")) { // shadow piece
                    const pieceName = this.game.settings.display.colouredShadow ? this.game.falling.piece.name : "shadow";
                    sprite = new PIXI.Sprite(this.textures[pieceName]);
                    sprite.alpha = this.getShadowOpacity();
                }

                if (sprite) {
                    sprite.x = (posX + dx);
                    sprite.y = (posY + dy);
                    sprite.width = this.minoSize;
                    sprite.height = this.minoSize;

                    container.addChild(sprite);
                }
            });
        });

        // todo add grid back
        // // Draw grid if enabled
        // if (this.game.settings.display.showGrid) {
        //     const gridGraphics = new PIXI.Graphics();
        //     gridGraphics.lineStyle(1, 0xffffff, this.game.settings.display.gridopacity);

        //     grid.forEach((row, y) => {
        //         row.forEach((col, x) => {
        //             const posX = x * this.minoSize;
        //             const posY = (yPosChange - y) * this.minoSize;
        //             gridGraphics.drawRect(posX, posY, this.minoSize, this.minoSize);
        //         });
        //     });
        // }
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
            for (let [posX, posY] of this.game.boardrender.justPlacedCoords) {
                if (posX == x && posY == y) {
                    return Math.max(this.game.boardrender.justPlacedAlpha, game.boardrender.this.boardAlpha).toFixed(2);
                }
            }
        }

        return this.game.boardrender.boardAlpha.toFixed(2);
    }

    getShadowOpacity() {
        const opacity = this.game.settings.display.shadowOpacity / 100;
        if (this.game.settings.game.gamemode == "lookahead") return (opacity * this.game.boardrender.boardAlpha).toFixed(2);
        return opacity;
    }

}
