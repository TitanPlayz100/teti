import { defaultSkins } from "../data/data.js";
import { Game } from "../game.js";
import { randomisers } from "../mechanics/randomisers.js";
import kicks from "../data/kicks.json" with { type: "json" };

export class GenerateMenus {
    gamemodeStart = document.getElementById("startGamemodeList");
    pblistStart = document.getElementById("PBlist");
    statsStart = document.getElementById("startStatsList");
    notifStack = document.getElementById("notifications");

    settingDialogs = [...document.getElementsByClassName("settingsBox")];
    settings = [...document.getElementsByClassName("settingRow")];

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

    generateSkinList() {
        const el = document.getElementById("skin").parentElement;
        const list = document.createElement("datalist");
        list.id = "options";
        defaultSkins.forEach(skin => {
            const option = document.createElement("option");
            option.value = skin;
            list.appendChild(option);
        })
        el.appendChild(list);
    }

    generateStatList() {
        const statoptions = [...document.getElementsByClassName("statoption")];
        const options = Object.getOwnPropertyNames(this.game.stats);
        options.sort();
        options.unshift("None");

        statoptions.forEach(setting => {
            options.forEach(stat => {
                const skip = ['clearCols', 'clearPieces', 'game', 'tspins'];
                if (skip.includes(stat)) return;
                const option = document.createElement("option");
                option.textContent = stat;
                setting.appendChild(option);
            });
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

            pbbox.classList.add("pbbox");

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
            text1.classList = "spanleft"
            text1.textContent = stat + ":"
            const text2 = document.createElement("span")
            text2.classList = "spanright"
            text2.textContent = Math.round(score * 1000) / 1000
            statItem.appendChild(text1);
            statItem.appendChild(text2);
            this.statsStart.parentNode.insertBefore(statItem, this.statsStart);
        })
    }

    updateSizes(box, settings) {
        const totalHeight = box.scrollHeight;
        settings.forEach(setting => {
            const position = setting.getBoundingClientRect().top
            let newpos = 1 - (position - window.innerHeight * 0.46) / totalHeight
            if (newpos > 1) newpos = newpos - 2 * (newpos - 1);

            setting.style.scale = newpos < 0.7 ? 0.9 : 1
            setting.style.opacity = newpos < 0.7 ? 0.3 : 1
        })
    }

    addMenuListeners() {
        this.settingDialogs.forEach(box => {
            const boxsettings = this.settings.filter(item => item.parentElement.parentElement.id == box.parentElement.id);
            box.addEventListener("scroll", () => {
                this.updateSizes(box, boxsettings);
            })
        })

        const selectKeys = [...document.getElementsByClassName("keybind")];
        selectKeys.forEach(key => {
            key.parentElement.addEventListener("click", () => {
                menu.buttonInput(key);
            })
        })

        const sliders = [...document.getElementsByClassName("range")];
        sliders.forEach(slider => {
            slider.addEventListener("input", () => {
                menu.sliderChange(slider);
            })
        })

        const limiter = document.getElementById("limiter");
        const limiter2 = document.getElementById("limiter2");
        const numberInput = [...document.getElementsByClassName("number")];

        numberInput.forEach(input => {
            input.addEventListener("input", () => {
                if (input.id == "backfireMulti") { menu.checkValue(input, limiter2) }
                else if (input.id == "rangeValue") { menu.checkValue(input) }
                else { menu.checkValue(input, limiter); }
            })
        })

        const gridType = document.getElementById("gridType");
        const types = ["round", "square", "dot"];
        types.forEach(type => {
            const option = document.createElement("option");
            option.textContent = type;
            gridType.appendChild(option);
        })

        const randomiser = document.getElementById("randomiser");
        const randomTypes = randomisers;
        randomTypes.forEach(type => {
            const option = document.createElement("option");
            option.textContent = type;
            randomiser.appendChild(option);
        })

        const kicktable = document.getElementById("kicktable");
        const kicktypes = Object.getOwnPropertyNames(kicks);
        kicktypes.forEach(type => {
            const option = document.createElement("option");
            option.textContent = type;
            kicktable.appendChild(option);
        })
    }

    notif(heading, message, type) {
        const types = { "message": "white", "success": "lightgreen", "error": "red", }
        const notif = document.createElement("div"); // notif box
        notif.classList.add("notif");
        notif.style.setProperty("--color", types[type]);
        const title = document.createElement("p"); // heading
        title.classList.add("notif_title");
        title.textContent = heading;
        notif.appendChild(title);
        const text = document.createElement("p");
        text.classList.add("notif_text");
        text.textContent = message;
        notif.appendChild(text); // text
        this.notifStack.appendChild(notif);

        const remove = () => {
            notif.style.animation = "fadeout 0.5s forwards";
            setTimeout(() => notif.remove(), 1000)
        }

        setTimeout(() => remove(), 10 * 1000)
        notif.addEventListener("click", () => remove())

    }
}