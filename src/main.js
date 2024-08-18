// @ts-check
import { Game } from "./game.js";
import settings from "./defaultSettings.json" with { type: "json" };
import attacktable from "./attacktable.json" with { type: "json" };
import pieces from "./pieces.json" with { type: "json" };
import { songs } from "./data.js";

export class Main {
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    init() {
        this.game.progressDamage.value = 0;
        ['btbtext', 'cleartext', 'combotext', 'pctext', 'linessent'].forEach(id => {
            document.getElementById(id).style.opacity = 0;
        })
        this.game.board.boardState = [...Array(40)].map(() => [...Array(10)].map(() => ""));
        clearLockDelay();
        this.game.rendering.renderDanger();
        clearInterval(this.game.timeouts['stats']);
        this.game.rendering.renderStats();

        this.game.movement.initKeyListeners();
        this.game.rendering.sizeCanvas();
        document.onresize = () => {
            this.game.rendering.sizeCanvas();
            this.game.rendering.updateNext();
            this.game.rendering.updateHold();
        }
        let menuSFX = (e, sfx) => {
            document.querySelectorAll(e).forEach(el => el.onmouseenter = () => this.game.sounds.playSound(sfx))
        }
        menuSFX('.settingLayout', 'menutap');
        menuSFX('.gamemodeSelect', 'menutap');
        setInterval(() => {
            this.game.elSongProgress.value = songs[this.game.curSongIdx].currentTime * 100 / songs[this.game.curSongIdx].duration;
        }, 2000);

        this.game.startGame();
        this.game.rendering.renderingLoop();
    }

   
}

const game = new Game(settings, pieces, attacktable);
game.main.init();
