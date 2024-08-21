// @ts-check
import { Game } from "./game.js";
import settings from "./data/defaultSettings.json" with { type: "json" };

export class Main {
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    init() {
        this.game.rendering.sizeCanvas();
        
        this.game.sounds.initSounds();
        this.game.startGame();
        this.game.rendering.renderingLoop();
    }
}

const game = new Game(settings);
game.main.init();

window["menu"] = game.menuactions;
window["modal"] = game.modals;
window["songs"] = game.sounds;

window.addEventListener("keydown", event => {
    game.controls.onKeyDown(event);
})

window.addEventListener("keyup", event => {
    game.controls.onKeyUp(event);
});

document.onresize = () => {
    game.rendering.sizeCanvas();
    game.rendering.updateNext();
    game.rendering.updateHold();
}