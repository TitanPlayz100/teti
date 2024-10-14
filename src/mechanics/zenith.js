import { Game } from "../game.js";

export class Zenith {
    
    /**
     * @param {Game} game
     */

    constructor(game) {
        this.game = game
    }

        climbPoints = 0;
        isLastRankChangePromote = !0;
        isHyperspeed = false;
        isHyperspeedSeen = false;
        rankLock = 0;
        promotionFatigue = 0;
        rankLock = 0;
        tickPass = 0;
        tempAltitude = 0;


        FloorDistance = [0, 50, 150, 300, 450, 650, 850, 1100, 1350, 1650, 1 / 0];
        SpeedrunReq = [6, 7, 7, 8, 8, 9, 0, 0, 0, 0, 0];
        FloorTime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        
        
        GetSpeedCap(e) {
            const t = this.FloorDistance.find((t => e < t)) - e;
            return Math.max(0, Math.min(1, t / 5 - .2))
        }
        
        GetFloorLevel(e) {
            return this.FloorDistance.filter((t => e >= t)).length || 1
        }

        AwardLines(e, t=!0, n=!0) {
            const s = .25 * Math.floor(this.game.stats.climbSpeed);
            this.GiveBonus(s * e * (t ? 1 : 0));
            if (e <= 0 ) return 
            this.GiveClimbPts((e + .05) * (n ? 1 : 0))
        }

        GiveBonus(e) {
            this.tempAltitude += e
        }

        GiveClimbPts(e) {
            this.climbPoints += e
        }

        startZenithMode() {
            clearInterval(this.game.mechanics.zenithTimer);
            document.getElementById("climbSpeedBar").style.display = "none"
            if(this.game.settings.game.gamemode != "zenith") return
            document.getElementById("climbSpeedBar").style.display = "block"
            this.game.mechanics.zenithTimer = setInterval(
                () => {
                        let t = Math.floor(this.game.stats.climbSpeed),
                            o = .25 * t,
                            a = this.GetSpeedCap(this.tempAltitude);

                    if (this.tickPass >= this.rankLock) {
                        let e = 3;
                        this.climbPoints -= e * (t ** 2 + t) / 3600
                    }
                    const s = 4 * t,
                    i = 4 * (t - 1)                 

                    if (this.climbPoints < 0){
                        if (t <= 1){
                            this.climbPoints = 0;
                        }
                        else {
                            this.climbPoints += i,
                            this.game.sounds.playSound("speed_down")
                            this.isLastRankChangePromote = !1,
                            t--
                        }
                    }
                    else if (this.climbPoints >= s) {
                        this.climbPoints -= s,
                        this.game.sounds.playSound("speed_up")
                        this.isLastRankChangePromote = !0,
                        t++;
                        this.rankLock = this.tickPass + Math.max(60, 60 * (5 - this.promotionFatigue));
                        this.promotionFatigue++;
                    }

                    const n = this.SpeedrunReq[this.GetFloorLevel(this.tempAltitude)]

                    this.isHyperspeed = t >= n

                    if(this.isHyperspeed && !this.isHyperspeedSeen){
                        this.game.sounds.playSound("zenith_speedrun_start")
                        this.isHyperspeedSeen = true;
                        this.game.boardeffects.toggleRainbow("true");
                        this.showFloorTime()
                        this.setAllFloorTimes(this.game.stats.floor)

                    }

                    if(this.isHyperspeedSeen && t < 6){
                        this.game.sounds.playSound("zenith_speedrun_end");
                        this.isHyperspeedSeen = false;
                        this.game.boardeffects.toggleRainbow();
                        this.hideFloorTime()
                    }

                    this.game.stats.climbSpeed = t + this.climbPoints / (4 * t);

                    this.tempAltitude += o / 60 * a

                    if(this.game.stats.floor != this.GetFloorLevel(this.tempAltitude)){
                        this.startZenithMode()

                        if(this.FloorTime[this.game.stats.floor] == 0){
                            this.setBox(this.game.stats.floor, "clear")
                        }
                        else{
                            this.setBox(this.game.stats.floor, "miss")
                        }
                        
                        
                        this.FloorTime[this.game.stats.floor] = this.tickPass / 50
                        document.getElementById("speedrunSegment " + this.game.stats.floor).textContent = this.FloorTime[this.game.stats.floor]


                        this.game.stats.floor = this.GetFloorLevel(this.tempAltitude)
                        this.game.sounds.playSound("zenith_levelup")
                        this.setBox(this.game.stats.floor, "focus")
                        this.game.renderer.renderTimeLeft("FLOOR " + this.game.stats.floor)
                        
                    }

                    this.game.stats.altitude = Math.floor(this.tempAltitude)
                    this.tickPass++
                    this.drawClimbSpeedBar(Math.floor(this.game.stats.climbSpeed), this.climbPoints, s)
        }
                , 1000 / this.game.tickrate);
        }

        drawClimbSpeedBar(speed, point, require){
            const color = ["var(--invis)", "red", "orange", "green", "blue", "#FF1493", "tan", "lightgreen", "lightblue", "pink", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white"]
            const climbSpeedBar = document.getElementById("climbSpeedBar")

            climbSpeedBar.value = point
            climbSpeedBar.max = require
            document.styleSheets[1].cssRules[24].style.backgroundColor = color[speed - 1]
            document.styleSheets[1].cssRules[23].style.backgroundColor = color[speed]
        }

        showFloorTime(){
            const element = document.getElementById("speedrunTime")
            element.classList = "show"
        }

        hideFloorTime(){
            const element = document.getElementById("speedrunTime")
            element.classList = "hide"
        }

        setAllFloorTimes(){
            for (let i = 1; i < 10; i++) {
                if(this.FloorTime[i] == 0){
                    document.getElementById("speedrunSegment " + i).textContent = "FLOOR " + i
                }
                else{
                    document.getElementById("speedrunSegment " + i).textContent = this.FloorTime[i]
                }
            }
        }

        resetAllBox(){
            for (let i = 1; i < 10; i++) {
                if(this.FloorTime[i] == 0){
                    document.getElementById("speedrunSegment " + i).textContent = "FLOOR " + i
                }
                else{
                    document.getElementById("speedrunSegment " + i).textContent = this.FloorTime[i]
                }
                document.getElementById("speedrunSegment " + i).classList = ""
            }
        }

        setBox(boxNum, stat){
            document.getElementById("speedrunSegment " + boxNum).classList = stat
        }
}