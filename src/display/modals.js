import { Game } from "../game.js";
import { toExpValue, toLogValue } from "../util.js";

export class ModalActions {
    open;
    closing;
    selectedRangeElement;
    pieceNames = ["s", "z", "i", "j", "l", "o", "t"];

    settingPanel = document.getElementById("settingsPanel");
    pblistStart = document.getElementById("PBlist");
    gamemodeStart = document.getElementById("startGamemodeList");
    statsStart = document.getElementById("startStatsList");

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.actions = this.game.menuactions;
        game.menuactions.menus = this;
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

        if (id == "gameStatsDialog") this.displayStats();
        if (id == "gamemodeDialog") this.highlightGamemodeInMenu();
        if (id == "competitiveDialog") this.renderPBs();
        if (id != "settingsPanel" && this.settingPanel.open) this.closeDialog(this.settingPanel);
        this.open = true;
        this.game.sounds.toggleSongMuffle(this.open);

    }

    getOptions(id) {
        const options = [...document.getElementsByClassName("option")];
        return options.filter(item => item.parentElement.parentElement.id == id)
    }

    getSettingType(id) {
        let type = id.replace("Dialog", "");
        if (id == "gamemodeDialog" || id == "goalsDialog" || id == "competitiveDialog") type = "game";
        return type;
    }

    generateGamemodeMenu() {
        this.game.modes.getGamemodeNames().forEach(name => {
            const setting = this.game.modes.getGamemodeJSON(name);
            const button = document.createElement("button");
            button.id = name;
            button.classList = "gamemodeSelect";
            button.textContent = setting.displayName;
            button.onclick = () => {
                menu.setGamemode(name);
                modal.closeModal("gamemodeDialog");
            }
            this.gamemodeStart.parentNode.insertBefore(button, this.gamemodeStart);
        })
        this.gamemodeStart.remove();
    }

    highlightGamemodeInMenu() {
        const gamemodeSelect = [...document.getElementsByClassName("gamemodeSelect")];
        gamemodeSelect.forEach(setting => {
            setting.classList.remove("selected");
            if (setting.id == this.game.settings.game.gamemode)
                setting.classList.add("selected");
        });
    }

    renderPBs() {
        const previous = [...document.getElementsByClassName("pbbox")] ?? [];
        previous.forEach(el => el.remove());

        const pbs = this.game.profilestats.personalBests;
        Object.keys(pbs).forEach(mode => {
            const score = pbs[mode].score
            const pbbox = document.createElement("div");

            const text1 = document.createElement("h2")
            text1.textContent = mode[0].toUpperCase() + mode.slice(1) + ': ';
            const text2 = document.createElement("h2")
            text2.textContent = score + this.game.modes.getSuffix(mode);
            const clearbutton = document.createElement("button");
            clearbutton.textContent = "X";
            clearbutton.addEventListener("click", (event) => {
                event.stopPropagation();
                this.game.profilestats.removePB(mode);
                pbbox.remove()
            });
            pbbox.appendChild(text1);
            pbbox.appendChild(text2);
            pbbox.appendChild(clearbutton);
            pbbox.addEventListener("click", () => {
                let el = document.createElement("a");
                el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(pbs[mode])));
                el.setAttribute("download", `${mode}_pb.json`);
                document.body.appendChild(el);
                el.click();
                document.body.removeChild(el);
            })

            pbbox.classList = "pbbox settingLayout";
            this.pblistStart.parentNode.insertBefore(pbbox, this.pblistStart);
        })
    }

    displayStats() {
        const previous = [...document.getElementsByClassName("statText")] ?? [];
        previous.forEach(el => el.remove());

        const stats = Object.getOwnPropertyNames(this.game.stats);
        const skip = ['clearCols', 'clearPieces', 'game']
        stats.forEach(stat => {
            if (skip.includes(stat)) return;
            let score = this.game.stats[stat]
            if (stat == "tspins") score = score.reduce((a, b) => a + b, 0)
            const statItem = document.createElement("p");
            statItem.classList = "statText";

            const text1 = document.createElement("span")
            text1.classList = "spanright"
            text1.textContent = stat + ":"
            const text2 = document.createElement("span")
            text2.classList = "spanleft"
            text2.textContent = Math.round(score * 1000) / 1000
            statItem.appendChild(text1);
            statItem.appendChild(text2);
            this.statsStart.parentNode.insertBefore(statItem, this.statsStart);
        })
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
        if (id != 'changeRangeValue' && id != "frontdrop" && this.game.started && !this.game.ended)
            this.game.movement.firstMovement();
        this.actions.saveSettings();
        if (id == "displayDialog") this.game.rendering.renderStyles();

        const restartMenus = ["gameDialog", "gamemodeDialog", "gameEnd", "goalsDialog", "competitiveDialog"];
        if (restartMenus.includes(id)) this.game.startGame();
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
