import { Game } from "./game.js";

const game = new Game();

window["menu"] = game.menuactions;
window["modal"] = game.modals;
window["songs"] = game.sounds;
const elementSplashScreen = document.getElementById("splashScreen");
const elementSplashText = document.getElementById("splashText");

window.addEventListener("keydown", event => {
    let key = event.key.length > 1 ? event.key : event.key.toLowerCase(); // only characters are lowercase
    if (event.altKey) key = "Alt+" + key;
    if (event.ctrlKey) key = "Ctrl+" + key;

    game.controls.onKeyDownRepeat(event, key);
    if (event.repeat) return;
    game.controls.onKeyDown(event, key);
})

window.addEventListener("keyup", event => {
    game.controls.onKeyUp(event);
});

document.onresize = () => {
    game.renderer.sizeCanvas();
    game.renderer.updateNext();
    game.renderer.updateHold();
}

// splash menu
window.addEventListener("DOMContentLoaded", () => {
    elementSplashText.textContent = "loading assets";
    document.getElementById("ignoreText").style.opacity = 0.5;
})

window.addEventListener("load", () => {
    elementSplashText.textContent = "loaded";
    finishLoad()
});

window.finishLoad = () => {
    elementSplashScreen.style.opacity = 0;
    elementSplashScreen.style.scale = 1.2;
    elementSplashScreen.style.display = "none";
}

window.addEventListener("focus", function(){ 
    document.getElementById("nofocus").style.display = "none";
});

window.addEventListener("blur", function(){ 
    if (!game.settings.display.outoffocus) return
    document.getElementById("nofocus").style.display = "block";
});
