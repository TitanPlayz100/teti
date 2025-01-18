import blocksprites from '../data/blocksprites.json' with { type: 'json' };
import kicks from '../data/kicks.json' with { type: 'json' };
import { defaultSkins } from '../data/data.js';
import { Game } from '../main.js';
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

    constructor() {
        this.visuals = new Visuals();
    }

    async init() {
        this.app = new PIXI.Application();
        await this.app.init({ backgroundAlpha: 0, resizeTo: window, autoDensity: true });
        document.body.prepend(this.app.canvas);

        const labels = ["grid", "board", "clickArea", "next", "hold", "textContainer", "particles"]
        const containers = this.visuals.generateContainers(labels);
        this.board = containers["board"];
        this.particleContainer = containers["particles"];

        Game.particles.initBoard();
        await this.generateTextures();
        this.resize();
        this.generateAllSprites("board", Game.board.boardState, 39);
        this.generateAllSprites("hold", Game.renderer.holdQueueGrid, 2);
        this.generateAllSprites("next", Game.renderer.nextQueueGrid, 15);
        Game.renderer.updateHold();

        this.app.ticker.add(time => this.tick(time));
    }

    resize() {
        const scale = Number(Game.settings.display.boardHeight) / 100;
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
        this.repositionSpeedrunContainer(Number(Game.settings.display.boardHeight) / 100)
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
        reset.on("pointerdown", () => Game.controls.retry(true));
        const settings = iconframe(this.settingsIcon, 0.18, width * 3 / 20)
        settings.on("pointerdown", () => Game.modals.openModal("settingsPanel"));
        const edit = iconframe(this.editIcon, 0.21, width * 6 / 20)
        edit.on("pointerdown", () => Game.modals.openModal("editMenu"));
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
        let url = Game.settings.display.skin;
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

        Game.particles.texture = await PIXI.Assets.load('./assets/particle.png');
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
                mino.on("mousedown", () => Game.boardeditor.mouseDown([x, y], mino));
                mino.on("mouseenter", () => Game.boardeditor.mouseEnter([x, y], mino));
                mino.on("mouseleave", () => Game.boardeditor.mouseLeave([x, y], mino));
                clickArea.addChild(mino);
                mino.position.set(x * this.minoSize, y * this.minoSize);
                mino.setSize(this.minoSize);
                mino.alpha = 0;
            }
        }
    }

    generateGrid() {
        if (Game.settings.display.showGrid === false) return;
        const grid = this.app.stage.getChildByLabel("grid");
        const type = Game.settings.display.gridType;
        const opacity = Game.settings.display.gridopacity / 100;
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
        Game.replay.tick();
        Game.controls.runKeyQueue();
        Game.controls.timer();
        this.render("board", Game.board.boardState);
        Game.boardeffects.move(0, 0);
        Game.boardeffects.rotate(0);
        Game.particles.update();
        Game.renderer.dangerParticles();
        this.updateAlpha();
        this.showTextOnTime(60, "60S LEFT");
        this.showTextOnTime(90, "90S LEFT");
        this.TickSpeedrunUI(Game.zenith.GetFloorLevel(Game.stats.altitude))
    }

    showTextOnTime(time, text) {
        if (Game.settings.game.gamemode == "ultra") {
            if (Math.floor(Game.stats.time) == time) {
                Game.renderer.renderTimeLeft(text);
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
                } else if (cell.includes("NP") && Game.renderer.inDanger) { // next piece overlay
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
        const piece = Game.hold.occured && type == "hold" ? "hold" : cell[1].toLowerCase();
        const override = kicks[Game.settings.game.kicktable].color_overrides ?? {};
        return this.textures[override[piece] ?? piece];
    }

    setShadowTint(sprite) {
        if (!Game.settings.display.colouredShadow) return;
        const pieceName = Game.falling.piece.name;
        const override = kicks[Game.settings.game.kicktable].color_overrides ?? {};
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
        if (this.divlock.value != 0 && cell.includes("A") && Game.settings.game.gamemode != "lookahead") {
            return 1 - (this.divlock.value / 250);
        }
        if (Game.settings.game.gamemode == "lookahead") {
            for (let [posX, posY] of this.justPlacedCoords) {
                if (posX == x && posY == y) {
                    return Math.max(this.justPlacedAlpha, this.boardAlpha).toFixed(2);
                }
            }
        }
        return this.boardAlpha.toFixed(2);
    }

    getShadowOpacity() {
        const opacity = Game.settings.display.shadowOpacity / 100;
        if (Game.settings.game.gamemode == "lookahead") return (opacity * this.boardAlpha).toFixed(2);
        return opacity;
    }

    updateAlpha() {
        if (Game.settings.game.gamemode != 'lookahead') return;
        const update = (type, amount) => {
            if (Game.stats.checkInvis()) {
                if (this[type] <= 0) {
                    this[type] = 1;
                    Game.renderer.updateNext();
                    Game.renderer.updateHold();
                }
            } else {
                if (this[type] > 0) {
                    this[type] += -amount / Game.tickrate;
                    Game.renderer.updateNext();
                    Game.renderer.updateHold();
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
        const p = new PIXI.Sprite(Game.particles.texture);
        p.tint = colour
        p.scale.set(0.5);
        this.particleContainer.addChild(p);
        return p;
    }


    _speedrunMeta = {
        container: null,
        splits: [],
        t: 0,
        ShowingCounter : 0,
        FadingCounter : 0,
        HidingCounter : 0,
    };
    


    CreateSpeedrunContainer() {
        if(this._speedrunMeta.container) return
            this._speedrunMeta.container = new PIXI.Container,
            this._speedrunMeta.container.scale.set(.7),
            this._speedrunMeta.container.zIndex = 50,
            console.log(this.app.stage.width)
            this._speedrunMeta.container.position.set(0, 0),
            this.repositionSpeedrunContainer() 
            this._speedrunMeta.container.alpha = 0
            this.app.stage.addChild(this._speedrunMeta.container),
            this._speedrunMeta.splits = [];
            for (let e = 0; e < 9; e++) {
                const t = {
                    container: null,
                    bg: null,
                    outer: null,
                    inner: null,
                    topText: null,
                    bottomText: null
                };
                this._speedrunMeta.splits[e] = t,
                t.container = new PIXI.Container,
                t.container.position.set(110 * (e - 4), 0),
                this._speedrunMeta.container.addChild(t.container),

                t.black = new PIXI.Graphics()
                    .rect(0, 0, 16, 16)
                    .fill(0xFFFFFF);
                t.black.scale.set(6.25, 3.125)
                t.black.tint = 0
                t.container.addChild(t.black),

                t.bg = new PIXI.Graphics()
                    .rect(0, 0, 16, 16)
                    .fill(0xFFFFFF);
                t.bg.scale.set(3.25, 3.125)
                //t.bg.tint = 0
                t.container.addChild(t.bg),

                t.inner = new PIXI.Graphics()
                    .rect(0, 1, 17, 16)
                    .fill(0xFFFFFF);
                t.inner.scale.set(5.875, 2.75)
                t.inner.tint = 0
                t.container.addChild(t.inner),
                

                t.topText = new PIXI.Text(``,{
                    fontSize: 23,
                    weight: 750,
                    anchor: [.5, .5],
                }),
                t.topText.position.y = 12
                t.container.addChild(t.topText)

                t.bottomText = new PIXI.Text(`test`,{
                    fontSize: 15,
                    weight: 750,
                    anchor: [.5, .5],
                }),
                t.bottomText.position.y = 12
                t.container.addChild(t.bottomText)
        }
        console.log(this._speedrunMeta)
    }

    TickSpeedrunUI(floor){
        if(!this._speedrunMeta.container) return

        function ol(e, t, n) {
            n /= 100;
            const s = t * Math.min(n, 1 - n) / 100
              , i = t => {
                const i = (t + e / 30) % 12
                  , o = n - s * Math.max(Math.min(i - 3, 9 - i, 1), -1);
                return Math.round(255 * o)
            }
            ;
            return i(0) << 16 | i(8) << 8 | i(4)
        }

    
        for (let t = 0; t < 9; t++) {
            const s = this._speedrunMeta.splits[t],
                  i = Game.zenith.tickPass;
            s.bg.tint = ol(1.5 * i + 34.7 * t, 100, 70 - 10);
            s.inner.alpha = .75 - ((i / Game.tickrate * 4) % 2) / 10
            let o = 0;
            if(Game.zenith.isHyperspeed){
                switch (Math.floor((i / Game.tickrate * 2) % 2)) {
                case 0:
                    o = -1;
                    break;
                case 1:
                    o = 1;
                    break;
                }
                s.container.y = window.innerHeight - 40 + 4 * o * (t % 2 == 0 ? 1 : -1)
            }
            let oldPB = localStorage.stats ? JSON.parse(localStorage.stats).pbs.zenith : undefined
            if (oldPB && oldPB.pbstats.floorTime == undefined) oldPB = undefined;
            if (floor === t + 1) {
                let progress = (Game.stats.altitude - Game.zenith.FloorDistance[floor - 1]) / (Game.zenith.FloorDistance[floor]- Game.zenith.FloorDistance[floor - 1])
                s.bottomText.style.fill = 16777215
                s.topText.style.fill = 16777215
                s.bg.scale.x = 6.25 * progress
                s.bottomText.alpha = 0;
                if(oldPB){
                    s.topText.text = Game.renderer.formatTime(oldPB.pbstats.floorTime[t],3)
                    s.topText.position.y = 3
                    s.bottomText.position.y = 30
                    s.bottomText.alpha = 1;
                    s.bottomText.tint = oldPB.pbstats.floorTime[t] - Game.stats.time >= 20 ? 16758528 : (Game.stats.time < oldPB.pbstats.floorTime[t] ? 8978176 : 16734354)
                    s.bottomText.text = `${Game.stats.time < oldPB.pbstats.floorTime[t] ? "-" : "+"}${Game.renderer.formatTime(Math.abs(oldPB.pbstats.floorTime[t] - Game.stats.time), 3)}`
                }
                else{
                    s.topText.text = Game.renderer.formatTime(Game.stats.time, 3)
                }
            } else if (floor < t + 1) {
                if(oldPB){
                    s.topText.text = `${Game.renderer.formatTime(oldPB.pbstats.floorTime[t], 3)}`
                }
                else{
                    s.topText.text = `FLOOR ${t + 1}`
                    s.bottomText.alpha = 1;
                }
                s.topText.style.fill = 3355443;
                s.bottomText.style.fill = 3355443;
                s.bottomText.alpha = 0;
                s.bg.tint = 0
                s.topText.position.y = 12
            } else {
                s.bg.scale.x = 6.25
            }

        }
    }

    StartSpeedrun(){
        this._speedrunMeta.container.alpha = 1

        CustomEase.create("splitsStart", ".21, .45, .73, .99");

        for (let e = 0; e < 9; e++){
            this._speedrunMeta.splits[e].container.pivot.y = 0,
            this._speedrunMeta.splits[e].container.rotation = 0,
            this._speedrunMeta.splits[e].container.alpha = 1,
            this._speedrunMeta.splits[e].container.pivot.x = -window.innerWidth * 2,
            setTimeout(( () => {
                gsap.to(this._speedrunMeta.splits[e].container, {
                    pixi: { pivotX: 0},
                    duration: 1,
                    ease: "splitsStart"
                });
            }), 400 + 60 * e);
        }

        Game.animations.playRainbowAnimation(true)
        Game.zenith.isHyperspeed = true
    }

    StopSpeedrun(){
        CustomEase.create("splitsDrop", ".21, .45, .73, .99");

        for (let e = 0; e < 9; e++){
            this._speedrunMeta.splits[e].container.pivot.y = 0,
            this._speedrunMeta.splits[e].container.rotation = 0,
            setTimeout(( () => {
                gsap.to(this._speedrunMeta.splits[e].container, {
                    pixi: { pivotY: -100, rotation: .2 * Math.random() - .1, alpha: 0},
                    duration: 1,
                    ease: "splitsDrop"
                });
            }), 150 * Math.random());

            // setTimeout(( () => {
            //     Rl.animate(t.splits[e].container, {
            //         0: {
            //             "pivot.y": 0,
            //             rotation: 0,
            //             alpha: 1
            //         },
            //         1: {
            //             "pivot.y": -100,
            //             rotation: .2 * Math.random() - .1,
            //             alpha: 0
            //         }
            //     }, .5, s(.21, .45, .73, .99))
            // }
            // ), 150 * Math.random());
        }

        Game.animations.playRainbowAnimation(false)
        Game.zenith.isHyperspeed = false
    }

    WinSpeedrun(){
        CustomEase.create("splitsFly", ".55, .02, .94, .67");

        for (let e = 0; e < 9; e++){
            this._speedrunMeta.splits[e].container.pivot.y = 0,
            setTimeout(( () => {
                gsap.to(this._speedrunMeta.splits[e].container, {
                    pixi: { pivotY: 100, alpha: 0},
                    duration: 1,
                    ease: "splitsFly"
                });
            }), 4e3 + 150 * Math.random());
        }
        Game.animations.playRainbowAnimation(false)
        Game.zenith.isHyperspeed = false
    }

    repositionSpeedrunContainer(scale){
        if(!this._speedrunMeta.container) return
        this._speedrunMeta.container.pivot.set(-window.innerWidth * .69, -window.innerHeight / 3.5)
        //this._speedrunMeta.container.scale.set(scale)
    }

}
