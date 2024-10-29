import { Game } from "../game.js";
import defaultSettings from "../data/defaultSettings.json" with { type: "json" };

export class Settings {
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

        // this is for type checking lmao
        return;
        this.game = defaultSettings.game;
        this.display = defaultSettings.display;
        this.control = defaultSettings.control;
        this.handling = defaultSettings.handling;
        this.volume = defaultSettings.volume;
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

    save() {
        const data = {};
        Object.getOwnPropertyNames(this).forEach(key => {
            if (key == 'gameObject') return;
            data[key] = this[key];
        })
        return data;
    }

    // for backwards compatibility
    convert(arr) {
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

    reset(group) {
        for (let setting in this[group]) {
            this[group][setting] = "";
        }
    }
}