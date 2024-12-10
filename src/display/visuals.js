import { Game } from "../main.js";

export class Visuals {
    textSprites = {};

    newContainer(label, parent) {
        const container = new PIXI.Container();
        parent.addChild(container);
        container.label = label;

        return container;
    }

    generateContainers(labels) {
        /**@type {Record<string, PIXI.Container>} */
        const containers = {};
        labels.forEach(label => {
            const container = this.newContainer(label, Game.pixi.app.stage);
            containers[label] = container;
        });
        return containers;
    }

    /**
     * @param {{dx: number, dy: number, pivotdx: number, pivotdy: number}} scales 
     * @param {{sw:number, sh:number, bw:number, bh:number}} consts
    */
    baseContainer(label, scales, consts, graphic = null, removeChildren = false) {
        const container = Game.pixi.app.stage.getChildByLabel(label);
        if (removeChildren) {
            container.children.forEach(child => child.destroy());
            container.removeChildren();
        }
        if (graphic != null) container.addChild(graphic);

        container.x = consts.sw + scales.dx;
        container.y = consts.sh + scales.dy;
        container.pivot.x = consts.bw / 2 + scales.pivotdx;
        container.pivot.y = consts.bh / 2 + scales.pivotdy;
        return container;
    }

    onResize(consts) {
        const width = consts.bw;
        const height = consts.bh;

        const rect = new PIXI.Graphics().rect(0, 0, width, height * 2)
        const clickhold = new PIXI.Graphics().rect(0, 0, width * 2 / 5, height * 3 / 20).fill("transparent");
        clickhold.interactive = true;
        clickhold.cursor = 'pointer'
        clickhold.on("pointerdown", () => Game.modals.openModal("queueModify"));
        clickhold.label = "invincible"

        const clicknext = new PIXI.Graphics().rect(0, 0, width * 2 / 5, height * 16 / 20).fill("transparent");
        clicknext.interactive = true;
        clicknext.cursor = 'pointer'
        clicknext.on("pointerdown", () => Game.modals.openModal("queueModify"));
        clicknext.label = "invincible"

        this.baseContainer("board", { dx: 0, dy: 0, pivotdx: 0, pivotdy: height }, consts, rect);
        this.baseContainer("grid", { dx: 0, dy: 0, pivotdx: 0, pivotdy: 0 }, consts, null, true);
        this.baseContainer("hold", { dx: 0, dy: height * 2 / 20, pivotdx: width * 2 / 5, pivotdy: 0 }, consts, clickhold);
        this.baseContainer("next", { dx: 0, dy: height * 1 / 20, pivotdx: width * -11 / 10, pivotdy: 0 }, consts, clicknext);
        this.baseContainer("clickArea", { dx: 0, dy: 0, pivotdx: 0, pivotdy: 0 }, consts, null, true);
        this.baseContainer("particles", { dx: 0, dy: 0, pivotdx: 0, pivotdy: height }, consts);
        this.baseContainer("textContainer", { dx: 0, dy: 0, pivotdx: 0, pivotdy: 0 }, consts, null, true);
    }

    createGridGraphics(consts, icons, pixi) {
        const width = consts.bw;
        const height = consts.bh;

        /**@type {PIXI.Container} */
        const grid = pixi.app.stage.getChildByLabel("grid");
        
        pixi.boardBG = new PIXI.Graphics()
            .rect(0, 0, width, height)
            .rect(-width * 2 / 5, 0, width * 2 / 5, height * 1 / 4)
            .rect(width, 0, width * 1/2, height * 17 / 20)
            .fill("black")
        pixi.boardBG.alpha = Number(Game.settings.display.boardOpacity)/100;
        grid.addChild(pixi.boardBG);

        pixi.boardDanger = new PIXI.Graphics()
            .rect(0, 0, width, height)
            .fill("red")
        pixi.boardDanger.alpha = 0;
        grid.addChild(pixi.boardDanger);

        pixi.border = new PIXI.Graphics()
            .lineTo(0, height).lineTo(width, height).lineTo(width, 0)
            .stroke({ color: 0xffffff, width: 2, alignment: 0.5 })
        grid.addChild(pixi.border);

        const rectHold = new PIXI.Graphics()
            .moveTo(0, height * 1 / 4).lineTo(width * 2 / 5, height * 1 / 4)
            .stroke({ color: 0xffffff, width: 1 })
        grid.addChild(rectHold);
        rectHold.x = - width * 2 / 5;

        const rectNext = new PIXI.Graphics()
            .moveTo(0, height * 17 / 20).lineTo(width * 1/2, height * 17 / 20)
            .stroke({ color: 0xffffff, width: 1 })
        grid.addChild(rectNext);
        rectNext.x = width;

        grid.addChild(icons.reset);
        grid.addChild(icons.settings);
        grid.addChild(icons.edit);
        pixi.editButton = icons.edit;
    }

    createTextGraphic(style, name, pos, parent, alpha = 0, msg = "") {
        const text = new PIXI.Text({ text: msg, style });
        text.resolution = 2;
        text.alpha = alpha;
        text.position.set(this.textPosConsts.width * pos.x + pos.dx,
            this.textPosConsts.height * pos.y + pos.dy);
        text.anchor.set(pos.anchorX, pos.anchorY);
        parent.addChild(text);
        this.textSprites[name] = text;
        return text;
    }

    createTexts(pixi, scales) {
        const width = scales.bw;
        const height = scales.bh;
        this.textPosConsts = { width, height };
        const defaultPos = { x: 0, y: 0, dx: 0, dy: 0, anchorX: 0, anchorY: 0 };
        pixi.statTexts = [];

        const grid = pixi.app.stage.getChildByLabel("grid");
        const txtCnt = pixi.app.stage.getChildByLabel("textContainer");

        const style = new PIXI.TextStyle({ fontFamily: "MajorMonoDisplay", fontSize: 18, fill: "white", fontWeight: "bold", letterSpacing: 1 });
        const warningstyle = new PIXI.TextStyle({ fontFamily: "Montserrat, sans-serif", fontSize: 18, fill: "red", fontWeight: "bold", letterSpacing: 1 });
        const actionStyle = new PIXI.TextStyle({ fontFamily: "MajorMonoDisplay", fontSize: 24, fill: "white", fontWeight: "bold" });
        const pcstyle = new PIXI.TextStyle({ fontFamily: "MajorMonoDisplay", fontSize: 24, fill: "yellow", fontWeight: "bold", stroke: { color: "orange", width: 2 } });
        const timeLeftStyle = new PIXI.TextStyle({ fontFamily: "Montserrat, sans-serif", fontSize: 20, fill: "gold", fontWeight: "bold" });
        const statStyle = new PIXI.TextStyle({ fontFamily: "MajorMonoDisplay", fontSize: 16, fill: "white", fontWeight: "bold" });
        const statTextStyle = new PIXI.TextStyle({ fontFamily: "Montserrat, sans-serif", fontSize: 18, fill: "#999999" });
        const statSecondaryStyle = new PIXI.TextStyle({ fontFamily: "MajorMonoDisplay", fontSize: 26, fill: "white", fontWeight: "bold" });

        this.createTextGraphic(style, "hold", { ...defaultPos, x: -3.5 / 10 }, grid, 1, "hold");
        this.createTextGraphic(style, "next", { ...defaultPos, x: 11 / 10 }, grid, 1, "next");
        this.createTextGraphic(warningstyle, "warningtext", { ...defaultPos, x: 1 / 2, y: -1 / 20, anchorX: 0.5 }, txtCnt, 0, "! GO DOWN !");
        this.createTextGraphic(actionStyle, "cleartext", { ...defaultPos, y: 3 / 10, anchorX: 1 }, txtCnt);
        this.createTextGraphic(actionStyle, "combotext", { ...defaultPos, y: 4.2 / 10, anchorX: 1 }, txtCnt);
        this.createTextGraphic(actionStyle, "btbtext", { ...defaultPos, y: 5.5 / 10, anchorX: 1 }, txtCnt);
        this.createTextGraphic(actionStyle, "spiketext", { ...defaultPos, x: 0.5, y: 1 / 4, anchorX: 0.5, anchorY: 0.5 }, txtCnt);
        this.createTextGraphic(pcstyle, "pctext", { ...defaultPos, x: 0.5, y: 0.5, anchorX: 0.45, anchorY: 0.5 }, txtCnt, 0, "perfect \n clear");
        this.createTextGraphic(timeLeftStyle, "timelefttext", { ...defaultPos, x: 0.5, y: 1 / 8, anchorX: 0.5 }, txtCnt);
        this.createTextGraphic(statSecondaryStyle, "objectiveText", { ...defaultPos, x: 11 / 10, y: 1 - 3 / 40 }, txtCnt, 1);
        this.createTextGraphic(statTextStyle, "objectiveNameText", { ...defaultPos, x: 11 / 10, y: 1 - 5 / 40 }, txtCnt, 1);
        [0.5, 1.5, 2.5].forEach((pos, i) => {
            const stat = this.createTextGraphic(statStyle, "stat" + i, { ...defaultPos, x: -1 / 20, y: 1 - pos * 2.5 / 20, anchorX: 1 }, txtCnt, 1);
            const statText = this.createTextGraphic(statTextStyle, "statText" + i, { ...defaultPos, x: -1 / 20, y: 1 - pos * 2.5 / 20 - 2 / 40, anchorX: 1 }, txtCnt, 1);
            const statSecondary = this.createTextGraphic(statSecondaryStyle, "statSecondary" + i, { ...defaultPos, x: -7 / 20, y: 1 - pos * 2.5 / 20 - 1 / 40, anchorX: 1 }, txtCnt, 1);
            pixi.statTexts.push({ stat, statText, statSecondary });
        });

        Object.keys(this.textSprites).forEach(key => {
            pixi.texts[key] = { sprite: this.textSprites[key], animation: gsap.timeline() };
        })
    }
}