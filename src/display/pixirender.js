import { Game } from '../game.js';
import * as PIXI from '../../lib/pixi.min.mjs'


export class pixiRender {
    textures = {};

    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

    async init() {
        const newScale = (Number(this.game.settings.display.boardHeight) + 10) / 100;

        this.app = new PIXI.Application();
        await this.app.init({ backgroundAlpha: 0, resizeTo: window });
        document.body.appendChild(this.app.canvas);

        // grid
        const grid = new PIXI.Container();
        this.app.stage.addChild(grid);

        const gridrect = new PIXI.Graphics()
            .rect(0, 0, this.game.renderer.boardWidth, this.game.renderer.boardHeight / 2)
            .fill(0x000000)
            .stroke({ color: 0xffffff, width: 1, alignment: 0.5 })

        gridrect.scale.set(newScale)
        grid.addChild(gridrect);

        grid.x = this.app.screen.width / 2;
        grid.y = this.app.screen.height / 2;
        grid.pivot.x = grid.width / 2;
        grid.pivot.y = grid.height / 2;
        grid.label = "grid";

        // particles
        // const particles = new ParticleContainer();
        // const texture = Texture.from('path/to/bunny.png');

        // for (let i = 0; i < 100000; ++i) {
        //     let particle = new Particle({
        //         texture,
        //         x: Math.random() * 800,
        //         y: Math.random() * 600,
        //     });

        //     container.addParticle(particle);
        // }

        // const particlesrect = new PIXI.Graphics()
        //     .rect(0, 0, this.game.renderer.boardWidth, this.game.renderer.boardHeight / 2)

        // particlesrect.scale.set(newScale)
        // particles.addChild(particlesrect);

        // particles.x = this.app.screen.width / 2;
        // particles.y = this.app.screen.height / 2;
        // particles.pivot.x = particles.width / 2;
        // particles.pivot.y = particles.height / 2;
        // particles.label = "particles";

        // board
        const board = new PIXI.Container();
        this.app.stage.addChild(board);

        const rect = new PIXI.Graphics()
            .rect(0, 0, this.game.renderer.boardWidth, this.game.renderer.boardHeight)
            .fill(0x00ff00, 0.1)

        rect.scale.set(newScale)
        board.addChild(rect);

        board.x = this.app.screen.width / 2;
        board.y = this.app.screen.height / 2 - board.height / 4;
        board.pivot.x = board.width / 2;
        board.pivot.y = board.height / 2;
        board.label = "board";

        this.app.ticker.add((time) => this.tick(time));
    }

    tick(time) {
        this.testRender()
    }

    testRender() {
        this.render("board", this.game.board.boardState, 39, [0, 0]);
    }

    async generateTextures(url) {
        const pieces = ["z", "l", "o", "s", "i", "j", "t", "shadow", "hold", "g", "darkg", "topout"]
        const texture = await PIXI.Assets.load(url);

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
    }

    render(type, array, yPosChange, [dx, dy] = [0, 0]) {
        const newScale = (Number(this.game.settings.display.boardHeight) + 10) / 100;

        /** @type {PIXI.Container} */
        const container = this.app.stage.getChildByLabel(type);
        container.removeChildren();

        array.forEach((row, y) => {
            row.forEach((col, x) => {
                const posX = x * this.game.boardrender.minoSize;
                const posY = (yPosChange - y) * this.game.boardrender.minoSize;
                const cell = col.split(" ");

                /** @type {PIXI.Sprite} */
                let sprite;

                if (cell.includes("A") || cell.includes("S")) { // active or stopped piece
                    sprite = new PIXI.Sprite(this.textures[this.getPiece(type, cell[1])]);
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
                    sprite.x = (posX + dx) * newScale;
                    sprite.y = (posY + dy) * newScale;
                    sprite.width = this.game.boardrender.minoSize * newScale;
                    sprite.height = this.game.boardrender.minoSize * newScale;


                    container.addChild(sprite);
                }
            });
        });

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
        if (this.game.boardrender.divlock.value != 0 && cell.includes("A") && this.game.settings.game.gamemode != "lookahead") {
            return 1 - (this.game.boardrender.divlock.value / 250);
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
