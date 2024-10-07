import sfxobj from "../data/sfxlist.json" with { type: "json" };
import { songsobj } from "../data/data.js";
import { Game } from "../game.js";

export class Sounds {
    sfx = {};
    songs = [];
    songNames = [];
    curSongIdx = 0;
    elSongProgress = document.getElementById("songProgress");
    elSongText = document.getElementById("songText");
    
    lowpassfilter;
    audioContext;


    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    /**
     * 
     * @param {string} audioName 
     * Name of audio as specified in sfxlist.json
     * @param {Boolean} replace
     * If true, stops currently playing audio and starts new one
     * If false, skips if audio is already playing
     */
    playSound(audioName, replace = true, silent = false) {
        if (this.sfx[audioName] == undefined) return;
        this.sfx[audioName].muted = silent;
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
            const name = file.name.split(".")[0];
            this.sfx[name] = new Audio(file.path);
        })

        this.audioContext = new window.AudioContext();
        this.lowpassfilter = this.audioContext.createBiquadFilter();
        this.lowpassfilter.type = "lowpass";
        this.lowpassfilter.frequency.value = 20000;

        songsobj.forEach(file => {
            const songaudio = new Audio(file.path);
            this.songs.push(songaudio);
            this.songNames.push(file.name.split(".")[0]);

            const track = this.audioContext.createMediaElementSource(songaudio);
            track.connect(this.lowpassfilter);
            this.lowpassfilter.connect(this.audioContext.destination);
        })
        // this.playSound("allclear") // wait literally how is this fine by chrome
    }

    setAudioLevel() {
        this.songs[this.curSongIdx].volume = Number(this.game.settings.volume.audioLevel) / 1000;
    }

    toggleSongMuffle(muffled) {
        const currentTime = this.audioContext.currentTime;
        this.lowpassfilter.frequency.cancelScheduledValues(currentTime);
        this.lowpassfilter.frequency.setValueAtTime(this.lowpassfilter.frequency.value, currentTime);  
        this.lowpassfilter.frequency.exponentialRampToValueAtTime(muffled ? 300 : 20000, currentTime + 1);  
    }
}
