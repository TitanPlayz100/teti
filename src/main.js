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

        this.game.ctxH.clearRect(0, 0, this.game.canvasHold.offsetWidth + 10, this.game.canvasHold.offsetHeight)
        this.game.movement.initKeyListeners();
        this.sizeCanvas();
        document.onresize = () => {
            this.sizeCanvas();
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

        this.startGame();
        this.game.rendering.renderingLoop();
    }

    sizeCanvas() {
        this.game.divBoard.setAttribute('style', '');
        this.game.rendering.renderStyles();
        this.game.canvasField.offsetWidth = this.game.divBoard.width;
        [this.game.canvasField, this.game.canvasNext, this.game.canvasHold].forEach(c => {
            c.width = Math.round(c.offsetWidth / 10) * 10;
            c.height = Math.round(c.offsetHeight / 40) * 40;
        });
        this.game.divBoard.style.width = `${this.game.canvasField.width}px`
        this.game.divBoard.style.height = `${this.game.canvasField.height / 2}px`
        this.game.minoSize = this.game.canvasField.width / 10;
        this.game.boardWidth = this.game.canvasField.offsetWidth, this.game.boardHeight = this.game.canvasField.offsetHeight;
        this.game.nextWidth = this.game.canvasNext.offsetWidth, this.game.nextHeight = this.game.canvasNext.offsetHeight;
        this.game.holdWidth = this.game.canvasHold.offsetWidth, this.game.holdHeight = this.game.canvasHold.offsetHeight;
    }

    startGame() {
        this.game.menus.loadSettings();
        this.game.mechanics.resetState();
        this.game.rendering.renderStyles();
        this.game.mechanics.spawnPiece(this.game.mechanics.randomiser(), true);
    }
}

const game = new Game(settings, pieces, attacktable);
game.main.init();
