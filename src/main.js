import { Game } from "./game.js";

const game = new Game();

console.log("%cTETI", "color: #DFC0F3;\n\t\t\t\t\t display: block;\n\t\t\t\t\t font-size: 5em;\n\t\t\t\t\t font-weight: 900;\n\t\t\t\t\t text-shadow: 0px 0px 2px #9150BA;\n\t\t\t\t\t background-color: #45345088;\n\t\t\t\t\t padding: 0 0.25em;\n\t\t\t\t\t border-radius: 3px;"),


// allow html to access functions
window["menu"] = game.menuactions;
window["modal"] = game.modals;
window["songs"] = game.sounds;

const elementSplashScreen = document.getElementById("splashScreen");
const elementSplashText = document.getElementById("splashText");

window.addEventListener("keydown", event => {
    if (event.key == undefined) return;
    let key = event.key.length > 1 ? event.key : event.key.toLowerCase(); // 1 letter words are lowercase
    if (event.altKey) key = "Alt+" + key;
    if (event.ctrlKey) key = "Ctrl+" + key;

    game.controls.onKeyDownRepeat(event, key);
    if (event.repeat) return;
    game.controls.onKeyDown(event, key);
})

window.addEventListener("keyup", event => {
    if (event.key == undefined) return;
    let key = event.key.length > 1 ? event.key : event.key.toLowerCase();
    game.controls.onKeyUp(event, key);
});

window.addEventListener('mousemove', () => {
    game.controls.toggleCursor(true);
})

document.onresize = () => {
    game.renderer.sizeCanvas();
    game.renderer.updateNext();
    game.renderer.updateHold();
}

// splash menu
window.addEventListener("DOMContentLoaded", () => {
    elementSplashText.textContent = "Ready";
    elementSplashScreen.style.opacity = 0;
    elementSplashScreen.style.scale = 1.2;
    elementSplashScreen.style.display = "none";
    document.getElementById("ignoreText").style.opacity = 0.5;
})

window.addEventListener("focus", function () {
    document.getElementById("nofocus").style.display = "none";
});

window.addEventListener("blur", function () {
    if (!game.settings.display.outoffocus) return
    document.getElementById("nofocus").style.display = "block";
});

window.onerror = (msg, url, lineNo, columnNo, error) => {
    game.modals.generate.notif(error, msg + ". ln "+ lineNo, "error");
}
