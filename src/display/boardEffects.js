export class BoardEffects {
    X = 0;
    Y = 0;
    dX = 0;
    dY = 0;
    friction = 0.75;
    springConstant = 0.02;
    targetX = 0;
    targetY = 0;
    R = 0;
    dR = 0
    targetR = 0

    divBoard = document.getElementById("board");
    divDanger = document.getElementById("dangerOverlay");
    border = document.getElementById('backborder')
    backboard = document.getElementById('backboard')

    move(forceX, forceY) {
        this.dX += forceX;
        this.dY += forceY;

        const newdx = this.targetX - this.X;
        const newdy = this.targetY - this.Y;
        const fX = newdx * this.springConstant;
        const fY = newdy * this.springConstant;

        this.dX += fX;
        this.dY += fY;
        this.dX *= this.friction;
        this.dY *= this.friction;
        this.X += this.dX;
        this.Y += this.dY;

        this.X = this.clamp(this.X, 0.5);
        this.Y = this.clamp(this.Y, 0.5);

        if (this.X != 0 || this.Y != 0) {
            this.divBoard.style.translate = `${this.X}px ${this.Y}px`
        }
    }

    rotate(torque) {
        this.dR += torque;
        let newangle = this.targetR - this.R;
        const fangle = newangle * this.springConstant;

        this.dR += fangle;
        this.dR *= this.friction;
        this.R += this.dR;
        this.R = this.clamp(this.R, 0.1);

        if (this.R != 0) {
            this.divBoard.style.rotate = `${this.R}deg`
        }
    }

    clamp(num, min) {
        if (num < min && num > -min) return 0;
        return num
    }

    rainbowBoard(game) {
        const stats = game.stats;
        const pbs = game.profilestats.personalBests;
        const gamemode = game.settings.game.gamemode;

        if (!game.settings.display.rainbowPB) return;
        const reset = () => {
            this.border.style.setProperty('--blur-size', `0vmin`)
            this.border.style.setProperty('--blur-strength', '0')
            this.backboard.style.setProperty('--blur-strength', '0')
        }

        if (stats.time < 0.5 || pbs[gamemode] == undefined) { reset(); return; }
        let pps = stats.pieceCount / stats.time;
        const pbstats = pbs[gamemode].pbstats;
        const pbpps = pbstats.pieceCount / pbstats.time;

        if (pps < pbpps) {
            reset()
        } else {
            this.border.style.setProperty('--blur-size', `0.3vmin`)
            this.border.style.setProperty('--blur-strength', '0.7vmin')
            this.backboard.style.setProperty('--blur-strength', '0.5vmin')
        }
    }

    toggleDangerBoard(inDanger) {
        this.border.classList.toggle("boardDanger", inDanger);
        this.divDanger.style.opacity = inDanger ? "0.1" : "0";
    }
}