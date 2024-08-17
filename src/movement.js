// @ts-check
import { Game } from "./game.js";

export class Movement {
    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    initKeyListeners() {
        window.addEventListener('keydown', event => {
            if (event.key == 'Escape') event.preventDefault();
            if (event.key == 'Escape' && bindingKey == undefined) toggleDialog();
            if (event.repeat || isDialogOpen) return;
            if (disabledKeys.includes(event.key)) event.preventDefault();
            if (firstMove && event.key != 'Escape') firstMovement();
            if (event.key == controlSettings.resetKey) { playSound('retry'); startGame(); }
            if (gameEnd) return;
            if (event.key == controlSettings.cwKey) rotate("CW");
            if (event.key == controlSettings.ccwKey) rotate("CCW");
            if (event.key == controlSettings.rotate180Key) rotate("180");
            if (event.key == controlSettings.hdKey) harddrop();
            if (event.key == controlSettings.holdKey) switchHold();
            if (event.key == controlSettings.rightKey) startDas("RIGHT");
            if (event.key == controlSettings.leftKey) startDas("LEFT");
            if (event.key == controlSettings.sdKey) startArrSD();
        });

        window.addEventListener('keyup', event => {
            if (event.key == controlSettings.rightKey) endDasArr('RIGHT');
            if (event.key == controlSettings.leftKey) endDasArr('LEFT');
            if (event.key == controlSettings.sdKey) endDasArr('DOWN');
        });
    }

    // keypresses
    firstMovement() {
        startGravity();
        firstMove = false;
        timeouts['stats'] = setInterval(() => renderStats(), 20);
        const time = 60 * 1000 / gameSettings.survivalRate
        if (gameSettings.gamemode == 5) timeouts['survival'] = setInterval(() => addGarbage(1), time);
    }

    startDas(direction) {
        movePieceSide(direction);
        directionState[direction] = 'das'
        stopTimeout('das');
        stopInterval('arr');
        timeouts['das'] = setTimeout(() => startArr(direction), gameSettings.das);
    }

    startArr(direction) {
        if (direction == 'current') {
            if (directionState['RIGHT'] == 'arr' && directionState['LEFT'] == 'arr') return;
            if (directionState['RIGHT'] == 'arr') startArr('RIGHT');
            if (directionState['LEFT'] == 'arr') startArr('LEFT');
            return;
        }
        directionState[direction] = 'arr';
        stopInterval('arr')
        if (gameSettings.arr == 0) { timeouts['arr'] = -1; movePieceSide(direction, Infinity); }
        else { timeouts['arr'] = setInterval(() => movePieceSide(direction), gameSettings.arr); }
    }

    startArrSD() {
        directionState['DOWN'] = 'arr';
        clearInterval(timeouts['sd']);
        if (gameSettings.sdarr == 0) { timeouts['sd'] = -1; movePieceDown(true); return; }
        timeouts['sd'] = setInterval(() => movePieceDown(false), gameSettings.sdarr);
    }

    endDasArr(direction) {
        directionState[direction] = false;
        if (direction == 'RIGHT' || direction == 'LEFT') {
            const oppDirection = direction == 'RIGHT' ? 'LEFT' : 'RIGHT'
            if (directionState[oppDirection] == 'das') return;
            if (directionState[oppDirection] == 'arr') { startArr(oppDirection); return }
            stopTimeout('das'); stopInterval('arr');
        }
        if (direction == 'DOWN') stopInterval('sd');
    }


    // piece movement
    checkCollision(coords, action, collider = getMinos('S')) {
        for (let [x, y] of coords) {
            if ((action == "RIGHT" && x > 8) || (action == "LEFT" && x < 1) ||
                (action == "DOWN" && y < 1) || (action == "ROTATE" && x < 0 || x > 9 || y < 0) ||
                (action == "PLACE" && y > 19)) return true;
            for (let [x2, y2] of collider) {
                const col = (dx, dy) => x + dx == x2 && y + dy == y2;
                if ((action == "RIGHT" && col(1, 0)) || (action == "LEFT" && col(-1, 0)) ||
                    (action == "DOWN" && col(0, -1)) ||
                    ((action == "ROTATE" || action == "SPAWN") && col(0, 0))) return true;
            }
        }
    }

    checkTspin(rotation, [x, y], [dx, dy]) {
        if (currentPiece.name != 't') return false;
        isMini = false;
        const minos = spinChecks[(rotation + 1) % 4].concat(spinChecks[rotation - 1])
            .map(([ddx, ddy]) => checkCollision([[ddx + x, ddy + y]], 'ROTATE'))
        if ((minos[2] && minos[3]) && (minos[0] || minos[1])) return true;
        if ((minos[2] || minos[3]) && (minos[0] && minos[1])) {
            if ((dx == 1 || dx == -1) && dy == -2) return true;
            isMini = true; return true;
        }
    }

    rotate(type) {
        if (currentPiece.name == 'o') return;
        const newRotation = newRotateState(type, rotationState);
        const kickdata = getKickData(currentPiece, type, newRotation);
        const rotatingCoords = pieceToCoords(currentPiece[`shape${newRotation}`], currentLoc);
        const change = kickdata.find(([dx, dy]) =>
            !checkCollision(rotatingCoords.map((c) => [c[0] + dx, c[1] + dy]), 'ROTATE'));
        if (!change) return;
        MinoToNone("A");
        addMinos("A " + currentPiece.name, rotatingCoords, change)
        currentLoc = [currentLoc[0] + change[0], currentLoc[1] + change[1]]
        isTspin = checkTspin(newRotation, currentLoc, change);
        rotationState = newRotation; movedPieceFirst = true;
        incrementLock(); playSound('rotate'); displayShadow();
        if (isTspin) playSound('spin')
        if (gameSettings.gravitySpeed == 0) startGravity();
        startArr('current');
        if (directionState['DOWN'] == 'arr') startArrSD();
    }

    newRotateState(type, state) {
        const newState = (state + { "CW": 1, "CCW": -1, "180": 2 }[type]) % 4;
        return newState == 0 ? 4 : newState;
    }

    getKickData(piece, rotationType, shapeNo) {
        const isI = (piece.name == 'i') ? 1 : 0;
        const direction = (rotationType == "CCW") ? (shapeNo > 3) ? 0 : shapeNo : shapeNo - 1;
        return {
            "180": KickData180[isI][direction],
            "CW": KickData[isI][direction],
            "CCW": KickData[isI][direction].map(row => row.map(x => x * -1))
        }[rotationType]
    }

    movePieceSide(direction, max = 1) {
        if (directionState['DOWN'] == 'arr') startArrSD();
        const minos = getMinos('A');
        let amount = 0;
        const check = dx => !checkCollision(minos.map(([x, y]) => [x + dx, y]), direction);
        while (check(amount) && Math.abs(amount) < max) direction == 'RIGHT' ? amount++ : amount--;
        if (gameSettings.gravitySpeed == 0) startGravity();
        if (amount == 0) { stopInterval('arr'); return; }
        moveMinos(minos, 'RIGHT', amount);
        currentLoc[0] += amount; isTspin = false; isMini = false; movedPieceFirst = true;
        incrementLock(); playSound('move'); displayShadow();
        if (directionState['DOWN'] == 'arr') startArrSD();
    }

    movePieceDown(sonic) {
        const minos = getMinos('A');
        if (checkCollision(minos, 'DOWN')) return;
        moveMinos(minos, 'DOWN', 1);
        isTspin = false; isMini = false; currentLoc[1] -= 1; totalScore += 1; movedPieceFirst = true;
        if (checkCollision(getMinos('A'), 'DOWN')) scheduleLock();
        startArr('current');
        if (sonic) movePieceDown(true);
    }

    harddrop() {
        const minos = getMinos('A');
        let amount = 0;
        while (!checkCollision(minos.map(([x, y]) => [x, y - amount]), 'DOWN')) amount++;
        if (amount > 0) { isTspin = false; isMini = false; }
        moveMinos(minos, 'DOWN', amount);
        currentLoc[1] -= amount; totalScore += 2;
        playSound('harddrop');
        lockPiece();
    }
}