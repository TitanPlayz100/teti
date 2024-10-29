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
        isHyperspeed = true;
        rankLock = 0;
        promotionFatigue = 0;
        rankLock = 0;
        tickPass = 0;
        tempAltitude = 0

        FloorDistance = [0, 50, 150, 300, 450, 650, 850, 1100, 1350, 1650, 1 / 0];
        SpeedrunReq = [7, 8, 8, 9, 9, 10, 0, 0, 0, 0, 0];
        
        
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
            clearInterval(this.game.zenithTimer);
            document.getElementById("climbSpeedBar").style.display = "none"
            if(this.game.settings.game.gamemode != "zenith") return
            document.getElementById("climbSpeedBar").style.display = "block"
            this.game.zenithTimer = setInterval(
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

                    this.game.stats.climbSpeed = t + this.climbPoints / (4 * t);

                    this.tempAltitude += o / 60 * a

                    if(this.game.stats.floor != this.GetFloorLevel(this.tempAltitude)){
                        this.startZenithMode()
                        this.game.stats.floor = this.GetFloorLevel(this.tempAltitude)
                        this.game.sounds.playSound("zenith_levelup")
                        this.game.renderer.renderTimeLeft("FLOOR " + this.game.stats.floor)
                    }
                    const g = this.tempAltitude
                    this.game.stats.altitude = this.tempAltitude
                    this.tickPass++
                    this.drawClimbSpeedBar(Math.floor(this.game.stats.climbSpeed), this.climbPoints, s)
        }
                , 1000 / this.game.tickrate);
        }

        drawClimbSpeedBar(speed, point, require){ // todo: drawing polygons (parallelogram) cus idk
            const color = ["var(--invis)", "red", "orange", "green", "blue", "#FF1493", "tan", "lightgreen", "lightblue", "pink", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white"]
            const climbSpeedBar = document.getElementById("climbSpeedBar")

            climbSpeedBar.value = point
            climbSpeedBar.max = require
            // changes css variable, better selection
            document.getElementById("climbSpeedBar").style.setProperty("--background-colour", color[speed-1])
            document.getElementById("climbSpeedBar").style.setProperty("--bar-colour", color[speed])
        }
 
}

export class Grandmaster {
    
    /**
     * @param {Game} game
     */

    constructor(game) {
        this.game = game
    }

    gradeBoost = 0; // the one used to determine which grade to shown in the array
    gradePoint = 0; 
    internalGrade = 0; // the one to determine how many grade to boost
    isCoolCheck = false;
    coolsCount = 0;
    regretsCount = 0;
    sectionTarget = 100;
    sectionTime = 0;

    grades = [
        "9","8","7","6","5","4","3","2","1",
        "S1","S2","S3","S4","S5","S6","S7","S8","S9",
        "m1","m2","m3","m4","m5","m6","m7","m8","m9",
        "M","MK","MV","MO","MM-","MM","MM+","GM-","GM","GM+","TM-","TM","TM+"
    ];
    gradePointDecay = [
        125, 80, 80, 50, 45, 45, 45,
        40, 40, 40, 40, 40, 30, 30, 30,
        20, 20, 20, 20, 20,
        15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
        10, 10
    ];
    mult = [
        [1.0, 1.0, 1.0, 1.0],
        [1.0, 1.2, 1.4, 1.5],
        [1.0, 1.2, 1.5, 1.8],
        [1.0, 1.4, 1.6, 2.0],
        [1.0, 1.4, 1.7, 2.2],
        [1.0, 1.4, 1.8, 2.3],
        [1.0, 1.4, 1.9, 2.4],
        [1.0, 1.5, 2.0, 2.5],
        [1.0, 1.5, 2.1, 2.6],
        [1.0, 2.0, 2.5, 3.0],
    ];
    gradePointBonus = [
        [10, 20, 40, 50],
        [10, 20, 30, 40],
        [10, 20, 30, 40],
        [10, 15, 30, 40],
        [10, 15, 20, 40],
        [5, 15, 20, 30],
        [5, 10, 20, 30],
        [5, 10, 15, 30],
        [5, 10, 15, 30],
        [5, 10, 15, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30],
        [2, 12, 13, 30], // is this long enough?
    ];
    gradeBoostTable = [
        0,1,2,3,4,5,5,6,6,7,7,7,8,8,8,9,9,9,10,11,12,12,12,13,13,14,14,15,15,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,26,27,27,27,27,28,28,28,28,28,29,29,29,29,29,30,30,30,30,30
    ];

    coolsTable = [52, 52, 49, 45, 45, 42, 42, 38, 38, 0];
    regretsTable = [90, 75, 75, 68, 60, 60, 50, 50, 50, 50];

    addGrade(row, cmb, lvl){
        if(this.game.settings.game.gamemode != "race") return
        this.checkSectionCleared();
        this.checkCool();
        this.game.stats.grade = this.grades[this.gradeBoost + this.coolsCount - this.regretsCount];
        if (row<1) return;

        const pts = this.gradePointBonus[this.internalGrade][row - 1];
        const cmb_mult = this.mult[Math.min(9, cmb)][row - 1];
        const lvl_mult = Math.floor(lvl / 250) + 1;

        this.gradePoint += pts*cmb_mult*lvl_mult;

        if (this.gradePoint >= 100) {
            this.gradePoint = 0;
            this.internalGrade++;
            this.gradeBoost = this.gradeBoostTable[this.internalGrade];
            this.startGrandmasterTimer(this.gradePointDecay[this.internalGrade]);
        };
    }
    
    startGrandmasterTimer(){
        clearInterval(this.game.grandmasterTimer);
        if(this.game.settings.game.gamemode != "race") return
        this.game.grandmasterTimer = setInterval(() => {
            this.gradePoint = Math.max(0, this.gradePoint - 1);
        }, (1000 / 60 * this.gradePointDecay[this.internalGrade]) )
    }

    checkSectionCleared(){
        if(this.game.stats.tgm_level >= this.sectionTarget){
            this.game.renderer.renderTimeLeft("SECTION " + this.sectionTarget / 100 + " CLEAR");
            this.game.sounds.playSound("levelup");
            if(this.sectionTime >= this.regretsTable[(this.sectionTarget / 100) - 1]){
                this.game.renderer.renderTimeLeft("REGRET");
                this.regretsCount++;
            }
            this.sectionTime = 0;
            this.isCoolCheck = false;
            this.sectionTarget = Math.min(this.sectionTarget + 100, this.game.settings.game[this.game.modes.modeJSON.target])
        }
    }

    checkCool(){
        if(this.game.stats.tgm_level % 100 >= 70 && !this.isCoolCheck){
            this.isCoolCheck = true;
            if(this.sectionTime <= this.coolsTable[(this.sectionTarget / 100) - 1]){
                this.game.renderer.renderTimeLeft("COOL!");
                this.coolsCount++;
            }
        }
    }
}
