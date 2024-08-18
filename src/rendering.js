// @ts-check
import { Game } from "./game.js";
import { toHex } from "./util.js";

export class Rendering {
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    
    updateNext() {
        nextQueueGrid = [...Array(15)].map(() => [...Array(4)].map(() => ''))
        const first5 = this.game.nextPieces[0].concat(this.game.nextPieces[1])
            .slice(0, this.game.gameSettings.this.game.nextPieces);
        first5.forEach((name, idx) => {
            const piece = getPiece(name), pn = piece.name;
            let dx = 0, dy = 3 * (4 - idx);
            if (pn == 'o') [dx, dy] = [dx + 1, dy + 1]
            this.board.pieceToCoords(piece.shape1).forEach(([x, y]) => nextQueueGrid[y + dy][x + dx] = 'A ' + pn)
        });
        renderToCanvas(ctxN, nextQueueGrid, 15, [0, 0], nextWidth, nextHeight);
        if (this.game.gameSettings.gamemode == 8 || !this.game.displaySettings.colouredQueues) return;
        canvasNext.style.outlineColor = this.game.pieces.filter(e => e.name == first5[0])[0].colour
    }

    updateHold() {
        holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ''));
        ctxH.clearRect(0, 0, canvasHold.offsetWidth + 10, canvasHold.offsetHeight)
        if (this.game.holdPiece.piece == undefined) return;
        const name = this.game.holdPiece.piece.name;
        const isO = name == 'o', isI = name == 'i';
        const [dx, dy] = [isO ? 1 : 0, isO ? 1 : isI ? -1 : 0];
        const coords = this.board.pieceToCoords(this.game.holdPiece.piece.shape1);
        coords.forEach(([x, y]) => holdQueueGrid[y + dy][x + dx] = 'A ' + name)
        const len = Math.round(minoSize / 2);
        const [shiftX, shiftY] = [isO || isI ? 0 : len, isI ? 0 : len];
        renderToCanvas(ctxH, holdQueueGrid, 2, [shiftX, shiftY], holdWidth, holdHeight)
        if (this.game.gameSettings.gamemode == 8 || !this.game.displaySettings.colouredQueues) return;
        canvasHold.style.outline = `0.2vh solid ${this.game.holdPiece.piece.colour}`
    }

    renderDanger() {
        const condition = getMinos('S').some(c => c[1] > 16) && gameSettings.gamemode != 7;
        if (condition && !inDanger) playSound('damage_alert');
        inDanger = condition;
        divDanger.style.opacity = condition ? 0.1 : 0;
    }

    renderActionText(damagetype, isBTB, isPC, damage, linecount) {
        if (damagetype != '') setText('cleartext', damagetype, 2000);
        if (combonumber > 0) setText('combotext', `Combo ${combonumber}`, 2000);
        if (isBTB && btbCount > 0) setText('btbtext', `BTB ${btbCount} `, 2000);
        if (isPC) setText('pctext', "Perfect Clear", 2000);
        if (damage > 0) setText('linessent', `${spikeCounter}`, 1500);

        if (spikeCounter > 0) spikePattern('white', 1);
        if (spikeCounter >= 10) spikePattern('red', 1.1)
        if (spikeCounter >= 20) spikePattern('lime', 1.2)

        if (isPC) playSound('allclear')
        if (btbCount == 2 && isBTB) playSound('btb_1')
        if (linecount == 4 && btbCount > 0) { playSound('clearbtb') }
        else if (linecount == 4) { playSound('clearquad') }
        else if (linecount > 0 && isTspin) { playSound('clearspin') }
        else if (linecount > 0) { playSound('clearline') }
        if (spikeCounter >= 15) playSound('thunder', false);
        if (combonumber > 0) playSound(`combo/combo_${combonumber > 16 ? 16 : combonumber}`);
    }

    spikePattern(colour, size) {
        divLinesSent.style.color = colour;
        divLinesSent.style.textShadow = `0 0 1vh ${colour}`;
        divLinesSent.style.fontSize = `${3.5 * size}vh`;
    }

    setText(id, text, duration) {
        const textbox = document.getElementById(id);
        textbox.textContent = text;
        textbox.style.transform = 'translateX(-2%)'; textbox.style.opacity = 1;
        if (timeouts[id] != 0) stopTimeout(id);
        timeouts[id] = setTimeout(() => {
            textbox.style.opacity = 0; textbox.style.transform = 'translateX(2%)'; spikeCounter = 0;
        }, duration);
    }

    renderStyles() {
        document.body.style.background = displaySettings.background;
        const height = Number(displaySettings.boardHeight) + 10
        divBoard.style.transform = `scale(${height}%) translate(-50%, -50%)`;
        canvasHold.style.outline = `0.2vh solid #dbeaf3`;
        const background = `rgba(0, 0, 0, ${Number(displaySettings.boardOpacity) / 100})`
        divBoard.style.backgroundColor = background;
        canvasHold.style.backgroundColor = background;
        canvasNext.style.backgroundColor = background;
    }

    renderStats() {
        totalTimeSeconds += 0.02
        const displaytime = (Math.round(totalTimeSeconds * 10) / 10).toFixed(1)
        let pps = 0.00, apm = 0.0;
        if (totalTimeSeconds != 0) pps = Math.round(totalPieceCount * 100 / totalTimeSeconds) / 100;
        if (totalTimeSeconds != 0) apm = Math.round(totalAttack * 10 / (totalTimeSeconds / 60)) / 10;
        elementStats1.textContent = `${displaytime}`
        elementStats2.textContent = `${apm.toFixed(1)}`
        elementStats3.textContent = `${pps.toFixed(2)}`
        elementSmallStat1.textContent = `${totalAttack}`
        elementSmallStat2.textContent = `${totalPieceCount}`
        objectives();
    }


    // board rendering
    renderToCanvas(cntx, grid, yPosChange, [dx, dy] = [0, 0], width, height) {
        if (gameSettings.gamemode == 8) {
            if (totalPieceCount % gameSettings.lookAheadPieces == 0 && !movedPieceFirst) {
                if (boardAlpha <= 0) { boardAlphaChange = 0; boardAlpha = 1; }
            } else {
                if (boardAlpha >= 1) boardAlphaChange = -0.05;
                if (boardAlpha <= 0) boardAlphaChange = 0;
            }
        }
        if (boardAlphaChange != 0) boardAlpha += boardAlphaChange;
        cntx.globalAlpha = boardAlpha.toFixed(2)
        cntx.clearRect(0, 0, width, height)
        grid.forEach((row, y) => {
            row.forEach((col, x) => {
                const [posX, posY] = [x * minoSize, (yPosChange - y) * minoSize]
                const cell = col.split(' ')
                cntx.lineWidth = 1;
                if (cell.includes('A') || cell.includes('S')) { // active piece or stopped piece
                    cntx.fillStyle = cell.includes('G') // garbage piece
                        ? 'gray'
                        : pieces.filter(p => p.name == cell[1])[0].colour;
                    cntx.fillRect(posX + dx, posY + dy, minoSize, minoSize)
                    cntx.globalAlpha = boardAlpha.toFixed(2);
                } else if (cell.includes('NP') && inDanger) { // next piece overlay
                    cntx.fillStyle = '#ff000020';
                    cntx.fillRect(posX, posY, minoSize, minoSize)
                } else if (cell.includes('Sh')) { // shadow piece
                    const colour = displaySettings.colouredShadow ? currentPiece.colour : '#ffffff'
                    cntx.fillStyle = colour + toHex(displaySettings.shadowOpacity);
                    cntx.fillRect(posX, posY, minoSize, minoSize)
                } else if (y < 20 && displaySettings.showGrid && cntx == ctx) { // grid
                    cntx.strokeStyle = '#ffffff' + toHex(displaySettings.gridopacity);
                    cntx.beginPath()
                    cntx.roundRect(posX, posY, minoSize - 1, minoSize - 1, minoSize / 4);
                    cntx.stroke()
                }
            })
        })
    }

    renderingLoop() {
        renderToCanvas(ctx, boardState, 39, [0, 0], boardWidth, boardHeight);
        if (boardAlphaChange != 0) { updateNext(); updateHold(); }
        setTimeout(() => requestAnimationFrame(renderingLoop), 0);
    }
}