import sfxobj from "./data/sfxlist.json" with { type: "json" };
import { songsobj } from "./data/data.js";
import { Game } from "./game.js";

export class Sounds {
    sfx = {};
    songs = [];
    songNames = [];
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
        if (this.sfx[audioName] == undefined) { console.log(audioName + ' not found'); return; }
        this.sfx[audioName].volume = this.game.settings.volume.sfxLevel / 1000;
        if (this.game.started == false) return;
        if (!replace && !this.sfx[audioName].ended && this.sfx[audioName].currentTime != 0) return;
        this.sfx[audioName].currentTime = 0;
        this.sfx[audioName].play();
    }

    startSong() {
        this.elSongText.textContent = `Now Playing ${this.songNames[this.curSongIdx]}`;
        this.songs[this.curSongIdx].onended = () => {
            this.endSong();
            this.startSong();
        };
        this.songs[this.curSongIdx].volume = this.game.settings.volume.audioLevel / 1000;
        this.songs[this.curSongIdx].play();
    }

    endSong() {
        this.songs[this.curSongIdx].pause();
        this.songs[this.curSongIdx].currentTime = 0;
        this.songs[this.curSongIdx].onended = () => { };
        this.curSongIdx = (this.curSongIdx + 1) % this.songs.length;
    }

    pauseSong() {
        if (this.songs[this.curSongIdx].paused) {
            this.songs[this.curSongIdx].play();
            this.elSongText.textContent = `Now Playing ${this.songNames[this.curSongIdx]}`;
        } else {
            this.songs[this.curSongIdx].pause();
            this.elSongText.textContent = `Not Playing`;

        }
    }

    async initSounds() {
        let menuSFX = (e, sfx) => {
            document.querySelectorAll(e)
                .forEach(el => (el.onmouseenter = () => this.game.sounds.playSound(sfx)));
        };
        menuSFX(".settingLayout", "menutap");
        menuSFX(".gamemodeSelect", "menutap");
        
        setInterval(() => {
            if (this.songs[this.curSongIdx].currentTime == 0) return;
            this.elSongProgress.value =
                (this.songs[this.curSongIdx].currentTime * 100) / this.songs[this.curSongIdx].duration;
        }, 2000);

        // preload all sfx
        sfxobj.forEach(file => {
            if (file.type == "dir") return;
            this.sfx[file.name.split(".")[0]] = new Audio(file.path);
        })

        songsobj.forEach(file => {
            this.songs.push(new Audio(file.path));
            this.songNames.push(file.name.split(".")[0]);
        })
        // this.playSound("allclear") wait literally how is this fine by chrome

    }

    setAudioLevel() {
        this.songs[this.curSongIdx].volume = Number(this.game.settings.volume.audioLevel) / 1000;
    }
}
