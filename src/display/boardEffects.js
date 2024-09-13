export class BoardEffects {
    X = 0;
    Y = 0;
    dX = 0;
    dY = 0;
    friction= 0.75;
    springConstant= 0.02;
    targetX = 0;
    targetY = 0;
    R = 0;
    dR = 0
    targetR = 0

    divBoard = document.getElementById("board");

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

        this.divBoard.style.translate = `${this.X}px ${this.Y}px`
    }

    rotate(torque) {
        this.dR += torque;
        let newangle = this.targetR - this.R;
        const fangle = newangle * this.springConstant;

        this.dR += fangle;
        this.dR *= this.friction;
        this.R += this.dR;
        this.divBoard.style.rotate = `${this.R}deg`
    }


}