import { GameClass } from "./game.js";

const elementSplashScreen = document.getElementById("splashScreen");
const elementSplashText = document.getElementById("splashText");
export function clearSplash() {
    elementSplashText.textContent = "Ready";
    elementSplashScreen.style.opacity = 0;
    elementSplashScreen.style.scale = 1.2;
    elementSplashScreen.style.display = "none";
}


export const Game = new GameClass();
await Game.init();

console.log("%cTETI", "color: #cccccc; font-size: 5em; font-weight: 900; background-color: #222222; padding: 0 0.25em; border-radius: 3px;");

// allow html to access functions
window["menu"] = Game.menuactions;
window["modal"] = Game.modals;
window["songs"] = Game.sounds;
window["Game"] = Game;

window.addEventListener("keydown", event => {
    if (event.key == undefined) return;
    let key = event.key.length > 1 ? event.key : event.key.toLowerCase(); // 1 letter words are lowercase
    if (event.altKey) key = "Alt+" + key;
    if (event.ctrlKey) key = "Ctrl+" + key;

    Game.controls.onKeyDownRepeat(event, key);
    if (event.repeat) return;
    Game.controls.onKeyDown(event, key);
});

window.addEventListener("keyup", event => {
    if (event.key == undefined) return;
    let key = event.key.length > 1 ? event.key : event.key.toLowerCase();
    Game.controls.onKeyUp(event, key);
});

window.addEventListener('mousemove', () => {
    Game.controls.toggleCursor(true);
})

document.body.addEventListener("mouseup", (e) => {
    Game.boardeditor.mouseUp(e);
});

window.addEventListener("resize", () => {
    setTimeout(() => {
        Game.pixi.resize();
        Game.renderer.setupSidebar();
        Game.renderer.updateNext();
        Game.renderer.updateHold();
    }, 0);
})

window.addEventListener("focus", function () {
    document.getElementById("nofocus").style.display = "none";
});

window.addEventListener("blur", function () {
    if (!Game.settings.display.outoffocus) return
    document.getElementById("nofocus").style.display = "block";
});

window.onerror = (msg, url, lineNo, columnNo, error) => {
    Game.modals.generate.notif(error, msg + ". ln " + lineNo, "error");
}
