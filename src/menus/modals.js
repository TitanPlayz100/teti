import { Game } from "../game.js";
import { GenerateMenus } from "./generate.js";

export class ModalActions {
    open;
    closing;
    selectedRangeElement;
    pieceNames = ["s", "z", "i", "j", "l", "o", "t"];

    settingPanel = document.getElementById("settingsPanel");
    options = [...document.getElementsByClassName("option")];

    
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.actions = this.game.menuactions;
        game.menuactions.menus = this;
        this.generate = new GenerateMenus(game);
    }

    openModal(id) {
        //ensure that everything has been closed before trying to open the settings panel
        if (id == "settingsPanel" && this.closing) return;
        if (id == "queueModify" && !this.game.settings.game.allowQueueModify) return;
        this.game.stopGameTimers()
        this.getOptions(id).forEach(setting => {
            let settingType = this.getSettingType(id);
            let newval;
            if (this.game.settings.hasOwnProperty(settingType)) newval = this.game.settings[settingType][setting.id]
            if (setting.classList[2] == "exp") newval = toLogValue(newval);
            if (setting.classList[2] == "statoption") newval = this.game.settings.game.sidebar[setting.id[10]-1]; 
            if (setting.id == "nextQueue") newval = this.game.bag.getQueue();
            if (setting.id == "holdQueue") newval = this.game.hold.getHold();
            if (setting.id == "rowfillmode") newval = this.game.boardeditor.fillRow;
            setting.value = newval;
            if (setting.classList[1] == "keybind") setting.textContent = newval;
            if (setting.classList[1] == "check") setting.checked = newval;
            if (setting.classList[1] == "range") {
                this.actions.sliderChange(setting);
                this.actions.rangeClickInit(setting);
            }
        });

        document.getElementById(id).showModal();

        if (id == "gameStatsDialog") this.generate.displayStats();
        if (id == "gamemodeDialog") this.generate.highlightGamemodeInMenu();
        if (id == "competitiveDialog") this.generate.renderPBs();
        if (id != "settingsPanel" && this.settingPanel.open) this.closeDialog(this.settingPanel);
        this.open = true;
        this.game.sounds.toggleSongMuffle(this.open);
    }

    getOptions(id) {
        const settings = [...this.options].filter(item => item.parentElement.parentElement.parentElement.id == id)
        return settings;
    }

    getSettingType(id) {
        let type = id.replace("Dialog", "");
        if (id == "gamemodeDialog" || id == "goalsDialog" || id == "competitiveDialog") type = "game";
        return type;
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
            if (setting.classList[2] == "statoption") this.game.settings.game.sidebar[setting.id[10]-1] = val;
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
        if (id != 'changeRangeValue' && id != "frontdrop" && this.game.started && !this.game.ended)
            this.game.movement.firstMovement();
        this.actions.saveSettings();
        if (id == "displayDialog") this.game.renderer.renderStyles();

        const restartMenus = ["gameDialog", "gamemodeDialog", "gameEnd", "goalsDialog", "competitiveDialog"];
        if (restartMenus.includes(id)) this.game.controls.retry(false);
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
        this.game.sounds.toggleSongMuffle(this.open);
        element.classList.add("closingAnimation");
        element.addEventListener("animationend", closingAnimation);
    }
}

function toLogValue(y) {
    return Math.round(Math.log2(y + 1) * 10);
}

export function toExpValue(x) {
    return Math.round(Math.pow(2, 0.1 * x) - 1);
}