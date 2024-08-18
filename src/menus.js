// @ts-check
import { modesText, songs } from "./data.js";
import { Game } from "./game.js";
import { toExpValue, toLogValue } from "./util.js";

export class MenuActions {
    isDialogOpen;
    currentRangeOption;
    bindingKey;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    openModal(id) {
        let settingGroup = id.replace("Dialog", "");
        if (id == "gamemodeDialog") settingGroup = "this.game.gameSettings";
        if (id == "queueModify" && !this.game.gameSettings.allowQueueModify) return;
        const options = [...document.getElementsByClassName("option")];
        options
            .filter(item => item.parentElement.parentElement.id == id)
            .forEach(setting => {
                let newValue = eval(settingGroup)[setting.id];
                if (setting.classList[2] == "exp") newValue = toLogValue(newValue);
                if (setting.id == "nextQueue")
                    newValue = this.game.nextPieces[0]
                        .concat(this.game.nextPieces[1])
                        .splice(0, 7)
                        .join(" ");
                if (setting.id == "holdQueue")
                    newValue = this.game.holdPiece.piece ? this.game.holdPiece.piece.name : "";
                setting.value = newValue;
                if (setting.classList[1] == "keybind") setting.textContent = newValue;
                if (setting.classList[1] == "check") setting.checked = newValue;
                if (setting.classList[1] == "range") {
                    this.sliderChange(setting);
                    this.rangeClkLisnr(setting);
                }
            });
        const gamemodeSelect = [...document.getElementsByClassName("gamemodeSelect")];
        gamemodeSelect.forEach(setting => {
            setting.classList.remove("selected");
            if (setting.id == "gamemode" + this.game.gameSettings.gamemode)
                setting.classList.add("selected");
        });
        document.getElementById(id).showModal();
        const settingPanel = document.getElementById("settingsPanel");
        if (id != "settingsPanel" && settingPanel.open) this.closeDialog(settingPanel);
        this.isDialogOpen = true;
    }

    closeModal(id) {
        let settingGroup = id.replace("Dialog", "");
        if (id == "gamemodeDialog") settingGroup = "this.game.gameSettings";
        [...document.getElementsByClassName("option")]
            .filter(item => item.parentElement.parentElement.id == id)
            .forEach(setting => {
                const settingid = setting.id,
                    type = setting.classList[1];
                if (type == "number" && setting.value == "")
                    setting.value = this.currentRangeOption.min;
                eval(settingGroup)[settingid] =
                    type == "check"
                        ? setting.checked
                        : type == "keybind"
                        ? setting.textContent
                        : setting.classList[2] == "exp"
                        ? toExpValue(setting.value)
                        : setting.value;
                if (settingid == "nextQueue") {
                    this.game.nextPieces[0] = setting.value
                        .split(" ")
                        .filter(p => pieceNames.includes(p));
                    shuffleRemainingPieces();
                    updateNext();
                }
                if (settingid == "holdQueue") {
                    const filtp = [setting.value].filter(p => pieceNames.includes(p));
                    this.game.holdPiece = {
                        piece: this.game.utils.getPiece(filtp),
                        occured: false,
                    };
                    this.game.rendering.updateHold();
                }
                if (id == "changeRangeValue") {
                    this.currentRangeOption.value = document.getElementById("rangeValue").value;
                    this.sliderChange(this.currentRangeOption);
                }
                if (settingid == "audioLevel") {
                    songs[curSongIdx].volume = Number(this.game.displaySettings.audioLevel) / 1000;
                }
            });
        this.closeDialog(document.getElementById(id));
        this.saveSettings();
        if (id == "displaySettingsDialog") renderStyles();
        if (id == "gameSettingsDialog" || id == "gamemodeDialog" || id == "gameEnd") startGame();
        if (id == "changeRangeValue") this.isDialogOpen = true;
    }

    closeDialog(element) {
        const closingAnimation = () => {
            element.removeEventListener("animationend", closingAnimation);
            element.classList.remove("closingAnimation");
            element.close();
        };
        this.isDialogOpen = false;
        element.classList.add("closingAnimation");
        element.addEventListener("animationend", closingAnimation);
    }

    sliderChange(el) {
        const text = el.parentElement.children[0].textContent.split(":")[0];
        let value = el.value;
        if (el.classList[2] == "exp") value = toExpValue(value);
        if (el.classList[2] == "exp" && value > 1000) value = "None";
        el.parentElement.children[0].textContent = `${text}: ${value}`;
    }

    rangeClkLisnr(el) {
        el.parentElement.children[0].addEventListener("click", () => {
            this.currentRangeOption = el;
            this.openModal("changeRangeValue");
            document.getElementById("rangeValue").value = el.value;
        });
    }

    buttonInput(el) {
        document.getElementById("frontdrop").showModal();
        this.bindingKey = el.id;
    }

    setKeybind(key) {
        document.getElementById(this.bindingKey).textContent = key;
        for (let i in this.game.controlSettings) {
            if (i == this.bindingKey) continue;
            const otherKeys = document.getElementById(i);
            if (otherKeys.textContent == key) otherKeys.textContent = "None";
        }
        this.closeDialog(document.getElementById("frontdrop"));
        this.isDialogOpen = true;
        this.bindingKey = undefined;
    }

    saveSettings() {
        const data = [this.game.displaySettings, this.game.gameSettings, this.game.controlSettings];
        localStorage.setItem("settings", JSON.stringify(data));
    }

    loadSettings() {
        const data = localStorage.getItem("settings");
        if (data == null) return;
        const [tempDisplay, tempGame, tempControls] = JSON.parse(data);
        for (let s in tempDisplay) {
            if (tempDisplay[s] === undefined || tempDisplay[s] === "") continue;
            this.game.displaySettings[s] = tempDisplay[s];
        }
        for (let s in tempGame) {
            if (tempGame[s] === undefined || tempGame[s] === "") continue;
            this.game.gameSettings[s] = tempGame[s];
        }
        for (let s in tempControls) {
            if (tempControls[s] === undefined || tempControls[s] === "") continue;
            this.game.controlSettings[s] = tempControls[s];
        }
        this.game.divObjectiveText.textContent = modesText[this.game.gameSettings.gamemode];
    }

    setGamemode(modeNum) {
        this.game.gameSettings.gamemode = modeNum;
        this.game.divObjectiveText.textContent = modesText[this.game.gameSettings.gamemode];
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
            localStorage.setItem("settings", reader.result);
            this.loadSettings();
        };
    }

    resetSettings(settingGroup) {
        for (let setting in eval(settingGroup)) eval(settingGroup)[setting] = "";
        this.saveSettings();
        location.reload();
    }

    toggleDialog() {
        if (this.isDialogOpen) {
            document.querySelectorAll("dialog[open]").forEach(e => this.closeDialog(e));
        } else {
            this.openModal("settingsPanel");
        }
    }

    checkValue(el, el2 = this.currentRangeOption) {
        this.currentRangeOption = el2;
        if (el.value == "") return;
        if (el.value < Number(el2.min)) el.value = Number(el2.min);
        if (el.value > Number(el2.max)) el.value = Number(el2.max);
    }

    newGame(k, d) {
        if (k == this.game.controlSettings.resetKey) {
            this.game.menus.closeModal(d);
            this.game.main.startGame();
        }
    }
}
