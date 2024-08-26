// @ts-check

import { disabledKeys } from "../data/data.js";
import { Game } from "../game.js";

export class Controls {
    /**
     * @type {{RIGHT: boolean|string, LEFT: boolean|string, DOWN: boolean|string}}
     */
    directionState = { RIGHT: false, LEFT: false, DOWN: false };

    timings = { arr: 0, das: 0, sd: 0 }; // timeout and interval ids


    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.moves = game.movement;
    }

    onKeyDown(event) {
        this.keys = this.game.settings.control;

        if (event.key == "Escape") event.preventDefault();
        if (event.key == "Escape" && this.game.menuactions.bindingKey == undefined) {
            this.game.menuactions.toggleDialog();
        }
        if (event.key == this.keys.editMenuKey) this.game.menuactions.openEditMenu();

        if (event.repeat || this.game.modals.open) return;
        if (disabledKeys.includes(event.key)) event.preventDefault();
        if (!this.game.started && event.key != "Escape") this.moves.firstMovement();

        if (event.key == this.keys.resetKey) {
            this.game.sounds.playSound("retry");
            this.game.startGame();
        }
        if (this.game.ended) return;

        if (event.key == this.keys.cwKey) this.moves.rotate("CW");
        if (event.key == this.keys.ccwKey) this.moves.rotate("CCW");
        if (event.key == this.keys.rotate180Key) this.moves.rotate("180");
        if (event.key == this.keys.hdKey) this.moves.harddrop();
        if (event.key == this.keys.holdKey) this.game.mechanics.switchHold();
        if (event.key == this.keys.rightKey) this.startDas("RIGHT");
        if (event.key == this.keys.leftKey) this.startDas("LEFT");
        if (event.key == this.keys.sdKey) this.startArrSD();
    }

    onKeyUp(event) {
        this.keys = this.game.settings.control;

        if (event.key == this.keys.rightKey) this.endDasArr("RIGHT");
        if (event.key == this.keys.leftKey) this.endDasArr("LEFT");
        if (event.key == this.keys.sdKey) this.endDasArr("DOWN");
    }

    startDas(direction) {
        this.moves.movePieceSide(direction);
        this.directionState[direction] = "das";
        this.stopTimeout("das");
        this.stopInterval("arr");
        this.timings.das = setTimeout(
            () => this.startArr(direction),
            this.game.settings.handling.das
        );
    }

    startArr(direction) {
        if (direction == "current") {
            if (this.directionState["RIGHT"] == "arr" && this.directionState["LEFT"] == "arr")
                return;
            if (this.directionState["RIGHT"] == "arr") this.startArr("RIGHT");
            if (this.directionState["LEFT"] == "arr") this.startArr("LEFT");
            return;
        }
        this.directionState[direction] = "arr";
        this.stopInterval("arr");
        if (this.game.settings.handling.arr == 0) {
            this.timings.arr = -1;
            this.moves.movePieceSide(direction, Infinity);
        } else {
            this.timings.arr = setInterval(
                () => this.moves.movePieceSide(direction),
                this.game.settings.handling.arr
            );
        }
    }

    startArrSD() {
        this.directionState["DOWN"] = "arr";
        clearInterval(this.timings.sd);
        if (this.game.settings.handling.sdarr == 0) {
            this.timings.sd = -1;
            this.moves.movePieceDown(true);
            return;
        }
        this.timings.sd = setInterval(
            () => this.moves.movePieceDown(false),
            this.game.settings.handling.sdarr
        );
    }

    endDasArr(direction) {
        this.directionState[direction] = false;
        if (direction == "RIGHT" || direction == "LEFT") {
            const oppDirection = direction == "RIGHT" ? "LEFT" : "RIGHT";
            if (this.directionState[oppDirection] == "das") return;
            if (this.directionState[oppDirection] == "arr") {
                this.startArr(oppDirection);
                return;
            }
            this.stopTimeout("das");
            this.stopInterval("arr");
        }
        if (direction == "DOWN") this.stopInterval("sd");
    }

    resetMovements() {
        this.directionState = { RIGHT: false, LEFT: false, DOWN: false };
        this.endDasArr("RIGHT");
        this.endDasArr("LEFT");
        this.endDasArr("DOWN");
    }

    checkSD() {
        if (this.directionState["DOWN"] == "arr")
            this.startArrSD();
    }

    stopTimeout(name) {
        clearTimeout(this.timings[name]);
        this.timings[name] = 0;
    }

    stopInterval(name) {
        clearInterval(this.timings[name]);
        this.timings[name] = 0;
    }



}