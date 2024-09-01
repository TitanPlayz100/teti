//@ts-check

import { Game } from "./game.js";
import defaultSettings from "./data/defaultSettings.json" with { type: "json" };


export class Settings {
    handling;
    volume;
    display;
    game;
    control;

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
        if (data instanceof Array) data = this.convert(data);
        Object.keys(data).forEach(type => {
            Object.keys(data[type]).forEach(setting => {
                if (data[type][setting] === undefined || data[type][setting] === "") return;
                this[type][setting] = data[type][setting];
            })
        })
    }

    save() { // TODO: maybe change to not be explicit 
        return {
            "control": this.control,
            "display": this.display,
            "game": this.game,
            "handling": this.handling,
            "volume": this.volume
        };
    }

    convert(arr) { // can probably remove later in the future
        const display = arr[0]
        const game = arr[1]
        const control = arr[2]
        const handling = {
            das: game.das,
            arr: game.arr,
            sdarr: game.sdarr
        }
        const volume = {
            audioLevel: display.audioLevel,
            sfxLevel: display.sfxLevel
        }
        game.das = undefined
        game.arr = undefined
        game.sdarr = undefined
        display.audioLevel = undefined
        display.sfxLevel = undefined

        return { display, game, control, handling, volume };
    }
}