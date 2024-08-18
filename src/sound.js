// @ts-check

import { Game } from "./game.js";

export class Sounds {
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    playSound(audioName, replace = true) {
        if (sfx[audioName] == undefined) {
            sfx[audioName] = new Audio(`assets/sfx/${audioName}.mp3`);
        }
        sfx[audioName].volume = displaySettings.sfxLevel / 1000;
        if (firstMove == true) return;
        if (!replace && !sfx[audioName].ended && sfx[audioName].currentTime != 0) return;
        sfx[audioName].currentTime = 0;
        sfx[audioName].play();
    }

    startSong() {
        document.getElementById("songText").textContent = `Now Playing ${songNames[curSongIdx]}`;
        songs[curSongIdx].onended = () => {
            endSong();
            startSong();
        };
        songs[curSongIdx].volume = displaySettings.audioLevel / 1000;
        songs[curSongIdx].play();
    }

    endSong() {
        songs[curSongIdx].pause();
        songs[curSongIdx].currentTime = 0;
        songs[curSongIdx].onended = undefined;
        curSongIdx = (curSongIdx + 1) % songs.length;
    }

    pauseSong() {
        if (songs[curSongIdx].paused) {
            songs[curSongIdx].play();
        } else {
            songs[curSongIdx].pause();
        }
    }
}
