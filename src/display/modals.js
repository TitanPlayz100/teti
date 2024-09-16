// @ts-check
import { Game } from "../game.js";
import { toExpValue, toLogValue } from "../util.js";

export class ModalActions {
    open;
    closing;
    selectedRangeElement;
    pieceNames = ["s", "z", "i", "j", "l", "o", "t"];
    settingPanel = document.getElementById("settingsPanel");


    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.actions = this.game.menuactions;
        game.menuactions.menus = this;
    }

    openModal(id) {
        if (id == "settingsPanel" && this.closing) return //ensure that everything has been closed before trying to open the settings panel
        this.game.stopGameTimers()
        if (id == "queueModify" && !this.game.settings.game.allowQueueModify) return;

        this.getOptions(id).forEach(setting => {
            let settingType = this.getSettingType(id);
            let newval;
            if (this.game.settings.hasOwnProperty(settingType)) newval = this.game.settings[settingType][setting.id]
            if (setting.classList[2] == "exp") newval = toLogValue(newval);
            if (setting.id == "nextQueue") newval = this.game.bag.getQueue();
            if (setting.id == "holdQueue") newval = this.game.hold.getHold();
            if (setting.id == "rowfillmode") newval = this.game.boardeditor.fillRow;
            setting.value = newval;
            if (setting.classList[1] == "keybind") setting.textContent = newval;
            if (setting.classList[1] == "check") setting.checked = newval;
            if (setting.classList[1] == "range") {
                this.actions.sliderChange(setting);
                this.actions.rangeClickListener(setting);
            }
        });

        document.getElementById(id).showModal();
        if (id == "gamemodeDialog") this.highlightGamemodeInMenu();
        if (id != "settingsPanel" && this.settingPanel.open) this.closeDialog(this.settingPanel);
        this.open = true;

    }

    getOptions(id) {
        const options = [...document.getElementsByClassName("option")];
        return options.filter(item => item.parentElement.parentElement.id == id)
    }

    getSettingType(id) {
        let type = id.replace("Dialog", "");
        if (id == "gamemodeDialog") type = "game";
        return type;
    }

    highlightGamemodeInMenu() {
        const gamemodeSelect = [...document.getElementsByClassName("gamemodeSelect")];
        gamemodeSelect.forEach(setting => {
            setting.classList.remove("selected");
            if (setting.id == "gamemode" + this.game.settings.game.gamemode)
                setting.classList.add("selected");
        });
    }

    closeModal(id) {
        this.getOptions(id).forEach(setting => {
            let settingType = this.getSettingType(id);
            let val = setting.value;
            if (setting.classList[1] == "number" && val == "") val = this.selectedRangeElement.min;
            if (setting.classList[1] == "check") val = setting.checked;
            if (setting.classList[1] == "keybind") {
                val = setting.textContent.length > 1
                    ? setting.textContent
                    : setting.textContent.toLowerCase();
            }
            if (setting.classList[2] == "exp") val = toExpValue(val);
            if (setting.id == "nextQueue") this.game.bag.setQueue(val, this.pieceNames);
            if (setting.id == "holdQueue") this.game.hold.setNewHold(val);
            if (setting.id == "rowfillmode") this.game.boardeditor.fillRow = val;
            if (setting.id == "override") this.game.boardeditor.override = val;

            if (id == "changeRangeValue") {
                this.selectedRangeElement.value = document.getElementById("rangeValue").value;
                this.actions.sliderChange(this.selectedRangeElement);
            }
            if (setting.id == "audioLevel") this.game.sounds.setAudioLevel();

            if (!this.game.settings.hasOwnProperty(settingType)) return;

            this.game.settings[settingType][setting.id] = val;
        });

        this.closeDialog(document.getElementById(id));
        if (this.game.started && !this.game.ended) this.game.movement.firstMovement();  

        this.actions.saveSettings();
        if (id == "displayDialog") this.game.rendering.renderStyles();
        if (id == "gameDialog" || id == "gamemodeDialog" || id == "gameEnd") this.game.startGame();
        if (id == "changeRangeValue") this.open = true;
    }

    closeDialog(element) {
        this.closing = true //track if the closing animation is still ongoing
        const closingAnimation = () => {
            element.removeEventListener("animationend", closingAnimation);
            element.classList.remove("closingAnimation");
            element.close();
            this.closing = false
        };
        this.open = false;
        element.classList.add("closingAnimation");
        element.addEventListener("animationend", closingAnimation);
    }
}
