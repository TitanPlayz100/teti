// @ts-check
import { Game } from "./game.js";

export class MenuActions {
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    openModal(id) {
        let settingGroup = id.replace('Dialog', '');
        if (id == 'gamemodeDialog') settingGroup = 'gameSettings';
        if (id == 'queueModify' && !gameSettings.allowQueueModify) return;
        const options = [...document.getElementsByClassName('option')]
        options.filter((item) => item.parentElement.parentElement.id == id)
            .forEach((setting) => {
                let newValue = eval(settingGroup)[setting.id];
                if (setting.classList[2] == 'exp') newValue = toLogValue(newValue);
                if (setting.id == 'nextQueue')
                    newValue = nextPieces[0].concat(nextPieces[1]).splice(0, 7).join(' ');
                if (setting.id == 'holdQueue') newValue = holdPiece.piece ? holdPiece.piece.name : '';
                setting.value = newValue
                if (setting.classList[1] == 'keybind') setting.textContent = newValue;
                if (setting.classList[1] == 'check') setting.checked = (newValue);
                if (setting.classList[1] == 'range') { sliderChange(setting); rangeClkLisnr(setting) };
            });
        const gamemodeSelect = [...document.getElementsByClassName('gamemodeSelect')]
        gamemodeSelect.forEach((setting) => {
            setting.classList.remove('selected');
            if (setting.id == "gamemode" + gameSettings.gamemode) setting.classList.add('selected');
        })
        document.getElementById(id).showModal();
        const settingPanel = document.getElementById('settingsPanel');
        if (id != 'settingsPanel' && settingPanel.open) closeDialog(settingPanel);
        isDialogOpen = true;
    }

    closeModal(id) {
        let settingGroup = id.replace('Dialog', '');
        if (id == 'gamemodeDialog') settingGroup = 'gameSettings';
        [...document.getElementsByClassName('option')]
            .filter((item) => item.parentElement.parentElement.id == id)
            .forEach((setting) => {
                const settingid = setting.id, type = setting.classList[1];
                if (type == 'number' && setting.value == '') setting.value = currentRangeOption.min;
                eval(settingGroup)[settingid] =
                    type == 'check' ? setting.checked :
                        type == 'keybind' ? setting.textContent :
                            setting.classList[2] == 'exp' ? toExpValue(setting.value) :
                                setting.value;
                if (settingid == 'nextQueue') {
                    nextPieces[0] = setting.value.split(' ').filter((p) => pieceNames.includes(p))
                    shuffleRemainingPieces();
                    updateNext();
                }
                if (settingid == 'holdQueue') {
                    const filtp = [setting.value].filter((p) => pieceNames.includes(p))
                    holdPiece = { piece: getPiece(filtp), occured: false }; updateHold();
                }
                if (id == 'changeRangeValue') {
                    currentRangeOption.value = document.getElementById('rangeValue').value;
                    sliderChange(currentRangeOption);
                }
                if (settingid == 'audioLevel') {
                    songs[curSongIdx].volume = Number(displaySettings.audioLevel) / 1000;
                }
            })
        closeDialog(document.getElementById(id));
        saveSettings();
        if (id == 'displaySettingsDialog') renderStyles();
        if (id == 'gameSettingsDialog' || id == 'gamemodeDialog' || id == 'gameEnd') startGame();
        if (id == 'changeRangeValue') isDialogOpen = true;
    }

    closeDialog(element) {
        const closingAnimation = () => {
            element.removeEventListener('animationend', closingAnimation);
            element.classList.remove('closingAnimation');
            element.close()
        }
        isDialogOpen = false;
        element.classList.add('closingAnimation');
        element.addEventListener('animationend', closingAnimation)
    }

    sliderChange(el) {
        const text = el.parentElement.children[0].textContent.split(':')[0];
        let value = el.value;
        if (el.classList[2] == 'exp') value = toExpValue(value);
        if (el.classList[2] == 'exp' && value > 1000) value = "None";
        el.parentElement.children[0].textContent = `${text}: ${value}`
    }

    rangeClkLisnr(el) {
        el.parentElement.children[0].addEventListener('click', () => {
            currentRangeOption = el;
            openModal('changeRangeValue')
            document.getElementById('rangeValue').value = el.value;
        })
    }

    buttonInput(el) { document.getElementById('frontdrop').showModal(); bindingKey = el.id; }

    setKeybind(key) {
        document.getElementById(bindingKey).textContent = key;
        for (let i in controlSettings) {
            if (i == bindingKey) continue;
            const otherKeys = document.getElementById(i);
            if (otherKeys.textContent == key) otherKeys.textContent = 'None';
        }
        closeDialog(document.getElementById('frontdrop'));
        isDialogOpen = true;
        bindingKey = undefined;
    }

    saveSettings() {
        const data = [displaySettings, gameSettings, controlSettings];
        localStorage.setItem('settings', JSON.stringify(data));
    }

    loadSettings() {
        const data = localStorage.getItem('settings');
        if (data == null) return;
        const [tempDisplay, tempGame, tempControls] = JSON.parse(data);
        for (let s in tempDisplay) {
            if (tempDisplay[s] === undefined || tempDisplay[s] === "") continue;
            displaySettings[s] = tempDisplay[s]
        };
        for (let s in tempGame) {
            if (tempGame[s] === undefined || tempGame[s] === "") continue;
            gameSettings[s] = tempGame[s]
        };
        for (let s in tempControls) {
            if (tempControls[s] === undefined || tempControls[s] === "") continue;
            controlSettings[s] = tempControls[s]
        };
        divObjectiveText.textContent = modesText[gameSettings.gamemode];
    }

    setGamemode(modeNum) {
        gameSettings.gamemode = modeNum;
        divObjectiveText.textContent = modesText[gameSettings.gamemode];
    }

    downloadSettings() {
        saveSettings();
        let el = document.createElement('a');
        const text = localStorage.getItem('settings');
        el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        el.setAttribute('download', 'settings.teti');
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
    }

    uploadSettings(el) {
        const reader = new FileReader();
        reader.readAsText(el.files[0]);
        reader.onload = () => { localStorage.setItem('settings', reader.result); loadSettings() }
    }

    resetSettings(settingGroup) {
        for (let setting in eval(settingGroup)) eval(settingGroup)[setting] = "";
        saveSettings();
        location.reload();
    }

    toggleDialog() {
        if (isDialogOpen) { document.querySelectorAll("dialog[open]").forEach(e => closeDialog(e)) }
        else { openModal('settingsPanel'); }
    }

    checkValue(el, el2 = currentRangeOption) {
        currentRangeOption = el2;
        if (el.value == '') return;
        if (el.value < Number(el2.min)) el.value = Number(el2.min);
        if (el.value > Number(el2.max)) el.value = Number(el2.max);
    }
}