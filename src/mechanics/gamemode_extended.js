import { Game } from "../main.js";

export class Zenith {
        climbPoints = 0;
        isLastRankChangePromote = !0;
        isHyperspeed = false;
        rankLock = 0;
        promotionFatigue = 0;
        rankLock = 0;
        tickPass = 0;
        tempAltitude = 0;
        bonusAltitude = 0;

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
            const s = .25 * Math.floor(Game.stats.climbSpeed);
            this.GiveBonus(s * e * (t ? 1 : 0));
            if (e <= 0 ) return 
            this.GiveClimbPts((e + .05) * (n ? 1 : 0))
        }

        GiveBonus(e) {
            this.bonusAltitude += e
        }

        GiveClimbPts(e) {
            this.climbPoints += e
        }

        startZenithMode() {
            clearInterval(Game.zenithTimer);
            document.getElementById("climbSpeedBar").style.display = "none"
            if(Game.settings.game.gamemode != "zenith") return
            document.getElementById("climbSpeedBar").style.display = "block"
            Game.pixi.CreateSpeedrunContainer()
            Game.zenithTimer = setInterval(
                () => {
                        let t = Math.floor(Game.stats.climbSpeed),
                            o = .25 * t,
                            a = this.GetSpeedCap(this.tempAltitude);
                    //calculate climb speed

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
                            Game.sounds.playSound("speed_down")
                            this.isLastRankChangePromote = !1
                            t--
                            if(t <= 6 && this.isHyperspeed)
                                {
                                    Game.pixi.StopSpeedrun()
                                    this.isHyperspeed = false
                                } 
                        }
                    }
                    else if (this.climbPoints >= s) {
                        this.climbPoints -= s,
                        Game.sounds.playSound("speed_up")
                        this.isLastRankChangePromote = !0,
                        t++;
                        this.rankLock = this.tickPass + Math.max(60, 60 * (5 - this.promotionFatigue));
                        this.promotionFatigue++;
                        if(t >= this.SpeedrunReq[this.GetFloorLevel(this.tempAltitude)] && this.SpeedrunReq[this.GetFloorLevel(this.tempAltitude)] != 0 && !this.isHyperspeed)
                        {
                            Game.pixi.StartSpeedrun()
                            this.isHyperspeed = true
                        }
                    }

                //calculate stats
                    Game.stats.climbSpeed = t + this.climbPoints / (4 * t);
                    this.tempAltitude += o / 60 * a
                    if (this.bonusAltitude > 0)
                        if (this.bonusAltitude <= .05)
                            this.tempAltitude += this.bonusAltitude,
                            this.bonusAltitude = 0;
                        else {
                            const e = Math.min(10, .1 * this.bonusAltitude);
                            this.tempAltitude += e,
                            this.bonusAltitude -= e
                        }

                    if(Game.stats.floor != this.GetFloorLevel(this.tempAltitude)){
                        this.startZenithMode()
                        Game.stats.floor = this.GetFloorLevel(this.tempAltitude)
                        Game.sounds.playSound("zenith_levelup")
                        Game.renderer.renderTimeLeft("FLOOR " + Game.stats.floor)
                        if(Game.stats.floor == 10 && this.isHyperspeed)
                        {
                            Game.pixi.StopSpeedrun()
                            this.isHyperspeed = false
                        } 
                    }
                    Game.stats.altitude = this.tempAltitude
                    this.tickPass++
                    this.drawClimbSpeedBar(Math.floor(Game.stats.climbSpeed), this.climbPoints, s)
            }
                , 1000 / Game.tickrate);
        }

        checkSpeedrun(c){
            let n = c >= this.SpeedrunReq[this.GetFloorLevel(this.tempAltitude)]
            return n
        }

        drawClimbSpeedBar(speed, point, require){ // todo: drawing polygons (parallelogram) cus idk
            const color = ["var(--invis)", "#e43921", "#ffb400", "#82fc40", "#3ca6ff", "#ff46da", "#ffc48e", "#99ffc6", "#00f7ff", "#ffbbea", "#ffffff"]
            const climbSpeedBar = document.getElementById("climbSpeedBar")

            climbSpeedBar.value = point
            climbSpeedBar.max = require
            // changes css variable, better selection
            document.getElementById("climbSpeedBar").style.setProperty("--background-colour", color[Math.min(10, speed - 1)])
            document.getElementById("climbSpeedBar").style.setProperty("--bar-colour", color[Math.min(10, speed)])
        }
 
}

export class Grandmaster {

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
    ];
    gradeBoostTable = [
        0,1,2,3,4,5,5,6,6,7,7,7,8,8,8,9,9,9,10,11,12,12,12,13,13,14,14,15,15,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,26,27,27,27,27,28,28,28,28,28,29,29,29,29,29,30,30,30,30,30
];

    coolsTable = [52, 52, 49, 45, 45, 42, 42, 38, 38, 0];
    regretsTable = [90, 75, 75, 68, 60, 60, 50, 50, 50, 50];

    addGrade(row, cmb, lvl){
        if(Game.settings.game.gamemode != "race") return
        this.checkSectionCleared();
        this.checkCool();
        Game.stats.grade = this.grades[this.gradeBoost + this.coolsCount - this.regretsCount];
        if (row<1) return;

        const pts = this.gradePointBonus[Math.min(10, this.internalGrade)][row - 1];
        const cmb_mult = this.mult[Math.min(9, cmb)][row - 1];
        const lvl_mult = Math.floor(lvl / 250) + 1;

        this.gradePoint += pts*cmb_mult*lvl_mult;

        if (this.gradePoint >= 100) {
            this.gradePoint = 0;
            this.internalGrade++;
            this.gradeBoost = this.gradeBoostTable[this.internalGrade];
            this.startGrandmasterTimer();
        };
    }
    
    startGrandmasterTimer(){
        clearInterval(Game.grandmasterTimer);
        if(Game.settings.game.gamemode != "race") return
        Game.grandmasterTimer = setInterval(() => {
            this.gradePoint = Math.max(0, this.gradePoint - 1);
        }, (1000 / 60 * this.gradePointDecay[Math.min(31, this.internalGrade)]) )
    }

    checkSectionCleared(){
        if(Game.stats.tgm_level >= this.sectionTarget){
            Game.renderer.renderTimeLeft("SECTION " + Math.ceil(this.sectionTarget / 100) + " CLEAR");
            Game.sounds.playSound("levelup");
            if(this.sectionTime >= this.regretsTable[(this.sectionTarget / 100) - 1]){
                Game.renderer.renderTimeLeft("REGRET");
                this.regretsCount++;
            }
            this.sectionTime = 0;
            this.isCoolCheck = false;
            this.sectionTarget = Math.min(this.sectionTarget + 100, Game.settings.game[Game.modes.modeJSON.target])
        }
    }

    checkCool(){
        if(Game.stats.tgm_level % 100 >= 70 && !this.isCoolCheck){
            this.isCoolCheck = true;
            if(this.sectionTime <= this.coolsTable[(this.sectionTarget / 100) - 1]){
                Game.renderer.renderTimeLeft("COOL!");
                this.coolsCount++;
            }
        }
    }
}
