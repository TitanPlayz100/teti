// @ts-check

import { disabledKeys } from "../data/data.js";
import { Game } from "../game.js";

export class Controls {

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

        if (event.repeat || this.game.modals.isDialogOpen) return;
        if (disabledKeys.includes(event.key)) event.preventDefault();
        if (this.game.firstMove && event.key != "Escape") this.moves.firstMovement();
        
        if (event.key == this.keys.resetKey) {
            this.game.sounds.playSound("retry");
            this.game.startGame();
        }
        if (this.game.gameEnd) return;
        
        if (event.key == this.keys.cwKey) this.moves.rotate("CW");
        if (event.key == this.keys.ccwKey) this.moves.rotate("CCW");
        if (event.key == this.keys.rotate180Key) this.moves.rotate("180");
        if (event.key == this.keys.hdKey) this.moves.harddrop();
        if (event.key == this.keys.holdKey) this.game.mechanics.switchHold();
        if (event.key == this.keys.rightKey) this.moves.startDas("RIGHT");
        if (event.key == this.keys.leftKey) this.moves.startDas("LEFT");
        if (event.key == this.keys.sdKey) this.moves.startArrSD();
    }

    onKeyUp(event) {
        this.keys = this.game.settings.control;

        if (event.key == this.keys.rightKey) this.moves.endDasArr("RIGHT");
        if (event.key == this.keys.leftKey) this.moves.endDasArr("LEFT");
        if (event.key == this.keys.sdKey) this.moves.endDasArr("DOWN");
    }


}