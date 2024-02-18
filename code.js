let currentPiece, currentLoc, rotationState, totalTimeSeconds, totalPieceCount, totalAttack, heldpiece, gameEnd, remainingpieces, lockcount, combonumber, btbCount, isTspin, isMini, firstMove, isDialogOpen, spikeCounter, totalLines, totalScore, garbageRemaining, sfx = {}, toppingOut, bindingKey, stoppedMinoCoords;

let timeouts = { 'arr': 0, 'das': 0, 'sd': 0, 'lockdelay': 0, 'gravity': 0, 'stats': 0, 'lockingTimer': 0 }
let directionState = { 'RIGHT': false, 'LEFT': false, 'DOWN': false };
const disabledKeys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'Escape']
const audioLevel = 10;

// default settings
let displaySettings = { background: '#080B0C', boardOpacity: '99', gridopacity: 10, shadowOpacity: 20, boardHeightPercent: 61, showGrid: true, colouredShadow: false, colouredQueues: true, lockBar: true }
let gameSettings = { arr: 33, das: 160, sdarr: 100, gravitySpeed: 950, lockDelay: 600, maxLockMovements: 15, nextPieces: 5, allowLockout: false, preserveARR: true, infiniteHold: false, gamemode: 1, requiredLines: 40, timeLimit: 120, requiredAttack: 40 }
let controlSettings = { rightKey: 'ArrowRight', leftKey: 'ArrowLeft', cwKey: 'ArrowUp', ccwKey: 'z', hdKey: ' ', sdKey: 'ArrowDown', holdKey: 'c', resetKey: 'r', rotate180Key: 'a' }

function StartGame() {
    loadSettings();
    setGamemode(gameSettings.gamemode)
    resetState();
    renderStyles();
    clearInterval(timeouts['stats']);
    renderStats();
    if (gameSettings.gamemode == 4) addGarbage(10);
    drawPiece(randomiser());
}

this.addEventListener('keydown', event => {
    if (disabledKeys.includes(event.key)) event.preventDefault();
    if (event.key == 'Escape' && bindingKey == undefined) toggleDialog();
    if (event.repeat || isDialogOpen) return;
    if (firstMove && event.key != 'Escape') firstMovement();
    document.body.style.cursor = 'none';
    if (event.key == controlSettings.resetKey) StartGame();
    if (event.key == controlSettings.cwKey) rotate("CW");
    if (event.key == controlSettings.ccwKey) rotate("CCW");
    if (event.key == controlSettings.rotate180Key) rotate("180");
    if (event.key == controlSettings.hdKey) movePieceDown(true, false);
    if (event.key == controlSettings.holdKey) holdPiece();
    if (event.key == controlSettings.rightKey) startDas("RIGHT");
    if (event.key == controlSettings.leftKey) startDas("LEFT");
    if (event.key == controlSettings.sdKey) startArrSD();
});

this.addEventListener('keyup', event => {
    if (event.key == controlSettings.rightKey) endDasArr('RIGHT');
    if (event.key == controlSettings.leftKey) endDasArr('LEFT');
    if (event.key == controlSettings.sdKey) endDasArr('DOWN');
});

this.addEventListener('mousemove', () => document.body.style.cursor = 'auto')

function firstMovement() { // stats clock at 20ms
    startGravity();
    timeouts['stats'] = setInterval(() => renderStats(), 20);
    firstMove = false;
}

function startDas(direction) {
    movePieceSide(direction, false);
    directionState[direction] = 'das'
    stopTimeout('das'); stopInterval('arr');
    timeouts['das'] = setTimeout(() => startArr(direction), gameSettings.das);
}

function startArr(direction) {
    if (direction == 'current') {
        if (directionState['RIGHT'] == 'arr' && directionState['LEFT'] == 'arr') return;
        if (directionState['RIGHT'] == 'arr') startArr('RIGHT');
        if (directionState['LEFT'] == 'arr') startArr('LEFT');
        return;
    }
    directionState[direction] = 'arr';
    stopInterval('arr')
    if (gameSettings.arr == 0) { timeouts['arr'] = -1; movePieceSide(direction, true); return; }
    timeouts['arr'] = setInterval(() => movePieceSide(direction, false), gameSettings.arr);
}

function startArrSD() {
    directionState['DOWN'] = 'arr';
    clearInterval(timeouts['sd']);
    if (gameSettings.sdarr == 0) { timeouts['sd'] = -1; movePieceDown(false, true); return; }
    timeouts['sd'] = setInterval(() => movePieceDown(false, false), gameSettings.sdarr);
}

function endDasArr(direction) {
    if (direction == undefined) {
        if (gameSettings.preserveARR) return;
        directionState = { 'RIGHT': false, 'LEFT': false, 'DOWN': false }
        endDasArr('RIGHT'); endDasArr('LEFT'); endDasArr('DOWN');
        return;
    }
    directionState[direction] = false;
    if (direction == 'RIGHT' || direction == 'LEFT') {
        const oppDirection = direction == 'RIGHT' ? 'LEFT' : 'RIGHT'
        if (directionState[oppDirection] == 'das') return;
        if (directionState[oppDirection] == 'arr') { startArr(oppDirection); return }
        stopTimeout('das'); stopInterval('arr');
    }
    if (direction == 'DOWN') stopInterval('sd');
}

function checkCollision(coords, action, collider = stoppedMinoCoords) {
    for (let coord of coords) {
        const [x, y] = coord;
        switch (action) {
            case "RIGHT": if (x >= 10) return true; break;
            case "LEFT": if (x <= 1) return true; break;
            case "DOWN": if (y <= 1) return true; break;
            case "ROTATE": if (x < 1 || x > 10 || y < 1) return true; break;
            case "PLACE": if (y > 20) return true; break;
        }
        for (let [x2, y2] of collider) {
            switch (action) {
                case "RIGHT": if (x + 1 == x2 && y == y2) return true; break;
                case "LEFT": if (x - 1 == x2 && y == y2) return true; break;
                case "DOWN": if (x == x2 && y - 1 == y2) return true; break;
                case "ROTATE": if (x == x2 && y == y2) return true; break;
                case "SPAWN": if (x == x2 && y == y2) return true; break;
            }
        }
    }
}

function checkTspin(rotation, [x, y], [dx, dy]) {
    if (currentPiece.name != 't') return false;
    isMini = false;
    const spinChecks = [[[0, 2], [2, 2]], [[2, 2], [2, 0]], [[0, 0], [2, 0]], [[0, 0], [0, 2]]];
    const backminos = spinChecks[(rotation + 1) % 4].map((coord) => [coord[0] + x, coord[1] + y]);
    const frontminos = spinChecks[rotation - 1].map((coord) => [coord[0] + x, coord[1] + y]);
    const back1 = checkCollision([backminos[0]], "ROTATE")
    const back2 = checkCollision([backminos[1]], "ROTATE")
    const front1 = checkCollision([frontminos[0]], "ROTATE")
    const front2 = checkCollision([frontminos[1]], "ROTATE")
    if ((front1 && front2) && (back1 || back2)) return true;
    if ((front1 || front2) && (back1 && back2)) {
        if ((dx == 1 || dx == -1) && dy == -2) return true;
        isMini = true; return true;
    }
}

function rotate(type) {
    if (currentPiece.name == 'o') return;
    const newRotation = getNewRotationState(type);
    const kickdata = getKickData(currentPiece, type, newRotation);
    const rotatingCoords = pieceToCoords(currentPiece, 'shape' + newRotation, currentLoc, true);
    const change = kickdata.find(([dx, dy]) => {
        const coords = rotatingCoords.map((coord) => [coord[0] + dx, coord[1] + dy]);
        return !checkCollision(coords, 'ROTATE');
    });
    if (!change) return;
    removeMinos('.active')
    renderPieceFromCoords(document.getElementById('playingfield'), rotatingCoords, change[1],
        change[0], currentPiece, 'active');
    currentLoc = [currentLoc[0] + change[0], currentLoc[1] + change[1]]
    isTspin = checkTspin(newRotation, currentLoc, change);
    if (isTspin) playSound('spin')
    rotationState = newRotation;
    incrementLock(); displayShadow(); topoutSound(); playSound('rotate')
    if (gameSettings.gravitySpeed == 0) startGravity();
    startArr('current');
    if (directionState['DOWN'] == 'arr') startArrSD();
}

function getNewRotationState(type) {
    let newState = (rotationState + { "CW": 1, "CCW": -1, "180": 2 }[type] || 0) % 4;
    return newState == 0 ? 4 : newState;
}

function getKickData(piece, rotationType, shapeNo) {
    let isI = (piece.name == 'i') ? 1 : 0; // check if i piece
    let direction = (rotationType == "CCW") ? (shapeNo > 3) ? 0 : shapeNo : shapeNo - 1;
    return {
        "180": KickData180[isI][direction],
        "CW": KickData[isI][direction],
        "CCW": KickData[isI][direction].map(row => row.map(element => element * -1))
    }[rotationType]
}

function movePieceSide(direction, instant) {
    if (directionState['DOWN'] == 'arr') startArrSD();
    if (checkCollision(dQSACoords('.active'), direction)) {
        stopInterval('arr');
        if (gameSettings.gravitySpeed == 0) startGravity();
        return;
    };
    renderPieceMovement(direction, dQSA('.active'), 1);
    currentLoc[0] = direction == 'RIGHT' ? currentLoc[0] + 1 : currentLoc[0] - 1;
    displayShadow(); incrementLock(); topoutSound(); playSound('move');
    isTspin = false; isMini = false;

    if (gameSettings.gravitySpeed == 0) startGravity();
    if (instant) movePieceSide(direction, true);
}

function movePieceDown(harddrop, softdrop) {
    if (gameEnd) return;
    if (timeouts['lockdelay'] != 0) {
        if (harddrop) scheduleLock(true);
        return;
    };
    renderPieceMovement('DOWN', dQSA('.active'), 1); // performance lost
    isTspin = false; isMini = false;
    currentLoc[1] -= 1;
    totalScore += harddrop ? 2 : 1;
    const minos = dQSACoords('.active')
    if (checkCollision(minos, 'DOWN')) { scheduleLock(harddrop); return; }
    startArr('current')
    if (softdrop) playSound('move');
    if (harddrop) movePieceDown(true, false);
    if (softdrop) movePieceDown(false, true);
}

// mechanics
function clearLines() {
    const rows = dQSACoords('.stopped').map(coord => coord[1])
        .reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});        // count minos in row
    const clearRows = Object.keys(rows).filter((key) => rows[key] >= 10)            // get rows with 10 minos
        .map((row) => Number(row)).toReversed();                                    // convert rows to number and reverse
    for (let row of clearRows) {
        const DOMstopped = [...dQSA('.stopped')];
        let garbageClear = DOMstopped.filter((mino) => minoX(mino) == row)
            .some(mino => mino.classList.contains('garbage'));
        if (garbageClear) garbageRemaining -= 1;                                    // count garbage lines cleared
        DOMstopped.filter((mino) => minoX(mino) == row).forEach(mino => mino.remove()) // remove minos on row
        renderPieceMovement('DOWN', DOMstopped.filter(mino => minoX(mino) > row), 1) // move other minos down
    }
    renderActionText(clearRows.length, dQSA('.stopped'))
}

function incrementLock() {
    if (timeouts['lockdelay'] != 0) {
        clearLockDelay(false); lockcount++;
        if (gameSettings.maxLockMovements != 0 && displaySettings.lockBar) {
            const amountToAdd = 100 / gameSettings.maxLockMovements;
            document.getElementById('lockCounter').value += amountToAdd;
        }
    }
    if (checkCollision(dQSACoords('.active'), 'DOWN')) scheduleLock(false);
}

function scheduleLock(harddrop) {
    let LockMoves = gameSettings.maxLockMovements == 0 ? 99999 : gameSettings.maxLockMovements;
    if (lockcount >= LockMoves || harddrop) { lockPiece(); playSound('harddrop'); return; }
    if (gameSettings.lockDelay == 0) { timeouts['lockdelay'] = -1; return; }
    timeouts['lockdelay'] = setTimeout(() => lockPiece(), gameSettings.lockDelay);
    timeouts['lockingTimer'] = setInterval(() => {
        const amountToAdd = 1000 / gameSettings.lockDelay
        if (displaySettings.lockBar) document.getElementById('lockTimer').value += amountToAdd;
    }, 10);
}

function topoutSound() {
    const check = checkDeath(dQSACoords('.shadow'), dQSACoords('.nextSpawn')) && !toppingOut;
    if (check) { playSound('hyperalert'); toppingOut = true; return }
    toppingOut = false;
}

function checkDeath(coords, collider) {
    const collision = coords.every(coord => test = checkCollision([coord], 'PLACE', []));
    const collision2 = checkCollision(coords, 'SPAWN', collider)
    if (collision && gameSettings.allowLockout) return 'lockout';
    if (collision2) return 'blockout';
    return false;
}

function lockPiece() {
    const death = checkDeath(dQSACoords('.active'), dQSACoords('.nextSpawn'));
    if (death) endGame(death);
    clearLockDelay();
    dQSA('.active').forEach(el => { el.classList.remove('active'); el.classList.add('stopped') });
    clearInterval(timeouts['gravity']);
    clearLines();
    totalPieceCount++;
    heldpiece.occured = false; isTspin = false; isMini = false;
    drawPiece(randomiser());
    startGravity();
    renderDanger();
}

function clearLockDelay(clearCount = true) {
    clearInterval(timeouts['lockingTimer'])
    document.getElementById('lockTimer').value = 0;
    stopTimeout('lockdelay');
    if (clearCount) {
        document.getElementById('lockCounter').value = 0;
        lockcount = 0; endDasArr();
    }
}

function endGame(top, bottom = 'Better luck next time') {
    if (top == 'lockout' || top == 'blockout') { playSound('failure'); playSound('topout') }
    else { playSound('finish') }
    clearInterval(timeouts['gravity']);
    clearInterval(timeouts['stats']);
    gameEnd = true;
    openModal('gameEnd');
    document.getElementById('reason').textContent = top;
    document.getElementById('result').textContent = bottom;
}

function resetState() {
    gameEnd = false; currentPiece = null; currentLoc = null; isTspin = false; isMini = false;
    heldpiece = { piece: null, occured: false };
    remainingpieces = [[], []];
    totalLines = 0; totalScore = 0, garbageRemaining = 10; spikeCounter = 0; btbCount = -1;
    combonumber = -1; totalTimeSeconds = -0.02; totalAttack = 0; totalPieceCount = 0;
    firstMove = true, toppingOut = false; stoppedMinoCoords = undefined;
    clearInterval(timeouts['gravity']);
    for (let text of ['btbtext', 'cleartext', 'combotext', 'pctext', 'linessent']) {
        document.getElementById(text).style.opacity = 0;
    }
    removeElements(["#grid", "#next", "#hold", "#playingfield"]); renderDanger(); clearLockDelay();
}

function randomiser() {
    if (remainingpieces[1].length == 0) shuffleRemainingPieces();
    if (remainingpieces[0].length == 0) {
        remainingpieces = [remainingpieces[1], []];
        shuffleRemainingPieces();
    }
    const piece = remainingpieces[0].splice(0, 1);
    return pieces.filter((element) => { return element.name == piece })[0];
}

function shuffleRemainingPieces() {
    pieces.forEach((piece) => remainingpieces[1].push(piece.name))
    remainingpieces[1] = remainingpieces[1].map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort).map(({ value }) => value);
}

function drawPiece(piece) {
    if (gameEnd) return;
    const DOMboard = document.getElementById('playingfield');
    let offsetx = (piece.name == 'o') ? 5 : 4                   // o is smaller, set different pos
    let offsety = (piece.name == 'o') ? 22 : (piece.name == 'i') ? 20 : 21
    const coords = pieceToCoords(piece, 'shape1', undefined, true);
    renderPieceFromCoords(DOMboard, coords, offsety, offsetx, piece, 'active');
    renderSpawnOverlay(DOMboard);
    currentLoc = [offsetx, offsety];
    rotationState = 1;
    currentPiece = piece;
    stoppedMinoCoords = dQSACoords('.stopped');
    updateNext();
    displayShadow();
    if (gameSettings.preserveARR) startArr('current');
}

function updateNext() {
    const DOMNext = document.getElementById('next');
    removeMinos('.nextmino')
    let first5 = remainingpieces[0].concat(remainingpieces[1])
        .slice(0, (gameSettings.nextPieces > 5 ? 5 : gameSettings.nextPieces));
    for (let i = 0; i < first5.length; i++) {
        const piece = pieces.filter((element) => { return element.name == first5[i] })[0];
        renderPieceFromCoords(DOMNext, pieceToCoords(piece, 'shape1'),
            1 + (3 * i), ((piece.name == 'o') ? 2 : 1), piece, 'nextmino');
    }
    const pieceColour = pieces.filter((element) => { return element.name == first5[0] })[0].colour
    changeOutlineColour('next', pieceColour)
}

function displayShadow() { // some performance lost
    removeMinos('.shadow')
    const DOMboard = document.getElementById('playingfield');
    const coords = pieceToCoords(currentPiece, 'shape' + rotationState, undefined, true);
    const colour = displaySettings.colouredShadow ? currentPiece.colour : "#ffffff";
    renderPieceFromCoords(DOMboard, coords, currentLoc[1], currentLoc[0], currentPiece, 'shadow',
        colour, displaySettings.shadowOpacity + "%");
    let count = 0, shadowMinos = dQSACoords('.shadow');
    while (!checkCollision(shadowMinos.map(c => [c[0], c[1] - count]), "DOWN")) count++;
    renderPieceMovement("DOWN", dQSA('.shadow'), count);
}

function holdPiece() {
    if (heldpiece.occured) return;
    clearLockDelay();
    isTspin = false; isMini = false;
    removeMinos('.active');
    if (heldpiece.piece == null) { // first time holding
        heldpiece.piece = currentPiece;
        drawPiece(randomiser());
    } else {
        [heldpiece.piece, currentPiece] = [currentPiece, heldpiece.piece]
        drawPiece(currentPiece);
    }
    const coords = dQSACoords('.active');
    if (checkDeath(coords, stoppedMinoCoords) == 'blockout') { endGame('blockout'); return }
    playSound('hold'); renderDanger();
    const DOMheldpiece = document.getElementById('hold');
    DOMheldpiece.replaceChildren();
    renderPieceFromCoords(DOMheldpiece, pieceToCoords(heldpiece.piece, 'shape1'), 1,
        ((heldpiece.piece.name == 'o') ? 2 : 1), heldpiece.piece)
    changeOutlineColour('hold', heldpiece.piece.colour)
    clearInterval(timeouts['gravity']); startGravity();
    if (!gameSettings.infiniteHold) heldpiece.occured = true;
}

function startGravity() {
    if (checkCollision(dQSACoords('.active'), 'DOWN')) incrementLock();
    if (gameSettings.gravitySpeed > 1000) return;
    if (gameSettings.gravitySpeed == 0) { movePieceDown(false, true); return; }
    movePieceDown(false, false);
    timeouts['gravity'] = setInterval(() => movePieceDown(false, false), gameSettings.gravitySpeed);
}

function addGarbage(lines) {
    const DOMboard = document.getElementById('playingfield');
    for (let row = 1; row < (lines + 1); row++) {
        const randCol = Math.floor(Math.random() * 10) + 1;
        for (let col = 1; col < 11; col++) {
            if (col == randCol) continue;
            renderPieceFromCoords(DOMboard, [[col, row]], 0, 0, undefined, 'garbage', 'gray');
        }
    }
}

// screen rendering
function drawGrid() {
    const DOMboard = document.getElementById('grid');
    for (let col = 0; col < 20; col++) {
        for (let row = 0; row < 10; row++) {
            let mino = document.createElement('div');
            mino.style.gridArea = `${col + 1} / ${row + 1} /span 1/span 1`
            mino.style.outline = '0.1vh solid white'
            mino.style.opacity = `${displaySettings.gridopacity}%`;
            mino.classList.add('gridLine');
            DOMboard.appendChild(mino);
        }
    }
}

function renderPieceFromCoords(parentDiv, coords, heightadjust = 0, rowadjust = 0, piece,
    classname = null, colour = piece.colour, opacity = "100%") {
    coords.forEach((coord) => {
        let mino = document.createElement('div');
        let newrow = coord[0] + rowadjust;
        let newcol = coord[1] + heightadjust;
        mino.style.gridArea = `${newcol} / ${newrow} /span 1/span 1`;
        mino.style.backgroundColor = colour;
        mino.style.border = classname != 'shadow' ? `0.3vh solid ${colour}` : 'none';
        mino.style.opacity = opacity;
        if (classname != null) mino.classList.add(classname);
        if (classname == 'garbage') mino.classList.add('stopped');
        parentDiv.appendChild(mino);
    })
}

function renderPieceMovement(direction, minos, amount) {
    for (let mino of minos) {
        const gridarea = mino.style.gridArea.split('/');
        let x = Number(gridarea[1]), y = Number(gridarea[0]);
        mino.style.gridArea = {
            "RIGHT": `${y} / ${x + amount} / span 1 / span 1`,
            "LEFT": `${y} / ${x - amount} / span 1 / span 1`,
            "DOWN": `${y - amount} / ${x} / span 1 / span 1`,
        }[direction] // render moved minos
    }
}

function renderSpawnOverlay(DOMboard) {
    removeMinos('.nextSpawn');
    const next = pieces.filter(p => p.name == remainingpieces[0].concat(remainingpieces[1])[0])[0]
    const x = (next.name == 'o') ? 5 : 4
    const y = (next.name == 'o') ? 22 : (next.name == 'i') ? 20 : 21
    const nextCoords = pieceToCoords(next, 'shape1', undefined, true)
    renderPieceFromCoords(DOMboard, nextCoords, y, x, next, 'nextSpawn', 'red', "0");
}

function renderDanger() {
    const board = document.getElementById('board');
    const overlay = document.getElementsByClassName('dangerOverlay')[0];
    const nextspawn = document.getElementsByClassName('nextSpawn');
    if ([...dQSA('.stopped')].some(mino => minoX(mino) > 16)) {
        if (!board.classList.contains('boardDanger')) playSound('damage_alert');
        board.classList.add('boardDanger');
        overlay.style.opacity = 1;
        [...nextspawn].forEach(e => e.style.opacity = '0.1')
    } else {
        board.classList.remove('boardDanger');
        overlay.style.opacity = 0;
        [...nextspawn].forEach(e => e.style.opacity = '0')
    }
}

function renderActionText(linecount, remainingMinos) {
    const isBTB = ((isTspin || isMini || linecount == 4) && linecount > 0);
    const isPC = remainingMinos.length == 0;
    const damagetype = (isTspin ? 'Tspin ' : '') + (isMini ? 'mini ' : '') + cleartypes[linecount];
    btbCount = isBTB ? btbCount + 1 : (linecount != 0) ? - 1 : btbCount;
    combonumber = linecount == 0 ? -1 : combonumber + 1;
    const damage = calcDamage(combonumber, damagetype.toUpperCase().trim(), isPC, btbCount, isBTB);
    totalScore += calcScore(damagetype, isPC, isBTB, combonumber);
    totalLines += linecount;
    totalAttack += damage;
    spikeCounter += damage;

    if (damagetype != '') setText('cleartext', damagetype, 2000);
    if (combonumber > 0) setText('combotext', `Combo ${combonumber}`, 2000);
    if (isBTB && btbCount > 0) setText('btbtext', `BTB ${btbCount} `, 2000);
    if (isPC) setText('pctext', "Perfect Clear", 2000);
    if (damage > 0) setText('linessent', `+${spikeCounter}`, 1500);

    if (spikeCounter > 0) { spikePattern('white', 1); }
    if (spikeCounter >= 10) { spikePattern('#FF2400', 1.1) } // red
    if (spikeCounter >= 20) { spikePattern('#ADFF2F', 1.2) } // green
    if (spikeCounter >= 30) { spikePattern('#007FFF', 1.3) } // blue
    if (spikeCounter >= 35) { spikePattern('#BF00FF', 1.4) } // purple
    if (spikeCounter >= 40) { spikePattern('#FF66CC', 1.5) } // pink

    if (isPC) playSound('allclear')
    if (btbCount == 2 && isBTB) playSound('btb_1')
    if (linecount == 4 && btbCount > 0) { playSound('clearbtb') }
    else if (linecount == 4) { playSound('clearquad') }
    else if (linecount > 0 && isTspin) { playSound('clearspin') }
    else if (linecount > 0) { playSound('clearline') }
    if (spikeCounter >= 15) playSound('thunder');
}

function spikePattern(colour, size) {
    document.getElementById('linessent').style.color = colour;
    document.getElementById('linessent').style.textShadow = `0 0 1vh ${colour}`;
    document.getElementById('linessent').style.fontSize = `${3.5 * size}vh`;
}

function calcDamage(combo, type, isPC, btb, isBTB) {
    const btbdamage = () => {
        const x = Math.log1p(btb * 0.8);
        return ~~(Math.floor(x + 1) + (1 + (x % 1)) / 3);
    }
    return attackValues[type][combo > 20 ? 20 : combo < 0 ? 0 : combo]
        + (isPC ? attackValues['ALL CLEAR'] : 0)
        + (isBTB && btb > 0 ? btbdamage() : 0);
}

function calcScore(type, ispc, isbtb, combo) {
    return scoringTable[type.toUpperCase().trim()]
        + (ispc ? scoringTable['ALL CLEAR'] : 0)
        + (combo > 0 ? 50 * combo : 0)
        * (isbtb ? 1.5 : 1);
}

function setText(id, text, duration) {
    const textbox = document.getElementById(id);
    textbox.textContent = text;
    textbox.style.transform = 'translateX(-2%)'; textbox.style.opacity = 1;
    if (timeouts[id] != 0) stopTimeout(id);
    timeouts[id] = setTimeout(() => {
        textbox.style.opacity = 0; textbox.style.transform = 'translateX(2%)';
        spikeCounter = 0;
    }, duration);
}

function renderStyles() {
    document.getElementById('body').style.background = displaySettings.background[0] == '#'
        ? `${displaySettings.background} no-repeat fixed center`
        : `url("${displaySettings.background}") no-repeat fixed center`;
    document.getElementById('board').style.height = `${displaySettings.boardHeightPercent}vh`;
    SetBG(['board', 'hold', 'next'], `rgba(0, 0, 0, 0.${displaySettings.boardOpacity})`);
    changeOutlineColour('hold', '#dbeaf3')
    removeElements(['#grid'])
    if (displaySettings.showGrid) drawGrid();
}

function renderStats() {
    totalTimeSeconds += 0.02
    let displaytime = (Math.round(totalTimeSeconds * 10) / 10).toFixed(1)
    let pps = 0.00;
    let apm = 0.0;
    if (totalTimeSeconds != 0) pps = Math.round(totalPieceCount * 100 / totalTimeSeconds) / 100;
    if (totalTimeSeconds != 0) apm = Math.round(totalAttack * 10 / (totalTimeSeconds / 60)) / 10;
    document.getElementById('stats1').textContent = `${displaytime}`
    document.getElementById('stats2').textContent = `${apm.toFixed(1)}`
    document.getElementById('stats3').textContent = `${pps.toFixed(2)}`
    document.getElementById('smallStat1').textContent = `${totalAttack}`
    document.getElementById('smallStat2').textContent = `${totalPieceCount}`
    renderObjective();
}

function renderObjective() {
    const time = (Math.round(totalTimeSeconds * 100) / 100).toFixed(2), gs = gameSettings.gamemode;
    document.getElementById('objective').textContent = {
        0: '',
        1: `${totalLines}/${gameSettings.requiredLines}`,
        2: `${totalScore}`,
        3: `${totalAttack}/${gameSettings.requiredAttack}`,
        4: `${garbageRemaining}`
    }[gs]
    if (gs == 1 && totalLines >= gameSettings.requiredLines) {
        endGame(`${time}s`, `Cleared ${totalLines} lines in ${time} seconds`);
    } else if (gs == 2 && totalTimeSeconds >= Number(gameSettings.timeLimit)) {
        endGame(`${totalScore} points`, `Scored ${totalScore} points in ${time} seconds`);
    } else if (gs == 3 && totalAttack >= gameSettings.requiredAttack) {
        endGame(`${time}s`, `Sent ${totalAttack} damage in ${time} seconds`);
    } else if (gs == 4 && garbageRemaining < 1) {
        endGame(`${time}s`, `Dug 10 lines in ${time} seconds`);
    }
}

function changeOutlineColour(id, colour) {
    if (!displaySettings.colouredQueues) colour = '#dbeaf3';
    document.getElementById(id).style.outline = `0.2vh solid ${colour}`;
}

function playSound(audioName) {
    if (sfx[audioName] == undefined) {
        sfx[audioName] = new Audio(`assets/sfx/${audioName}.mp3`)
        sfx[audioName].volume = audioLevel / 1000;
    };
    sfx[audioName].currentTime = 0;
    sfx[audioName].play();
}

// misc functions
function removeMinos(id) { dQSA(id).forEach((mino) => mino.remove()); }
function stopTimeout(name) { clearTimeout(timeouts[name]); timeouts[name] = 0; }
function stopInterval(name) { clearInterval(timeouts[name]); timeouts[name] = 0; }
function toExpValue(x) { return Math.round(Math.pow(2, 0.1 * x) - 1) }
function toLogValue(y) { return Math.round(Math.log2(y + 1) * 10) }
function newGame(k, d) { if (k == controlSettings.resetKey) { closeModal(d); StartGame(); } }
function removeElements(ns) { ns.forEach(n => dQSA(n)[0].replaceChildren()) }
function SetBG(ids, c) { ids.forEach(id => document.getElementById(id).style.backgroundColor = c) }
function dQSA(e) { return document.querySelectorAll(e) }
function minoX(mino) { return Number(mino.style.gridArea.split('/')[0]); }
function minoY(mino) { return Number(mino.style.gridArea.split('/')[1]); }
function dQSACoords(e) { return [...dQSA(e)].map(m => [minoY(m), minoX(m)]) }

function pieceToCoords(piece, shape, [dx, dy] = [0, 0], reverseY = false) {
    let coords = []
    for (let col = 0; col < piece[shape].length; col++)
        for (let row = 0; row < piece[shape][col].length; row++)
            if (piece[shape][col][row] == 1)
                coords.push([row + dx, (reverseY ? (piece[shape].length - 1 - col) : col) + dy])
    return coords;
}

// interactivity in settings
function openModal(id) {
    let settingGroup = id.replace('Dialog', '');
    if (id == 'gamemodeDialog') settingGroup = 'gameSettings';
    [...document.getElementsByClassName('option')]
        .filter((item) => item.parentElement.parentElement.id == id)
        .forEach((setting) => {
            let newValue = eval(settingGroup)[setting.id];
            if (setting.classList[2] == 'exp') newValue = toLogValue(newValue);
            setting.value = newValue
            if (setting.classList[1] == 'keybind') setting.textContent = newValue;
            if (setting.classList[1] == 'check') setting.checked = (newValue);
            if (setting.classList[1] == 'range') sliderChange(setting);
        });
    [...document.getElementsByClassName('gamemodeSelect')].forEach((setting) => {
        if (setting.id == "gamemode" + gameSettings.gamemode) { setting.classList.add('selected') }
        else { setting.classList.remove('selected'); }
    })
    document.getElementById(id).showModal();
    isDialogOpen = true;
}

function closeModal(id) {
    let settingGroup = id.replace('Dialog', '');
    if (id == 'gamemodeDialog') settingGroup = 'gameSettings';
    [...document.getElementsByClassName('option')]
        .filter((item) => item.parentElement.parentElement.id == id)
        .forEach((setting) => {
            const settingid = setting.id
            eval(settingGroup)[settingid] =
                setting.classList[1] == 'check' ? setting.checked :
                    setting.classList[1] == 'keybind' ? setting.textContent :
                        setting.classList[2] == 'exp' ? toExpValue(setting.value) :
                            setting.value;
        })
    closeDialog(document.getElementById(id));
    saveSettings();
    if (id == 'displaySettingsDialog') renderStyles();
    if (id == 'gameSettingsDialog' || id == 'gamemodeDialog' || id == 'gameEnd') StartGame();
}

function closeDialog(element) {
    const closingAnimation = () => {
        element.removeEventListener('animationend', closingAnimation);
        element.classList.remove('closingAnimation');
        element.close()
    }
    isDialogOpen = false;
    element.classList.add('closingAnimation');
    element.addEventListener('animationend', closingAnimation)
}

function sliderChange(el) {
    const text = el.parentElement.children[0].textContent.split(':')[0];
    let value = el.value;
    if (el.classList[2] == 'exp') value = toExpValue(value);
    if (el.classList[2] == 'exp' && value > 1000) value = "None";
    el.parentElement.children[0].textContent = `${text}: ${value}`
}

function buttonInput(el) { document.getElementById('frontdrop').showModal(); bindingKey = el.id; }

function setKeybind(key) {
    document.getElementById(bindingKey).textContent = key;
    for (let i in controlSettings) { // duplicate keys prevention
        if (i == bindingKey) continue;
        const otherKeys = document.getElementById(i);
        if (otherKeys.textContent == key) otherKeys.textContent = 'None';
    }
    closeDialog(document.getElementById('frontdrop'));
    isDialogOpen = true;
    bindingKey = undefined;
}

function saveSettings() {
    const data = [displaySettings, gameSettings, controlSettings];
    localStorage.setItem('settings', JSON.stringify(data));
}

function loadSettings() {
    const data = localStorage.getItem('settings');
    if (data == null) return;
    const [tempDisplay, tempGame, tempControls] = JSON.parse(data);
    for (let s in tempDisplay) {
        if (tempDisplay[s] === undefined || tempDisplay[s] === "") continue;
        displaySettings[s] = tempDisplay[s]
    };
    for (let s in tempGame) {
        if (tempGame[s] === undefined || tempGame[s] === "") continue;
        gameSettings[s] = tempGame[s]
    };
    for (let s in tempControls) {
        if (tempControls[s] === undefined || tempControls[s] === "") continue;
        controlSettings[s] = tempControls[s]
    };
}

function setGamemode(modeNum) {
    gameSettings.gamemode = modeNum;
    const modesText = { 0: 'Zen', 1: 'Lines', 2: 'Score', 3: 'Damage', 4: 'Remaining' }
    document.getElementById('objectiveText').textContent = modesText[gameSettings.gamemode];
}

function resetSettings(settingGroup) {
    for (let setting in eval(settingGroup)) eval(settingGroup)[setting] = "";
    saveSettings();
    location.reload();
}

function toggleDialog() {
    if (isDialogOpen) { closeDialog(dQSA("dialog[open]")[0]) }
    else { openModal('gamemodeDialog'); StartGame() }
}

let menuSFX = (e, sfx) => dQSA(e).forEach(el => el.onmouseenter = () => playSound(sfx));
menuSFX('.settingsButton', 'menuhover'); menuSFX('.settingLayout', 'menutap');
menuSFX('.closeDialog', 'menutap'); menuSFX('.gamemodeSelect', 'menutap')

// data
const pieces = [
    {
        name: "z",
        shape1: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        shape2: [
            [0, 0, 1],
            [0, 1, 1],
            [0, 1, 0]
        ],
        shape3: [
            [0, 0, 0],
            [1, 1, 0],
            [0, 1, 1]
        ],
        shape4: [
            [0, 1, 0],
            [1, 1, 0],
            [1, 0, 0]
        ],
        colour: "#D83A28"
    },
    {
        name: "s",
        shape1: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        shape2: [
            [0, 1, 0],
            [0, 1, 1],
            [0, 0, 1]
        ],
        shape3: [
            [0, 0, 0],
            [0, 1, 1],
            [1, 1, 0]
        ],
        shape4: [
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 0]
        ],
        colour: "#7ACD44"
    },
    {
        name: "o",
        shape1: [
            [1, 1],
            [1, 1]
        ],
        colour: "#F2D74C"
    },
    {
        name: "t",
        shape1: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        shape2: [
            [0, 1, 0],
            [0, 1, 1],
            [0, 1, 0]
        ],
        shape3: [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0]
        ],
        shape4: [
            [0, 1, 0],
            [1, 1, 0],
            [0, 1, 0]
        ],
        colour: "#C132D0"
    },
    {
        name: "j",
        shape1: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        shape2: [
            [0, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],
        shape3: [
            [0, 0, 0],
            [1, 1, 1],
            [0, 0, 1]
        ],
        shape4: [
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 0]
        ],
        colour: "#3358DD"
    },
    {
        name: "l",
        shape1: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        shape2: [
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 1]
        ],
        shape3: [
            [0, 0, 0],
            [1, 1, 1],
            [1, 0, 0]
        ],
        shape4: [
            [1, 1, 0],
            [0, 1, 0],
            [0, 1, 0]
        ],
        colour: "#EDA93F"
    },
    {
        name: "i",
        shape1: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        shape2: [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        shape3: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0]
        ],
        shape4: [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ],
        colour: "#65DBC8"
    }
];

const KickData = [[ // srs+ (tetrio)
    [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],   // 4 -> 1, 1 is north, ccw is 1 -> 4, ccw is * -1
    [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],  // 1 -> 2
    [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],      // 2 -> 3 
    [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]      // 3 -> 4
], [                                            // I piece kicks
    [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],    // 4 -> 1      
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],    // 1 -> 2
    [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],    // 2 -> 3
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]     // 3 -> 4
]];

const KickData180 = [[
    [[0, 0], [0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0]], // 3 -> 1
    [[0, 0], [-1, 0], [-1, 2], [-1, 1], [0, 2], [0, 1]],   // 4 -> 2
    [[0, 0], [0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0]],    // 1 -> 3
    [[0, 0], [1, 0], [1, 2], [1, 1], [0, 2], [0, 1]]       // 2 -> 4
], [                                                   // I piece kicks
    [[0, 0], [0, -1]],                                     // 3 -> 1
    [[0, 0], [-1, 0]],                                     // 4 -> 2
    [[0, 0], [0, 1]],                                      // 1 -> 3
    [[0, 0], [1, 0]],                                      // 2 -> 4
]];

const attackValues = {
    '': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'TSPIN': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'TSPIN MINI': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'SINGLE': [0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3],
    'DOUBLE': [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6],
    'TRIPLE': [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12],
    'QUAD': [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    'TSPIN SINGLE': [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12],
    'TSPIN DOUBLE': [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    'TSPIN TRIPLE': [6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34, 36],
    'TSPIN MINI SINGLE': [0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3],
    'TSPIN MINI DOUBLE': [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6],
    'ALL CLEAR': 10,
};
const cleartypes = { '0': '', '1': 'Single', '2': 'Double', '3': 'Triple', '4': 'Quad' };
const scoringTable = { '': 0, 'TSPIN': 400, 'TSPIN MINI': 100, 'SINGLE': 100, 'DOUBLE': 300, 'TRIPLE': 500, 'QUAD': 800, 'TSPIN SINGLE': 800, 'TSPIN DOUBLE': 1200, 'TSPIN TRIPLE': 1600, 'TSPIN MINI SINGLE': 200, 'TSPIN MINI DOUBLE': 400, 'ALL CLEAR': 3500 }

StartGame();

// fps
let frameCount = 0, lastTime = performance.now(), fpsCounterElement = document.getElementById('fps-counter');

function updateFPS() {
    const now = performance.now();
    const elapsed = now - lastTime;
    if (elapsed >= 200) {
        const fps = (frameCount / elapsed) * 1000;
        fpsCounterElement.innerText = fps.toFixed(0);
        frameCount = 0;
        lastTime = now;
    }
    frameCount++;
    requestAnimationFrame(updateFPS);
}
updateFPS();