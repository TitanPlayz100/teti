import { Game } from "../main.js";
import { GenerateMenus } from "./generate.js";

export class ModalActions {
    open;
    closing;
    selectedRangeElement;

    settingPanel = document.getElementById("settingsPanel");
    options = [...document.getElementsByClassName("option")];

    constructor() {
        this.generate = new GenerateMenus();
    }

    openModal(id) {
        //ensure that everything has been closed before trying to open the settings panel
        if (id == "settingsPanel" && this.closing) return;
        if (id == "queueModify" && !Game.settings.game.allowQueueModify) return;
        Game.stopGameTimers()
        this.getOptions(id).forEach(setting => {
            let settingType = this.getSettingType(id);
            let newval;
            if (Game.settings.hasOwnProperty(settingType)) newval = Game.settings[settingType][setting.id]
            if (setting.classList[2] == "exp") newval = toLogValue(newval);
            if (setting.classList[2] == "statoption") newval = Game.settings.game.sidebar[setting.id[10]-1]; 
            if (setting.id == "nextQueue") newval = Game.bag.getQueue();
            if (setting.id == "holdQueue") newval = Game.hold.getHold();
            if (setting.id == "rowfillmode") newval = Game.boardeditor.fillRow;
            setting.value = newval;
            if (setting.classList[1] == "keybind") setting.textContent = newval;
            if (setting.classList[1] == "check") setting.checked = newval;
            if (setting.classList[1] == "range") {
                Game.menuactions.sliderChange(setting);
                Game.menuactions.rangeClickInit(setting);
            }
        });

        document.getElementById(id).showModal();

        if (id == "gameStatsDialog") this.generate.displayStats();
        if (id == "gamemodeDialog") this.generate.highlightGamemodeInMenu();
        if (id == "competitiveDialog") this.generate.renderPBs();
        if (id != "settingsPanel" && this.settingPanel.open) this.closeDialog(this.settingPanel);
        this.open = true;
        Game.sounds.toggleSongMuffle(this.open);
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
            if (setting.classList[2] == "statoption") Game.settings.game.sidebar[setting.id[10]-1] = val;
            if (setting.id == "nextQueue") Game.bag.updateQueue(val);
            if (setting.id == "holdQueue") Game.hold.setNewHold(val);
            if (setting.id == "rowfillmode") Game.boardeditor.fillRow = val;
            if (setting.id == "override") Game.boardeditor.override = val;

            if (id == "changeRangeValue") {
                this.selectedRangeElement.value = document.getElementById("rangeValue").value;
                Game.menuactions.sliderChange(this.selectedRangeElement);
            }
            if (setting.id == "audioLevel") Game.sounds.setAudioLevel();

            if (!Game.settings.hasOwnProperty(settingType)) return;
            Game.settings[settingType][setting.id] = val;
        });

        this.closeDialog(document.getElementById(id));
        if (id != 'changeRangeValue' && id != "frontdrop" && Game.started && !Game.ended)
            Game.movement.startTimers();
        Game.menuactions.saveSettings();
        if (id == "displayDialog") Game.renderer.renderStyles(true);

        const restartMenus = ["gameDialog", "gamemodeDialog", "gameEnd", "goalsDialog", "competitiveDialog"];
        if (restartMenus.includes(id)) Game.controls.retry(false);
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
        Game.sounds.toggleSongMuffle(this.open);
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