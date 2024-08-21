// @ts-check
import { Game } from "../game.js";
import { toExpValue, toLogValue } from "../util.js";

export class ModalActions {
    isDialogOpen;
    currentRangeOption;
    pieceNames = ["s", "z", "i", "j", "l", "o", "t"];

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.actions = this.game.menuactions;
        game.menuactions.menus = this;
    }

    openModal(id) {
        let settingGroup = "this.game.settings." + id.replace("Dialog", "");
        if (id == "gamemodeDialog") settingGroup = "this.game.settings.game";
        if (id == "queueModify" && !this.game.settings.game.allowQueueModify) return;
        const options = [...document.getElementsByClassName("option")];
        options
            .filter(item => item.parentElement.parentElement.id == id)
            .forEach(setting => {
                let newValue = eval(settingGroup)[setting.id];
                if (setting.classList[2] == "exp") newValue = toLogValue(newValue);
                if (setting.id == "nextQueue")
                    newValue = this.game.bag.getQueue();
                if (setting.id == "holdQueue")
                    newValue = this.game.hold.getHold();
                setting.value = newValue;
                if (setting.classList[1] == "keybind") setting.textContent = newValue;
                if (setting.classList[1] == "check") setting.checked = newValue;
                if (setting.classList[1] == "range") {
                    this.actions.sliderChange(setting);
                    this.actions.rangeClkLisnr(setting);
                }
            });
        const gamemodeSelect = [...document.getElementsByClassName("gamemodeSelect")];
        gamemodeSelect.forEach(setting => {
            setting.classList.remove("selected");
            if (setting.id == "gamemode" + this.game.settings.game.gamemode)
                setting.classList.add("selected");
        });
        document.getElementById(id).showModal();
        const settingPanel = document.getElementById("settingsPanel");
        if (id != "settingsPanel" && settingPanel.open) this.closeDialog(settingPanel);
        this.isDialogOpen = true;
    }

    closeModal(id) {
        let settingGroup = "this.game.settings." + id.replace("Dialog", "");
        if (id == "gamemodeDialog") settingGroup = "this.game.settings.game";
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
                        this.game.bag.setQueue(setting.value, this.pieceNames)
                        this.game.bag.shuffleRemainingPieces();
                        this.game.rendering.updateNext();
                    }
                    if (settingid == "holdQueue") {
                        const filtp = [setting.value].filter(p => this.pieceNames.includes(p));
                        this.game.hold.piece = this.game.utils.getPiece(filtp);
                        this.game.hold.occured = false;
                        this.game.rendering.updateHold();
                    }
                    if (id == "changeRangeValue") {
                        this.currentRangeOption.value = document.getElementById("rangeValue").value;
                        this.actions.sliderChange(this.currentRangeOption);
                    }
                    if (settingid == "audioLevel") {
                        this.game.sounds.setAudioLevel();
                    }
                });
        this.closeDialog(document.getElementById(id));
        this.actions.saveSettings();
        if (id == "settings.displayDialog") this.game.rendering.renderStyles();
        if (id == "settings.gameDialog" || id == "gamemodeDialog" || id == "gameEnd")
            this.game.startGame();
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
}
