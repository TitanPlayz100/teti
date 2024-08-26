// @ts-check

import { modesText } from "../data/data.js";
import { Game } from "../game.js";
import { toExpValue } from "../util.js";

export class MenuActions {
    bindingKey;
    divObjectiveText = document.getElementById("objectiveText");
    menus;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    sliderChange(el) {
        const text = el.parentElement.children[0].textContent.split(":")[0];
        let value = el.value;
        if (el.classList[2] == "exp") value = toExpValue(value);
        if (el.classList[2] == "exp" && value > 1000) value = "None";
        el.parentElement.children[0].textContent = `${text}: ${value}`;
    }

    rangeClickListener(el) {
        el.parentElement.children[0].addEventListener("click", () => {
            this.game.modals.selectedRangeElement = el;
            this.menus.openModal("changeRangeValue");
            document.getElementById("rangeValue").value = el.value;
        });
    }

    buttonInput(el) {
        document.getElementById("frontdrop").showModal();
        this.bindingKey = el.id;
    }

    setKeybind(key) {
        document.getElementById(this.bindingKey).textContent = key;
        for (let i in this.game.settings.control) {
            if (i == this.bindingKey) continue;
            const otherKeys = document.getElementById(i);
            if (otherKeys.textContent == key) otherKeys.textContent = "None";
        }
        this.menus.closeDialog(document.getElementById("frontdrop"));
        this.game.modals.open = true;
        this.bindingKey = undefined;
    }

    saveSettings() {
        const data = this.game.settings.save();
        localStorage.setItem("settings", JSON.stringify(data));
    }

    loadSettings() {
        const data = localStorage.getItem("settings");
        if (data == null) return;
        this.game.settings.load(JSON.parse(data))
        this.divObjectiveText.textContent = modesText[this.game.settings.game.gamemode];
    }

    setGamemode(modeNum) {
        this.game.settings.game.gamemode = modeNum;
        this.divObjectiveText.textContent = modesText[this.game.settings.game.gamemode];
    }

    downloadSettings() {
        this.saveSettings();
        let el = document.createElement("a");
        const text = localStorage.getItem("settings");
        el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
        el.setAttribute("download", "settings.teti");
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
    }

    uploadSettings(el) {
        const reader = new FileReader();
        reader.readAsText(el.files[0]);
        reader.onload = () => {
            localStorage.setItem("settings", reader.result.toString());
            this.loadSettings();
        };
    }

    resetSettings(group) {
        for (let setting in this.game.settings[group]) {
            this.game.settings[group][setting] = "";
        }
        this.saveSettings();
        location.reload();
    }

    toggleDialog() {
        if (this.game.modals.open) {
            document.querySelectorAll("dialog[open]").forEach(e => this.menus.closeDialog(e));
        } else {
            this.menus.openModal("settingsPanel");
        }
    }

    checkValue(el, el2 = this.game.modals.selectedRangeElement) {
        this.game.modals.selectedRangeElement = el2;
        if (el.value == "") return;
        if (el.value < Number(el2.min)) el.value = Number(el2.min);
        if (el.value > Number(el2.max)) el.value = Number(el2.max);
    }

    newGame(k, d) {
        if (k == this.game.settings.control.resetKey) {
            this.game.modals.closeModal(d);
            this.game.startGame();
        }
    }

    openPage(url) {
        window.open("https://" + url, "blank_")
    }

    openEditMenu() {
        if (this.game.modals.open) {
            this.menus.closeModal("editMenu");
            return;
        }
        this.menus.openModal("editMenu");
    }

    changeEditPiece(pieceName) { this.game.boardeditor.fillPiece = pieceName; }

    addGarbageRow() {
        this.game.mechanics.addGarbage(1);
        this.game.mechanics.setShadow();
    }

    removeLastRow() {
        this.game.mechanics.clear.clearRow(0);
        this.game.mechanics.setShadow();
    }

    clearGarbage() {
        this.game.mechanics.board.EradicateMinoCells("S G");
        this.game.mechanics.setShadow();
    }
}
