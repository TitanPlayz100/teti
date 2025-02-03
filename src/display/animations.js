import { Game } from "../main.js";

export class Animations {
    actionTexts = ["cleartext", "combotext", "btbtext", "spiketext", "pctext", "timelefttext"]

    constructor() {
        this.texts = Game.pixi.texts;
        gsap.registerPlugin(PixiPlugin); // gsap animation library
        gsap.registerPlugin(CustomEase); // library to create custom easing
        PixiPlugin.registerPIXI(PIXI);

        this.createRainbowAnimation();
    }

    // text animations
    resetActionTexts() {
        this.actionTexts.forEach(key => {
            this.texts[key].animation.pause();
            gsap.to(this.texts[key].sprite, {
                duration: 0.2, pixi: { alpha: 0 },
                onComplete: () => this.texts[key].animation.kill()
            })
        })
        if (this.timeLeftTextSplit) this.timeLeftTextSplit.forEach(s => {
            s.animation.kill();
            s.sprite.destroy();
        });
        this.timeLeftTextSplit = undefined;
    }

    showActionText(type, message) {
        this.texts[type].animation.kill();
        const text = this.texts[type].sprite;
        text.text = message;
        this.texts[type].animation = gsap.timeline({ onComplete: () => Game.mechanics.spikeCounter = 0 })
            .to(text, { duration: 0.2, pixi: { alpha: 1, x: - Game.pixi.width * 1 / 10, scaleX: 1 }, ease: "power1.inOut" })
            .to(text, { duration: 2, pixi: { alpha: 1, scaleX: 1.1 } })
            .to(text, { duration: 0.2, pixi: { alpha: 0, x: 0 }, ease: "power1.inOut" })
    }

    showSpikeText(num) {
        this.texts.spiketext.animation.kill();
        const { colour, power } = this.spikeTextStyle();
        const text = this.texts.spiketext.sprite;
        text.text = num;
        this.texts.spiketext.animation = gsap.timeline()
            .to(text, { duration: 0.1, pixi: { alpha: 0.8, tint: colour, scale: (1 + power / 8) } })
            .to(text, { duration: (1 + power / 8) / power, pixi: { alpha: 0.2 }, ease: "power2.in", repeat: power - 1 })
            .to(text, { duration: 0.2, pixi: { alpha: 0 }, ease: "power1.inOut" })
    }

    spikeTextStyle() {
        if (Game.mechanics.spikeCounter >= 20) return { colour: "#fad9f7", power: 12 };
        if (Game.mechanics.spikeCounter >= 15) return { colour: "#7ac9fa", power: 8 };
        if (Game.mechanics.spikeCounter >= 10) return { colour: "#faa823", power: 4 };
        return { colour: "white", power: 1 };
    }

    showPCText() {
        this.texts.pctext.animation.kill();
        const pc = this.texts.pctext.sprite;
        this.texts.pctext.animation = gsap.timeline()
            .to(pc, { duration: 0, pixi: { alpha: 1, scale: 0, rotation: -180 } })
            .to(pc, { duration: 0.5, pixi: { scale: 1.6, rotation: 360 }, ease: "power1.inOut" })
            .to(pc, { duration: 3.5 / 15, pixi: { tint: "orange" }, ease: "power1.inOut", repeat: 15, yoyo: true })
            .to(pc, { duration: 2.5, pixi: { scale: 0, alpha: 0 }, ease: "power3.in" }, "1.5")
    }

    showTimeLeftText(msg) {
        const textContainer = Game.pixi.app.stage.getChildByLabel("textContainer");
        this.texts.timelefttext.animation.kill();
        const text = this.texts.timelefttext.sprite;
        text.text = msg;
        const split = this.splitSprite(text)
        this.timeLeftTextSplit = split.map((s, i) => {
            textContainer.addChild(s);
            const animation = gsap.timeline({ onComplete: () => s.destroy() })
                .to(s, { duration: 0, pixi: { alpha: 1, x: s.x, tint: "white" } })
                .to(s, { duration: 5, pixi: { x: s.x + 8 * (i - split.length / 2) } })
                .to(s, { duration: 5 / 20, pixi: { tint: "red" }, repeat: 10, yoyo: true, ease: "none" }, "0")
                .to(s, { duration: 0.8, pixi: { alpha: 0 } }, "2.5")
            return { sprite: s, animation }
        });
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

    // ready set go text
    readySetGoText() {
        this.texts.ready.animation.kill();
        this.texts.set.animation.kill();
        this.texts.go.animation.kill();
        const ready = this.texts.ready.sprite;
        const set = this.texts.set.sprite;
        const go = this.texts.go.sprite;
        this.texts.ready.animation = gsap.timeline()
            .to(ready, { duration: 0, pixi: { alpha: 1, scale: 1 } })
            .to(ready, { duration: 0.5, pixi: { scale: 1.6, alpha: 0 }, ease: "power1.out" })
        this.texts.set.animation = gsap.timeline()
            .to(set, { duration: 0, pixi: { alpha: 0, scale: 1 } })
            .to(set, { duration: 0, pixi: { alpha: 1, scale: 1 } }, 0.3)
            .to(set, { duration: 0.5, pixi: { scale: 1.6, alpha: 0 }, ease: "power1.out" })
        this.texts.go.animation = gsap.timeline()
            .to(go, { duration: 0, pixi: { alpha: 0, scale: 1 } })
            .to(go, { duration: 0, pixi: { alpha: 1, scale: 1 } }, 0.6)
            .to(go, { duration: 1, pixi: { scale: 2, alpha: 0 }, ease: "power1.out" })
    }

    // reset
    resetAnimation() {
        Game.pixi.board.mask = Game.pixi.resetMask;
        Game.pixi.board.addChild(Game.pixi.resetMask);
        Game.pixi.board.addChild(Game.pixi.resetTriangle);
        Game.stopGameTimers();
        Game.controls.resetting = true;
        const animateOpacity = () => {
            gsap.timeline()
                .to(Game.pixi.board, { duration: 0, pixi: { alpha: 0 } })
                .to(Game.pixi.board, { duration: 0.2, pixi: { alpha: 1 } })
        }

        gsap.timeline({ onComplete: () => { this.endResetAnimation(); animateOpacity(); } })
            .to(Game.pixi.resetMask, { duration: 0, pixi: { scale: 1 } })
            .to(Game.pixi.resetMask, { duration: 0.4, pixi: { scale: 0 }, ease: "power1.inOut", })

        gsap.timeline()
            .to(Game.pixi.resetTriangle, { duration: 0, pixi: { scale: 0 } })
            .to(Game.pixi.resetTriangle, { duration: 0.4, pixi: { scale: 9 }, ease: "power1.inOut", })
    }

    endResetAnimation() {
        Game.startGame();
        Game.controls.resetting = false;
        Game.pixi.board.mask = null;
        Game.pixi.board.removeChild(Game.pixi.resetMask);
        Game.pixi.board.removeChild(Game.pixi.resetTriangle);
    }

    toggleDangerBG(danger) {
        gsap.to(Game.pixi.boardDanger, { duration: 0.2, pixi: { alpha: danger ? 0.1 : 0 } });
        gsap.to(Game.pixi.border, { duration: 0.2, pixi: { tint: danger ? "red" : "none" } });
    }

    flashWarning(inDanger) {
        this.texts.warningtext.animation.kill();
        const text = this.texts.warningtext.sprite;
        text.alpha = 0;
        if (!inDanger) return;
        this.texts.warningtext.animation = gsap.timeline()
            .to(text, { duration: 0, pixi: { alpha: 1 }, ease: "power1.inOut" })
            .to(text, { duration: 0.15, pixi: { alpha: 0 }, ease: "power1.inOut", repeat: -1, yoyo: true })
    }

    createRainbowAnimation() {
        this.raindowAnimation = gsap.to("#rainbowLeft, #rainbowRight", {
            y: "-200vh",
            duration: 2,
            ease: "linear",
            repeat: -1,
            paused: true,
        });
    }

    playRainbowAnimation(play) {
        if (play) {
            gsap.to("#rainbowSides", { opacity: 0.9, duration: 1, ease: "power1.out" });
            this.raindowAnimation.play();
        } else {
            gsap.to("#rainbowSides", {
                opacity: 0, duration: 1, ease: "power1.in",
                onComplete: () => this.raindowAnimation.pause()
            });

        }
    }
}