import { DEFAULT_SETTINGS as defaultSettings } from "../data/defaultSettings.js";

export class Settings {
    /**@type {GameSettings} */
    game;
    /**@type {DisplaySettings} */
    display;
    /**@type {ControlSettings} */
    control;
    /**@type {HandlingSettings} */
    handling;
    /**@type {VolumeSettings} */
    volume;

    constructor() {
        this.loadDefault();
    }

    loadDefault() {
        Object.keys(defaultSettings).forEach(type => {
            this[type] = defaultSettings[type];
        })
    }

    load(data) {
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
            data[key] = this[key];
        })
        return data;
    }

    reset(group) {
        for (let setting in this[group]) {
            this[group][setting] = "";
        }
    }
}