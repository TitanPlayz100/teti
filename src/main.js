import { Game } from "./game.js";

const game = new Game();

window["menu"] = game.menuactions;
window["modal"] = game.modals;
window["songs"] = game.sounds;

window.addEventListener("keydown", event => {
    game.controls.onKeyDown(event);
})

window.addEventListener("keyup", event => {
    game.controls.onKeyUp(event);
});

document.onresize = () => {
    game.rendering.sizeCanvas();
    game.rendering.updateNext();
    game.rendering.updateHold();
}
