//@ts-check

import { Game } from "./game.js";
import defaultSettings from "./data/defaultSettings.json" with { type: "json" };


export class Settings {
    control;
    display;
    game;
    handling;
    volume;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.gameObject = game;
        this.loadDefault();
    }

    loadDefault() {
        Object.keys(defaultSettings).forEach(type => {
            this[type] = defaultSettings[type];
        })
    }

    load(data) {
        if (data instanceof Array) {console.log("ye the settings format changed unlucky"); return;}
        Object.keys(data).forEach(type => {
            Object.keys(data[type]).forEach(setting => {
                if (data[type][setting] === undefined || data[type][setting] === "") return;
                this[type][setting] = data[type][setting];
            })
        })
    }

    save() {
        return {
            "control": this.control,
            "display": this.display,
            "game": this.game,
            "handling": this.handling,
            "volume": this.volume
        };
    }
}