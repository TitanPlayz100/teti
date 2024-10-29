import { Game } from '../game.js';
import { defaultSkins } from '../data/data.js';
import blocksprites from '../data/blocksprites.json' with { type: 'json' };
import { clearSplash } from '../main.js';

export class PixiRender {
    textures = {};
    minoSize;
    width;
    height;
    boardAlpha = 1;
    queueAlpha = 1;
    justPlacedCoords = [];
    justPlacedAlpha = 1;
    shadowSprites = {};
    editButtonVisible = false;
    currentlyFlashing = {}

    divlock = document.getElementById("lockTimer");

    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

    async init() {
        this.app = new PIXI.Application();
        await this.app.init({ backgroundAlpha: 0, resizeTo: window, autoDensity: true });
        document.body.prepend(this.app.canvas);

        // grid
        const grid = new PIXI.Container();
        this.app.stage.addChild(grid);
        grid.label = "grid";

        // board
        this.board = new PIXI.Container();
        this.app.stage.addChild(this.board);
        this.board.label = "board";

        const clickArea = new PIXI.Container();
        this.app.stage.addChild(clickArea);
        clickArea.label = "clickArea";

        const next = new PIXI.Container();
        this.app.stage.addChild(next);
        next.label = "next";

        const hold = new PIXI.Container();
        this.app.stage.addChild(hold);
        hold.label = "hold";

        const textContainer = new PIXI.Container();
        this.app.stage.addChild(textContainer);
        textContainer.label = "textContainer";

        // particles
        const particles = new PIXI.Container();
        this.app.stage.addChild(particles);
        particles.label = "particles";
        this.game.particles.initBoard();

        // init
        await this.generateTextures();
        this.resize();
        this.generateAllSprites("board", this.game.board.boardState, 39, [0, 0]);
        this.generateAllSprites("hold", this.game.renderer.holdQueueGrid, 2, [0, 0]);
        this.generateAllSprites("next", this.game.renderer.nextQueueGrid, 15, [0, 0]);
        this.game.renderer.updateNext();
        this.game.renderer.updateHold();

        this.app.ticker.add(time => this.tick(time));

        gsap.registerPlugin(PixiPlugin);
        PixiPlugin.registerPIXI(PIXI);
    }

    resize() {
        const grid = this.app.stage.getChildByLabel("grid");
        const next = this.app.stage.getChildByLabel("next");
        const hold = this.app.stage.getChildByLabel("hold");
        const board = this.app.stage.getChildByLabel("board");
        const clickArea = this.app.stage.getChildByLabel("clickArea");
        const particles = this.app.stage.getChildByLabel("particles");
        const textContainer = this.app.stage.getChildByLabel("textContainer");

        // clear
        grid.children.forEach(child => child.destroy());
        grid.removeChildren();
        clickArea.children.forEach(child => child.destroy());
        clickArea.removeChildren();
        textContainer.removeChildren();

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
        const clickRectHold = new PIXI.Graphics().rect(0, 0, width * 2 / 5, height * 3 / 20).fill("transparent");
        clickRectHold.interactive = true;
        clickRectHold.cursor = 'pointer'
        clickRectHold.on("pointerdown", () => this.game.modals.openModal("queueModify"));
        clickRectHold.label = "invincible"
        hold.addChild(clickRectHold);
        hold.x = screenWidth;
        hold.y = screenHeight + height * 2 / 20;
        hold.pivot.x = width / 2 + width * 2 / 5;
        hold.pivot.y = height / 2;

        // next
        const clickRectNext = new PIXI.Graphics().rect(0, 0, width * 2 / 5, height * 16 / 20).fill("transparent");
        clickRectNext.interactive = true;
        clickRectNext.cursor = 'pointer'
        clickRectNext.on("pointerdown", () => this.game.modals.openModal("queueModify"));
        clickRectNext.label = "invincible"
        next.addChild(clickRectNext);
        next.x = screenWidth;
        next.y = screenHeight + height * 1 / 20;
        next.pivot.x = width / 2 - width * 11 / 10;
        next.pivot.y = height / 2;

        const rect2 = new PIXI.Graphics().rect(0, 0, width, height).fill("transparent");
        rect2.interactive = true;
        rect2.cursor = 'pointer'
        rect2.on("pointerdown", () => console.log("click"));
        clickArea.addChild(rect2);
        clickArea.x = screenWidth;
        clickArea.y = screenHeight;
        clickArea.pivot.x = width / 2;
        clickArea.pivot.y = height / 2;

        // grid and outline
        const { textHold, textNext } = this.textGraphics(width);
        const { settings, reset, edit } = this.buttonGraphics(width);

        this.boardDanger = new PIXI.Graphics()
            .rect(0, 0, width, height)
            .fill("red")
        this.boardDanger.alpha = 0;
        grid.addChild(this.boardDanger);

        this.border = new PIXI.Graphics()
            .lineTo(0, height).lineTo(width, height).lineTo(width, 0)
            .stroke({ color: 0xffffff, width: 2, alignment: 0.5 })
        grid.addChild(this.border);

        const rectHold = new PIXI.Graphics()
            .moveTo(0, height * 1 / 4).lineTo(width * 2 / 5, height * 1 / 4)
            .stroke({ color: 0xffffff, width: 1 })
        grid.addChild(rectHold);
        rectHold.x = - width * 2 / 5;
        grid.addChild(textHold);

        const rectNext = new PIXI.Graphics()
            .moveTo(0, height * 17 / 20).lineTo(width * 2 / 5, height * 17 / 20)
            .stroke({ color: 0xffffff, width: 1 })
        grid.addChild(rectNext);
        rectNext.x = width;
        grid.addChild(textNext);

        grid.addChild(reset);
        grid.addChild(settings);
        grid.addChild(edit);
        this.editButton = edit;

        grid.x = screenWidth;
        grid.y = screenHeight;
        grid.pivot.x = width / 2;
        grid.pivot.y = height / 2;

        // particles
        particles.x = screenWidth;
        particles.y = screenHeight;
        particles.pivot.x = width / 2;
        particles.pivot.y = height * 3 / 2;

        // action text
        textContainer.x = screenWidth;
        textContainer.y = screenHeight;
        textContainer.pivot.x = width / 2;
        textContainer.pivot.y = height / 2;

        textContainer.addChild(this.actionTexts.cleartext.sprite)
        textContainer.addChild(this.actionTexts.combotext.sprite)
        textContainer.addChild(this.actionTexts.btbtext.sprite)
        textContainer.addChild(this.actionTexts.spiketext.sprite)
        textContainer.addChild(this.actionTexts.pctext.sprite)
        textContainer.addChild(this.actionTexts.timeleft.sprite)
        this.statTexts.forEach((text) => {
            textContainer.addChild(text.stat);
            textContainer.addChild(text.statText);
            textContainer.addChild(text.statSecondary);
        });
        textContainer.addChild(this.objectiveTexts[0])
        textContainer.addChild(this.objectiveTexts[1])

        this.generateGrid();
        this.resetAnimGraphic();
        this.generateClickMinos(clickArea);
    }

    // TEXT
    textGraphics(width) {
        const style = new PIXI.TextStyle({ fontFamily: "Major Mono Display", fontSize: 18, fill: 0xffffff, fontWeight: "bold", letterSpacing: 1 });

        const textHold = new PIXI.Text({ text: "hold", style });
        textHold.x = - width * 3.5 / 10;
        textHold.resolution = 2;

        const textNext = new PIXI.Text({ text: "next", style });
        textNext.x = width * 11 / 10;
        textNext.resolution = 2;

        const actionStyle = new PIXI.TextStyle({ fontFamily: "Major Mono Display", fontSize: 24, fill: "white", fontWeight: "bold" });
        const actionText = (pos) => {
            const text = new PIXI.Text({ text: "", style: actionStyle });
            text.resolution = 2;
            text.alpha = 0;
            text.y = pos * width * 1.5 / 10 + width * 3 / 5;
            text.anchor.x = 1;
            text.text = ""
            return { sprite: text, animation: gsap.timeline() };
        }

        const pcstyle = new PIXI.TextStyle({ fontFamily: "Major Mono Display", fontSize: 24, fill: "yellow", fontWeight: "bold", stroke: { color: "orange", width: 2 } });
        const pcText = new PIXI.Text({ text: "perfect \n clear", style: pcstyle });
        pcText.resolution = 2;
        pcText.alpha = 0;
        pcText.x = this.width / 2;
        pcText.y = this.height / 2;
        pcText.pivot.x = pcText.width / 2 - 10;
        pcText.pivot.y = pcText.height / 2;

        const timeLeftStyle = new PIXI.TextStyle({ fontFamily: "Montserrat", fontSize: 20, fill: "gold", fontWeight: "bold" });
        const timeLeftText = new PIXI.Text({ text: "", style: timeLeftStyle });
        timeLeftText.resolution = 2;
        timeLeftText.alpha = 0;
        timeLeftText.x = this.width / 2;
        timeLeftText.y = this.height * 1 / 8;
        timeLeftText.anchor.x = 0.5;

        const spiketext = actionText(3);
        spiketext.sprite.x = this.width / 2;
        spiketext.sprite.y = this.height * 1 / 4;
        spiketext.sprite.anchor.x = 0.5;
        spiketext.sprite.anchor.y = 0.5;

        this.actionTexts = {
            cleartext: actionText(0),
            combotext: actionText(1),
            btbtext: actionText(2),
            spiketext,
            pctext: { sprite: pcText, animation: gsap.timeline() },
            timeleft: { sprite: timeLeftText, animation: gsap.timeline() }
        }

        const statStyle = new PIXI.TextStyle({ fontFamily: "Major Mono Display", fontSize: 16, fill: "white", fontWeight: "bold" });
        const statTextStyle = new PIXI.TextStyle({ fontFamily: "Montserrat", fontSize: 18, fill: "#999999" });
        const statSecondaryStyle = new PIXI.TextStyle({ fontFamily: "Major Mono Display", fontSize: 26, fill: "white", fontWeight: "bold" });
        const statText = (pos) => {
            const stat = new PIXI.Text({ text: "", style: statStyle });
            stat.resolution = 2;
            stat.position.set(-width * 1 / 20, this.height - pos * this.height * 2.5 / 20)
            stat.anchor.x = 1;
            const statText = new PIXI.Text({ text: "", style: statTextStyle });
            statText.resolution = 2;
            statText.position.set(-width * 1 / 20, this.height - pos * this.height * 2.5 / 20 - this.height * 2 / 40)
            statText.anchor.x = 1;
            const statSecondary = new PIXI.Text({ text: "", style: statSecondaryStyle });
            statSecondary.resolution = 2;
            statSecondary.position.set(-width * 7 / 20, this.height - pos * this.height * 2.5 / 20 - this.height * 1 / 40)
            statSecondary.anchor.x = 1;
            return { stat, statText, statSecondary };
        }

        this.statTexts = [
            statText(0.5),
            statText(1.5),
            statText(2.5)
        ]

        const objectiveText = new PIXI.Text({ text: "", style: statSecondaryStyle });
        objectiveText.resolution = 2;
        objectiveText.position.set(width * 11 / 10, this.height - this.height * 3 / 40)

        const objectiveNameText = new PIXI.Text({ text: "", style: statTextStyle });
        objectiveNameText.resolution = 2;
        objectiveNameText.position.set(width * 11 / 10, this.height - this.height * 5 / 40)

        this.objectiveTexts = [objectiveText, objectiveNameText];

        return { textHold, textNext };
    }

    resetActionTexts() {
        Object.keys(this.actionTexts).forEach(key => {
            this.actionTexts[key].animation.pause();
            gsap.to(this.actionTexts[key].sprite, {
                duration: 0.2, pixi: { alpha: 0 },
                onComplete: () => this.actionTexts[key].animation.kill()
            })
        })
        if (this.timeLeftTextSplit) this.timeLeftTextSplit.forEach(s => {
            s.animation.kill();
            s.sprite.destroy();
        });
        this.timeLeftTextSplit = undefined;
    }

    showActionText(type, message) {
        this.actionTexts[type].animation.kill();
        const text = this.actionTexts[type].sprite;
        text.text = message;
        this.actionTexts[type].animation = gsap.timeline({ onComplete: () => this.game.mechanics.spikeCounter = 0 })
            .to(text, { duration: 0.2, pixi: { alpha: 1, x: - this.width * 1 / 10, scaleX: 1 }, ease: "power1.inOut" })
            .to(text, { duration: 2, pixi: { alpha: 1, scaleX: 1.1 } })
            .to(text, { duration: 0.2, pixi: { alpha: 0, x: 0 }, ease: "power1.inOut" })
    }

    showSpikeText(num) {
        this.actionTexts.spiketext.animation.kill();
        const { colour, power } = this.spikeTextStyle();
        const text = this.actionTexts.spiketext.sprite;
        text.text = num;
        this.actionTexts.spiketext.animation = gsap.timeline()
            .to(text, { duration: 0.1, pixi: { alpha: 0.8, tint: colour, scale: (1 + power / 8) } })
            .to(text, { duration: (1 + power / 8) / power, pixi: { alpha: 0.2 }, ease: "power2.in", repeat: power - 1 })
            .to(text, { duration: 0.2, pixi: { alpha: 0 }, ease: "power1.inOut" })
    }

    spikeTextStyle() {
        if (this.game.mechanics.spikeCounter >= 20) return { colour: "#fad9f7", power: 12 };
        if (this.game.mechanics.spikeCounter >= 15) return { colour: "#7ac9fa", power: 8 };
        if (this.game.mechanics.spikeCounter >= 10) return { colour: "#faa823", power: 4 };
        return { colour: "white", power: 1 };
    }

    showPCText() {
        this.actionTexts.pctext.animation.kill();
        const pc = this.actionTexts.pctext.sprite;
        this.actionTexts.pctext.animation = gsap.timeline()
            .to(pc, { duration: 0, pixi: { alpha: 1, scale: 0, rotation: -180 } })
            .to(pc, { duration: 0.5, pixi: { scale: 1.6, rotation: 360 }, ease: "power1.inOut" })
            .to(pc, { duration: 3.5 / 15, pixi: { tint: "orange" }, ease: "power1.inOut", repeat: 15, yoyo: true })
            .to(pc, { duration: 2.5, pixi: { scale: 0, alpha: 0 }, ease: "power3.in" }, "1.5")
    }

    showTimeLeftText(msg) {
        const textContainer = this.app.stage.getChildByLabel("textContainer");
        this.actionTexts.timeleft.animation.kill();
        const text = this.actionTexts.timeleft.sprite;
        text.text = msg;
        const split = this.splitSprite(text)
        this.timeLeftTextSplit = split.map((s, i) => {
            textContainer.addChild(s);
            const animation = gsap.timeline({ onComplete: () => s.destroy() })
                .to(s, { duration: 0, pixi: { alpha: 1, x: s.x, tint: "white" } })
                .to(s, { duration: 3, pixi: { x: s.x + 8 * (i - split.length / 2) } })
                .to(s, { duration: 3 / 20, pixi: { tint: "red" }, repeat: 20, yoyo: true, ease: "none" }, "0")
                .to(s, { duration: 0.5, pixi: { alpha: 0 } }, "2.5")
            return { sprite: s, animation }
        });
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

    generateAllSprites(type, array, yPosChange, [dx, dy] = [0, 0]) {
        const container = this.app.stage.getChildByLabel(type);
        const shadowArray = [];
        array.forEach((row, y) => {
            const shadowRow = []
            row.forEach((col, x) => {
                const posX = x * this.minoSize;
                const posY = (yPosChange - y) * this.minoSize;
                const sprite = new PIXI.Sprite(this.textures['g']);
                sprite.position.set(posX + dx, posY + dy);
                sprite.setSize(this.minoSize);
                sprite.visible = false;
                sprite.label = "invincible";
                shadowRow.push(sprite);
                container.addChild(sprite);
            });
            shadowArray.push(shadowRow);
        });
        this.shadowSprites[type] = shadowArray
    }

    generateClickMinos(clickArea) {
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
        this.render("board", this.game.board.boardState);
        this.game.boardeffects.move(0, 0);
        this.game.boardeffects.rotate(0);
        this.game.particles.update();
        this.game.renderer.dangerParticles();
        this.updateAlpha();
        if (this.game.settings.game.gamemode == "ultra" && Math.floor(this.game.stats.time) == 60) this.game.renderer.renderTimeLeft("60S LEFT");
        if (this.game.settings.game.gamemode == "ultra" && Math.floor(this.game.stats.time) == 90) this.game.renderer.renderTimeLeft("30S LEFT");
    }

    // RENDERING
    render(type, array) {
        const container = this.app.stage.getChildByLabel(type);
        const shadowArray = this.shadowSprites[type];

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
                if (cell.includes("A") || cell.includes("S")) { // active or stopped piece
                    sprite.visible = true;
                    sprite.texture = this.getTexture(type, cell);
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
    }

    getTexture(type, cell) {
        const piece = this.game.hold.occured && type == "hold" ? "hold" : cell[1].toLowerCase()
        return this.textures[piece];
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

    createParticleSprite() {
        return new PIXI.Sprite(this.game.particles.texture);
    }

    toggleDangerBG(danger) {
        gsap.to(this.boardDanger, { duration: 0.2, pixi: { alpha: danger ? 0.1 : 0 } });
        gsap.to(this.border, { duration: 0.2, pixi: { tint: danger ? "red" : "none" } });
    }

    resetAnimation() {
        this.board.mask = this.resetMask;
        this.board.addChild(this.resetMask);
        this.board.addChild(this.resetTriangle);
        this.game.stopGameTimers();
        this.game.controls.resetting = true;

        const animateOpacity = () => {
            gsap.timeline()
                .to(this.board, { duration: 0, pixi: { alpha: 0 } })
                .to(this.board, { duration: 0.2, pixi: { alpha: 1 } })
        }

        gsap.timeline({ onComplete: () => { this.endResetAnimation(); animateOpacity(); } })
            .to(this.resetMask, { duration: 0, pixi: { scale: 1 } })
            .to(this.resetMask, { duration: 0.4, pixi: { scale: 0 }, ease: "power1.inOut", })

        gsap.timeline()
            .to(this.resetTriangle, { duration: 0, pixi: { scale: 0 } })
            .to(this.resetTriangle, { duration: 0.4, pixi: { scale: 9 }, ease: "power1.inOut", })
    }

    endResetAnimation() {
        this.game.startGame();
        this.game.controls.resetting = false;
        this.board.mask = null;
        this.board.removeChild(this.resetMask);
        this.board.removeChild(this.resetTriangle);
    }

    /** @param {PIXI.Text} textSprite */
    splitSprite(textSprite) {
        const target = textSprite;
        const textContent = textSprite.text;
        let currentX = target.x - target.width / 2;
        target.text = "";
        const textChars = textContent.split("");
        /**@type {PIXI.Text[]} */
        let chars = []
        textChars.forEach((char) => {
            const charSprite = new PIXI.Text({ text: char, style: target.style });
            charSprite.x = currentX;
            charSprite.y = target.y;
            currentX += charSprite.width;
            chars.push(charSprite);
        });
        return chars
    }
}
