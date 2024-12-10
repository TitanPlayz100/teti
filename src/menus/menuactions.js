import { Game } from "../main.js";
import { getPiece } from "../mechanics/randomisers.js";
import { toExpValue } from "./modals.js";

export class MenuActions {
    bindingKey;
    elementSelectKeyText = document.getElementById("selectkeytext");
    controlUsed = false;
    altUsed = false;

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
                Game.modals.selectedRangeElement = el;
                Game.modals.openModal("changeRangeValue");
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

    checkValue(el, el2 = Game.modals.selectedRangeElement) {
        Game.modals.selectedRangeElement = el2;
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
        for (let i in Game.settings.control) {
            if (i == this.bindingKey) continue;
            const otherKeys = document.getElementById(i);
            if (otherKeys.textContent == key) otherKeys.textContent = "None";
        }
        Game.modals.closeDialog(document.getElementById("frontdrop"));
        Game.modals.open = true;
        this.bindingKey = undefined;
        this.controlUsed = false;
        this.altUsed = false;
        this.elementSelectKeyText.textContent = "Click to remove keybind";
    }

    // settings
    saveSettings() {
        const data = Game.settings.save();
        localStorage.setItem("settings", JSON.stringify(data));
    }

    loadSettings() {
        if (Game.replay.state == "replaying") return;
        const data = localStorage.getItem("settings") ?? "{}";
        Game.settings.load(JSON.parse(data))
    }

    setGamemode(mode) {
        Game.modes.setGamemode(mode);
        Game.modes.loadModes();
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
            Game.modes.loadModes();
            Game.modals.generate.notif("Settings Loaded", "User settings have successfully loaded", "message");
            el.value = "";
        };
    }

    resetSettings(group) {
        Game.settings.reset(group);
        this.saveSettings();
        location.reload();
        Game.modals.generate.notif("Settings Reset", `${group} settings have been reset to default`, "message");
    }

    // menu
    toggleDialog() {
        if (Game.menuactions.bindingKey != undefined) return;
        if (!Game.modals.open) {
            Game.modals.openModal("settingsPanel");
            return;
        }
        document.querySelectorAll("dialog[open]").forEach(e => Game.modals.closeDialog(e));
        document.querySelectorAll("scrollSettings[open]").forEach(e => Game.modals.closeDialog(e));
        if (Game.started && !Game.ended) Game.movement.startTimers();
    }

    newGame(key, modal) {
        if (key == Game.settings.control.resetKey) {
            Game.modals.closeModal(modal);
        }
    }

    openPage(url) {
        window.open("https://" + url, "blank_")
    }

    // edit menu
    openEditMenu() {
        if (Game.modals.open) {
            if (document.querySelectorAll("#editMenu[open]").length == 0) return;
            this.toggleDialog();
            return;
        }
        if (Game.settings.game.gamemode != 'custom') return
        Game.modals.openModal("editMenu");
    }

    changeEditPiece(pieceName) { Game.boardeditor.fillPiece = pieceName; }

    addGarbageRow() {
        Game.mechanics.addGarbage(1);
        Game.mechanics.setShadow();
    }

    removeLastRow() {
        Game.mechanics.clear.clearRow(0);
        Game.mechanics.setShadow();
    }

    clearGarbage() {
        Game.board.EradicateMinoCells("S G");
        Game.mechanics.setShadow();
    }

    setBoard() {
        const input = prompt("Enter Map String Here:")
        const { board, next, hold } = Game.boardeditor.convertFromMap(input);
        Game.board.boardState = board;
        Game.bag.setQueue(next.split(","));
        Game.hold.piece = getPiece(hold);
        Game.mechanics.spawnPiece(Game.bag.cycleNext());
        Game.modals.generate.notif("Map Loaded", "Custom map has successfully loaded", "message");
    }

    getBoardString() {
        const exportstring = Game.boardeditor.convertToMap();
        navigator.clipboard.writeText(exportstring)
        Game.modals.generate.notif("Map Exported", "Custom map has been copied to your clipboard", "message");
        alert("TETR.IO Map String:\n" + exportstring)
    }

    // stats
    exportStats() {
        let stats = {}
        Object.getOwnPropertyNames(Game.stats).forEach(key => {
            if (key == "game") return;
            stats[key] = Game.stats[key];
        })

        let el = document.createElement("a");
        el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(stats)));
        el.setAttribute("download", "stats.tsf");
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
        Game.modals.generate.notif("Stats Exported", "The current game's stats have been exported.", "message");
    }

    closeStats() {
        Game.modals.closeDialog(document.getElementById("gameStatsDialog"));
        Game.modals.open = true;
    }

    exportLifetime() {
        Game.profilestats.saveSession();
        const data = localStorage.getItem("stats");
        const day = (new Date()).toLocaleDateString().replace("/", "-");

        let el = document.createElement("a");
        el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(data)));
        el.setAttribute("download", `teti_stats_${day}.tlsf`);
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
        Game.modals.generate.notif("Lifetime Stats Exported", "All your lifetime stats and PBs have been exported. Enjoy the many stats you can analyse!", "success");
    }

    saveReplay() {
        const replay = Game.replay.saveReplay();

        let el = document.createElement("a");
        el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(replay));
        el.setAttribute("download", `replay.trf`);
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
        Game.modals.generate.notif("Replay Exported", "Your replay was successfully exported", "success");
    }

    uploadReplay(el) {
        const reader = new FileReader();
        reader.readAsText(el.files[0]);
        reader.onload = () => {
            Game.modals.generate.notif("Replay Loaded", "Replay successfully loaded", "message");
            Game.modals.closeModal("replaysDialog");
            setTimeout(() => {
                Game.replay.runReplay(reader.result.toString());
            }, 1000);
            el.value = "";
        };
    }

}
