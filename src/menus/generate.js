import { Game } from "../game.js";


export class GenerateMenus {
    /**
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;
    }

    generateGamemodeMenu() {
        this.game.modes.getGamemodeNames().forEach(name => {
            const setting = this.game.modes.getGamemodeJSON(name);
            const button = document.createElement("button");
            button.id = name;
            button.classList.add("gamemodeSelect");
            button.textContent = setting.displayName;
            button.addEventListener("click", () => {
                menu.setGamemode(name);
                modal.closeModal("gamemodeDialog");
            });
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
        const previous = [...document.getElementsByClassName("pbbox")];
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

            pbbox.classList.add( "pbbox settingLayout");
            this.pblistStart.parentNode.insertBefore(pbbox, this.pblistStart);
        })
    }

    displayStats() {
        const previous = [...document.getElementsByClassName("statText")];
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

    addScrollListeners() {
        this.settingDialogs.forEach(box => {
            const boxsettings = this.settings.filter(item => item.parentElement.parentElement.id == box.parentElement.id);
            box.addEventListener("scroll", () => {
                this.updateSizes(box, boxsettings);
            })
        })
    }

    updateSizes(box, settings) {
        const totalHeight = box.scrollHeight;
        settings.forEach(setting => {
            const position = setting.getBoundingClientRect().top
            let newpos = 1 - (position - window.innerHeight * 0.47) / totalHeight
            if (newpos > 1) newpos = newpos - 2 * (newpos - 1);

            setting.style.scale = newpos < 0.7 ? 0.5 : 1
            setting.style.opacity = newpos < 0.7 ? 0.3 : 1
        })
    }
}