// @ts-check

import { songNames, songs } from "./data.js";
import { Game } from "./game.js";

export class Sounds {
    sfx = {};
    curSongIdx = 0;
    elSongProgress = document.getElementById("songProgress");
    elSongText = document.getElementById("songText");

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    playSound(audioName, replace = true) {
        if (this.sfx[audioName] == undefined) {
            this.sfx[audioName] = new Audio(`assets/sfx/${audioName}.mp3`);
        }
        this.sfx[audioName].volume = this.game.displaySettings.sfxLevel / 1000;
        if (this.game.firstMove == true) return;
        if (!replace && !this.sfx[audioName].ended && this.sfx[audioName].currentTime != 0) return;
        this.sfx[audioName].currentTime = 0;
        this.sfx[audioName].play();
    }

    startSong() {
        this.elSongText.textContent = `Now Playing ${songNames[this.curSongIdx]}`;
        songs[this.curSongIdx].onended = () => {
            this.endSong();
            this.startSong();
        };
        songs[this.curSongIdx].volume = this.game.displaySettings.audioLevel / 1000;
        songs[this.curSongIdx].play();
    }

    endSong() {
        songs[this.curSongIdx].pause();
        songs[this.curSongIdx].currentTime = 0;
        songs[this.curSongIdx].onended = () => {};
        this.curSongIdx = (this.curSongIdx + 1) % songs.length;
    }

    pauseSong() {
        if (songs[this.curSongIdx].paused) {
            songs[this.curSongIdx].play();
        } else {
            songs[this.curSongIdx].pause();
        }
    }

    initSounds() {
        let menuSFX = (e, sfx) => {
            document
                .querySelectorAll(e)
                .forEach(el => (el.onmouseenter = () => this.game.sounds.playSound(sfx)));
        };
        menuSFX(".settingLayout", "menutap");
        menuSFX(".gamemodeSelect", "menutap");
        setInterval(() => {
            this.elSongProgress.value =
                (songs[this.curSongIdx].currentTime * 100) / songs[this.curSongIdx].duration;
        }, 2000);
    }

    setAudioLevel() {
        songs[this.curSongIdx].volume = Number(this.game.displaySettings.audioLevel) / 1000;
    }
}
