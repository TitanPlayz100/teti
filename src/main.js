// @ts-check
import { Game } from "./game.js";
import settings from "./defaultSettings.json" with { type: "json" };
import attacktable from "./attacktable.json" with { type: "json" };
import pieces from "./pieces.json" with { type: "json" };

export class Main {
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    init() {
        

        this.game.movement.initKeyListeners();
        this.game.rendering.sizeCanvas();
        document.onresize = () => {
            this.game.rendering.sizeCanvas();
            this.game.rendering.updateNext();
            this.game.rendering.updateHold();
        }
        this.game.sounds.initSounds();
        this.game.startGame();
        this.game.rendering.renderingLoop();
    }
}

const game = new Game(settings, pieces, attacktable);
game.main.init();

window["menu"] = game.menuactions;
window["modal"] = game.modals;
window["songs"] = game.sounds;