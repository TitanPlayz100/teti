//@ts-check

import { Game } from "./game.js";
import defaultSettings from "./data/defaultSettings.json" with { type: "json" };


export class Settings {
    control;
    display;
    game;


    /**
     * @param {Game} game
     */
    constructor(game) {
        this.gameObject = game;
        this.loadDefault();
    }

    loadDefault() {
        this.display = defaultSettings[0];
        this.game = defaultSettings[1];
        this.control = defaultSettings[2];
    }

    load(data) {
        for (let s in data[0]) {
            if (data[0][s] === undefined || data[0][s] === "") continue;
            this.display[s] = data[0][s];
        }
        for (let s in data[1]) {
            if (data[1][s] === undefined || data[1][s] === "") continue;
            this.game[s] = data[1][s];
        }
        for (let s in data[2]) {
            if (data[2][s] === undefined || data[2][s] === "") continue;
            this.control[s] = data[2][s];
        }
    }

    save() {
        return [this.display, this.game, this.control];
    }
}