import { Game } from "./game.js";

const game = new Game();

console.log("%cTETI", "color: #cccccc; font-size: 5em; font-weight: 900; background-color: #222222; padding: 0 0.25em; border-radius: 3px;"),

// allow html to access functions
window["menu"] = game.menuactions;
window["modal"] = game.modals;
window["songs"] = game.sounds;

window.addEventListener("keydown", event => {
    if (event.key == undefined) return;
    let key = event.key.length > 1 ? event.key : event.key.toLowerCase(); // 1 letter words are lowercase
    if (event.altKey) key = "Alt+" + key;
    if (event.ctrlKey) key = "Ctrl+" + key;
    
    game.controls.onKeyDownRepeat(event, key);
    if (event.repeat) return;
    game.controls.onKeyDown(event, key);
});

window.addEventListener("keyup", event => {
    if (event.key == undefined) return;
    let key = event.key.length > 1 ? event.key : event.key.toLowerCase();
    game.controls.onKeyUp(event, key);
});

window.addEventListener('mousemove', () => {
    game.controls.toggleCursor(true);
})

document.body.addEventListener("mouseup", (e) => {
    game.boardeditor.mouseUp(e);
});

window.addEventListener("resize", () => {
    setTimeout(() => {
        game.pixi.resize();
        game.renderer.updateNext();
        game.renderer.updateHold();
    }, 0);
})


const elementSplashScreen = document.getElementById("splashScreen");
const elementSplashText = document.getElementById("splashText");
export function clearSplash() {
    elementSplashText.textContent = "Ready";
    elementSplashScreen.style.opacity = 0;
    elementSplashScreen.style.scale = 1.2;
    elementSplashScreen.style.display = "none";
    document.getElementById("ignoreText").style.opacity = 0.5;
}

window.addEventListener("focus", function () {
    document.getElementById("nofocus").style.display = "none";
});

window.addEventListener("blur", function () {
    if (!game.settings.display.outoffocus) return
    document.getElementById("nofocus").style.display = "block";
});

window.onerror = (msg, url, lineNo, columnNo, error) => {
    game.modals.generate.notif(error, msg + ". ln " + lineNo, "error");
}
