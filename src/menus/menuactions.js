import { Game } from "../game.js";
import { toExpValue } from "./modals.js";

export class MenuActions {
    bindingKey;
    menus;
    elementSelectKeyText = document.getElementById("selectkeytext");
    controlUsed = false;
    altUsed = false;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    // sliders
    sliderChange(el) {
        const text = el.parentElement.children[0].textContent.split(":")[0];
        let value = el.value;
        if (el.classList[2] == "exp") value = toExpValue(value);
        if (el.classList[2] == "exp" && value > 1000) value = "None";
        el.parentElement.children[0].textContent = `${text}: ${value}`;
    }

    addRangeListener() {
        document.body.addEventListener("click", (event) => {
            if (event.target.dataset.isRange == "true") {
                const el = event.target.children[1]
                this.game.modals.selectedRangeElement = el;
                this.menus.openModal("changeRangeValue");
                document.getElementById("rangeValue").value = el.value;
            }
        })
    }

    rangeClickInit(el) {
        el.parentElement.dataset.isRange = true;
    }

    buttonInput(el) {
        document.getElementById("frontdrop").showModal();
        this.bindingKey = el.id;
    }
    
    checkValue(el, el2 = this.game.modals.selectedRangeElement) {
        this.game.modals.selectedRangeElement = el2;
        if (el.value == "") return;
        if (el.value < Number(el2.min)) el.value = Number(el2.min);
        if (el.value > Number(el2.max)) el.value = Number(el2.max);
    }

    // keybinds
    checkKeybind(event) {
        if (!event.ctrlKey) this.controlUsed = false;
        if (!event.altKey) this.altUsed = false;
        this.elementSelectKeyText.textContent = "Click to remove keybind";

    }

    setKeybind(event) {
        if (!this.controlUsed && event.ctrlKey) {
            this.controlUsed = true;
            this.elementSelectKeyText.textContent += ". Control modifier used";
            return;
        }
        if (!this.altUsed && event.altKey) {
            this.altUsed = true;
            this.elementSelectKeyText.textContent += ". Alt modifier used";
            return;
        }

        const key = (event.ctrlKey ? "Ctrl+" : "") + (event.altKey ? "Alt+" : "") + event.key;
        document.getElementById(this.bindingKey).textContent = key;
        for (let i in this.game.settings.control) {
            if (i == this.bindingKey) continue;
            const otherKeys = document.getElementById(i);
            if (otherKeys.textContent == key) otherKeys.textContent = "None";
        }
        this.menus.closeDialog(document.getElementById("frontdrop"));
        this.game.modals.open = true;
        this.bindingKey = undefined;
        this.controlUsed = false;
        this.altUsed = false;
        this.elementSelectKeyText.textContent = "Click to remove keybind";
    }

    // settings
    saveSettings() {
        const data = this.game.settings.save();
        localStorage.setItem("settings", JSON.stringify(data));
    }

    loadSettings() {
        const data = localStorage.getItem("settings") ?? "{}";
        this.game.settings.load(JSON.parse(data))
        this.game.modes.loadModes();
        this.game.history.setHistoryDiv(this.game.settings.game.gamemode == 'custom');
        this.game.boardeditor.setEditButton(this.game.settings.game.gamemode == 'custom');
    }

    setGamemode(mode) {
        this.game.modes.setGamemode(mode);
        this.game.modes.loadModes();
        this.game.history.setHistoryDiv(this.game.settings.game.gamemode == 'custom');
        this.game.boardeditor.setEditButton(this.game.settings.game.gamemode == 'custom');
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
        this.game.settings.reset(group);
        this.saveSettings();
        location.reload();
    }

    // menu
    toggleDialog() {
        if (this.game.menuactions.bindingKey != undefined) return;
        if (!this.game.modals.open) {
            this.menus.openModal("settingsPanel");
            return;
        }
        document.querySelectorAll("dialog[open]").forEach(e => this.menus.closeDialog(e));
        document.querySelectorAll("scrollSettings[open]").forEach(e => this.menus.closeDialog(e));
        if (this.game.started && !this.game.ended) this.game.movement.firstMovement();
    }

    newGame(key, modal) {
        if (key == this.game.settings.control.resetKey) {
            this.game.modals.closeModal(modal);
            this.game.startGame();
        }
    }

    openPage(url) {
        window.open("https://" + url, "blank_")
    }

    // edit menu
    openEditMenu() {
        if (this.game.modals.open) {
            this.toggleDialog();
            return;
        }
        if (this.game.settings.game.gamemode != 'custom') return
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

    setBoard() {
        const input = prompt("Enter Map String Here:")
        const { board, next, hold } = this.game.boardeditor.convertFromMap(input);
        this.game.board.boardState = board;
        this.game.bag.nextPieces = [next.split(","), []];
        this.game.hold.piece = this.game.renderer.getPiece(hold);
        this.game.mechanics.spawnPiece(this.game.bag.randomiser());
    }

    getBoardString() {
        const exportstring = this.game.boardeditor.convertToMap();
        navigator.clipboard.writeText(exportstring)
        alert("TETR.IO Map String (copied to clipboard):\n" + exportstring)
    }

    // stats
    exportStats() {
        let stats = {}
        Object.getOwnPropertyNames(this.game.stats).forEach(key => {
            if (key == "game") return;
            stats[key] = this.game.stats[key];
        })

        let el = document.createElement("a");
        el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(stats)));
        el.setAttribute("download", "stats.json");
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
    }

    closeStats() {
        this.menus.closeDialog(document.getElementById("gameStatsDialog"));
        this.game.modals.open = true;
    }
}
