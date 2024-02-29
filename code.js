let currentPiece, currentLoc, rotationState, totalTimeSeconds, totalPieceCount, totalAttack, holdPiece, gameEnd, nextPieces, lockCount, combonumber, btbCount, isTspin, isMini, firstMove, isDialogOpen, spikeCounter, totalLines, totalScore, garbRowsLeft, sfx = {}, toppingOut, bindingKey, boardState = [], nextQueueGrid = [], holdQueueGrid = [], inDanger;
let timeouts = { 'arr': 0, 'das': 0, 'sd': 0, 'lockdelay': 0, 'gravity': 0, 'stats': 0, 'lockingTimer': 0 }
let directionState = { 'RIGHT': false, 'LEFT': false, 'DOWN': false };

let displaySettings = { background: '#080B0C', boardOpacity: 100, gridopacity: 20, shadowOpacity: 20, boardHeight: 80, showGrid: true, colouredShadow: false, colouredQueues: true, lockBar: true }
let gameSettings = { arr: 33, das: 160, sdarr: 100, gravitySpeed: 950, lockDelay: 600, maxLockMovements: 15, nextPieces: 5, allowLockout: false, preserveARR: true, infiniteHold: false, gamemode: 1, requiredLines: 40, timeLimit: 120, requiredAttack: 40, requiredGarbage: 10 }
let controlSettings = { rightKey: 'ArrowRight', leftKey: 'ArrowLeft', cwKey: 'ArrowUp', ccwKey: 'z', hdKey: ' ', sdKey: 'ArrowDown', holdKey: 'c', resetKey: 'r', rotate180Key: 'a' }

const canvasField = document.getElementById('playingfield');
const canvasNext = document.getElementById('next');
const canvasHold = document.getElementById('hold');
const divBoard = document.getElementById('board');
const divLockTimer = document.getElementById('lockTimer');
const divLockCounter = document.getElementById('lockCounter');
const divDanger = document.getElementsByClassName('dangerOverlay');
const divLinesSent = document.getElementById('linessent');
const divObjectiveText = document.getElementById('objectiveText');

canvasField.width = Math.round(canvasField.offsetWidth / 10) * 10;
canvasField.height = Math.round(canvasField.offsetHeight / 40) * 40;
canvasNext.width = Math.round(canvasNext.offsetWidth / 10) * 10;
canvasNext.height = Math.round(canvasNext.offsetHeight / 40) * 40;
canvasHold.width = Math.round(canvasHold.offsetWidth / 10) * 10;
canvasHold.height = Math.round(canvasHold.offsetHeight / 40) * 40;

divBoard.style.width = `${canvasField.width}px`
divBoard.style.height = `${canvasField.height / 2}px`

const ctx = canvasField.getContext('2d');
const ctxN = canvasNext.getContext('2d');
const ctxH = canvasHold.getContext('2d');
const minoSize = canvasField.width / 10;

function StartGame() {
    loadSettings();
    setGamemode(gameSettings.gamemode)
    resetState();
    renderStyles();
    clearInterval(timeouts['stats']);
    renderStats();
    spawnPiece(randomiser(), true);
}

this.addEventListener('keydown', event => {
    const disabledKeys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'Escape']
    if (disabledKeys.includes(event.key)) event.preventDefault();
    if (event.key == 'Escape' && bindingKey == undefined) toggleDialog();
    if (event.repeat || isDialogOpen) return;
    if (firstMove && event.key != 'Escape') firstMovement();
    document.body.style.cursor = 'none';
    if (event.key == controlSettings.resetKey) { playSound('retry'); StartGame(); }
    if (event.key == controlSettings.cwKey) rotate("CW");
    if (event.key == controlSettings.ccwKey) rotate("CCW");
    if (event.key == controlSettings.rotate180Key) rotate("180");
    if (event.key == controlSettings.hdKey) movePieceDown(true, false);
    if (event.key == controlSettings.holdKey) updateHold();
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
    startGravity(); firstMove = false;
    timeouts['stats'] = setInterval(() => renderStats(), 20);
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
    directionState[direction] = false;
    if (direction == 'RIGHT' || direction == 'LEFT') {
        const oppDirection = direction == 'RIGHT' ? 'LEFT' : 'RIGHT'
        if (directionState[oppDirection] == 'das') return;
        if (directionState[oppDirection] == 'arr') { startArr(oppDirection); return }
        stopTimeout('das'); stopInterval('arr');
    }
    if (direction == 'DOWN') stopInterval('sd');
}

function checkCollision(coords, action, collider = getMinos('S')) {
    for (let [x, y] of coords) {
        if ((action == "RIGHT" && x > 8) || (action == "LEFT" && x < 1) ||
            (action == "DOWN" && y < 1) || (action == "ROTATE" && x < 0 || x > 9 || y < 0) ||
            (action == "PLACE" && y > 19)) return true;
        if (collider.some(([x2, y2]) => {
            const col = (dx, dy) => x + dx == x2 && y + dy == y2;
            return ((action == "RIGHT" && col(1, 0)) || (action == "LEFT" && col(-1, 0)) ||
                (action == "DOWN" && col(0, -1)) || ((action == "ROTATE" || action == "SPAWN") && col(0, 0)))
        })) return true;
    }
}

function checkTspin(rotation, [x, y], [dx, dy]) {
    if (currentPiece.name != 't') return false;
    isMini = false;
    const spinChecks = [[[0, 2], [2, 2]], [[2, 2], [2, 0]], [[0, 0], [2, 0]], [[0, 0], [0, 2]]];
    const minos = spinChecks[(rotation + 1) % 4].concat(spinChecks[rotation - 1])
        .map(([ddx, ddy]) => checkCollision([[ddx + x, ddy + y]], 'ROTATE'))
    if ((minos[2] && minos[3]) && (minos[0] || minos[1])) return true;
    if ((minos[2] || minos[3]) && (minos[0] && minos[1])) {
        if ((dx == 1 || dx == -1) && dy == -2) return true;
        isMini = true; return true;
    }
}

function rotate(type) {
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
    rotationState = newRotation;
    incrementLock(); playSound('rotate'); displayShadow(); topoutSound();
    if (isTspin) playSound('spin')
    if (gameSettings.gravitySpeed == 0) startGravity();
    startArr('current');
    if (directionState['DOWN'] == 'arr') startArrSD();
}

function newRotateState(type, state) {
    let newState = (state + { "CW": 1, "CCW": -1, "180": 2 }[type] || 0) % 4;
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
    if (checkCollision(getMinos('A'), direction)) {
        stopInterval('arr');
        if (gameSettings.gravitySpeed == 0) startGravity();
        return;
    };
    moveMinos(getMinos('A'), direction, 1);
    currentLoc[0] = direction == 'RIGHT' ? currentLoc[0] + 1 : currentLoc[0] - 1;
    incrementLock(); playSound('move'); displayShadow(); topoutSound();
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
    moveMinos(getMinos('A'), 'DOWN', 1);
    isTspin = false; isMini = false;
    currentLoc[1] -= 1;
    totalScore += harddrop ? 2 : 1;
    if (checkCollision(getMinos('A'), 'DOWN')) { scheduleLock(harddrop); return; }
    startArr('current')
    if (softdrop) playSound('move');
    if (harddrop) movePieceDown(true, false);
    if (softdrop) movePieceDown(false, true);
}

// mechanics
function clearLines() {
    const rows = getMinos('S').map(coord => coord[1])
        .reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});
    const clearRows = Object.keys(rows).filter((key) => rows[key] >= 10)
        .map((row) => Number(row)).toReversed();
    let removedGarbage = 0;
    for (let row of clearRows) {
        const stopped = getMinos('S');
        if (stopped.filter(c => c[1] == row).some(c => checkMino(c, 'G'))) removedGarbage++;
        stopped.filter(c => c[1] == row).forEach(c => replaceMino(c, ""))
        moveMinos(stopped.filter(c => c[1] > row), "DOWN", 1)
    }
    if (garbRowsLeft > 10) addGarbage(removedGarbage);
    garbRowsLeft -= removedGarbage;
    renderActionText(clearRows.length, getMinos('S'))
}

function incrementLock() {
    if (timeouts['lockdelay'] != 0) {
        clearLockDelay(false); lockCount++;
        if (gameSettings.maxLockMovements != 0 && displaySettings.lockBar) {
            const amountToAdd = 100 / gameSettings.maxLockMovements;
            divLockCounter.value += amountToAdd;
        }
    }
    if (checkCollision(getMinos('A'), 'DOWN')) scheduleLock(false);
}

function scheduleLock(harddrop) {
    let LockMoves = gameSettings.maxLockMovements == 0 ? 99999 : gameSettings.maxLockMovements;
    if (lockCount >= LockMoves || harddrop) { lockPiece(); playSound('harddrop'); return; }
    if (gameSettings.lockDelay == 0) { timeouts['lockdelay'] = -1; return; }
    timeouts['lockdelay'] = setTimeout(() => lockPiece(), gameSettings.lockDelay);
    timeouts['lockingTimer'] = setInterval(() => {
        const amountToAdd = 1000 / gameSettings.lockDelay
        if (displaySettings.lockBar) divLockTimer.value += amountToAdd;
    }, 10);
}

function topoutSound() {
    const check = checkDeath(getMinos('Sh'), getMinos('NP')) && !toppingOut;
    if (check) { playSound('hyperalert'); toppingOut = true; return }
    toppingOut = false;
}

function checkDeath(coords, collider) {
    const collision = coords.every(c => checkCollision([c], 'PLACE', []));
    const collision2 = checkCollision(coords, 'SPAWN', collider)
    const isGarbage = collider.some(c => checkMino(c, 'G'))
    if (collision && gameSettings.allowLockout) return 'Lockout';
    if (collision2 && isGarbage) return 'Topout';
    if (collision2) return 'Blockout';
}

function lockPiece() {
    getMinos('A').forEach(c => { removeValue(c, 'A'); addValFront(c, 'S') });
    endGame(checkDeath(getMinos('S'), getMinos('NP')));
    clearLockDelay(); clearInterval(timeouts['gravity']); clearLines();
    totalPieceCount++;
    holdPiece.occured = false; isTspin = false; isMini = false;
    spawnPiece(randomiser()); startGravity(); renderDanger();
}

function clearLockDelay(clearCount = true) {
    clearInterval(timeouts['lockingTimer']); stopTimeout('lockdelay');
    divLockTimer.value = 0;
    if (!clearCount) return;
    divLockCounter.value = 0;
    lockCount = 0;
    if (gameSettings.preserveARR) return;
    directionState = { 'RIGHT': false, 'LEFT': false, 'DOWN': false }
    endDasArr('RIGHT'); endDasArr('LEFT'); endDasArr('DOWN');
}

function endGame(top, bottom = 'Better luck next time') {
    switch (top) {
        case undefined: return; break;
        case 'Lockout':
        case 'Topout':
        case 'Blockout': playSound('failure'); playSound('topout'); break;
        default: playSound('finish'); break;
    }
    clearInterval(timeouts['gravity']);
    clearInterval(timeouts['stats']);
    gameEnd = true;
    openModal('gameEnd');
    document.getElementById('reason').textContent = top;
    document.getElementById('result').textContent = bottom;
}

function resetState() {
    gameEnd = false; currentPiece = null; currentLoc = []; isTspin = false; isMini = false;
    holdPiece = { piece: null, occured: false };
    nextPieces = [[], []];
    totalLines = 0; totalScore = 0, garbRowsLeft = gameSettings.requiredGarbage; spikeCounter = 0;
    btbCount = -1; combonumber = -1; totalTimeSeconds = -0.02; totalAttack = 0; totalPieceCount = 0;
    firstMove = true; toppingOut = false; rotationState = 1; inDanger = false;
    clearInterval(timeouts['gravity']);
    ['btbtext', 'cleartext', 'combotext', 'pctext', 'linessent'].forEach(id => {
        document.getElementById(id).style.opacity = 0;
    })
    clearLockDelay(); resetBoard(); renderDanger(); resetHoldGrid();
}

function randomiser() {
    if (nextPieces[1].length == 0) shuffleRemainingPieces();
    if (nextPieces[0].length == 0) {
        nextPieces = [nextPieces[1], []];
        shuffleRemainingPieces();
    }
    const piece = nextPieces[0].splice(0, 1);
    return pieces.filter((element) => { return element.name == piece })[0];
}

function shuffleRemainingPieces() {
    pieces.forEach((piece) => nextPieces[1].push(piece.name))
    nextPieces[1] = nextPieces[1].map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort).map(({ value }) => value);
}

function spawnPiece(piece, start = false) {
    if (gameEnd) return;
    const dx = (piece.name == 'o') ? 4 : 3
    const dy = (piece.name == 'o') ? 21 : (piece.name == 'i') ? 19 : 20
    addMinos('A ' + piece.name, pieceToCoords(piece.shape1), [dx, dy])
    currentLoc = [dx, dy]; rotationState = 1; currentPiece = piece;
    spawnOverlay(); updateNext(); displayShadow(); topoutSound();
    const rows = gameSettings.requiredGarbage < 10 ? gameSettings.requiredGarbage : 10
    if (garbRowsLeft > 0 && start && gameSettings.gamemode == 4) addGarbage(rows);
    if (gameSettings.preserveARR) startArr('current');
}

function spawnOverlay() {
    MinoToNone('NP')
    const next = pieces.filter(p => p.name == nextPieces[0].concat(nextPieces[1])[0])[0]
    const x = (next.name == 'o') ? 4 : 3
    const y = (next.name == 'o') ? 21 : (next.name == 'i') ? 19 : 20
    pieceToCoords(next.shape1, [x, y]).forEach((c) => addValue(c, 'NP'))
}

function displayShadow() {
    MinoToNone('Sh')
    const coords = pieceToCoords(currentPiece['shape' + rotationState]);
    const [dx, dy] = currentLoc
    coords.forEach(([x, y]) => addValue([x + dx, y + dy], 'Sh'))
    let count = 0;
    while (!checkCollision(getMinos('Sh').map(c => [c[0], c[1] - count]), "DOWN")) count++;
    moveMinos(getMinos('Sh'), "DOWN", count, 'Sh');
}

function startGravity() {
    if (checkCollision(getMinos('A'), 'DOWN')) incrementLock();
    if (gameSettings.gravitySpeed > 1000) return;
    if (gameSettings.gravitySpeed == 0) { movePieceDown(false, true); return; }
    movePieceDown(false, false);
    timeouts['gravity'] = setInterval(() => movePieceDown(false, false), gameSettings.gravitySpeed);
}

function addGarbage(lines) {
    for (let i = 0; i < lines; i++) {
        if (checkCollision(getMinos('A'), 'DOWN')) moveMinos(getMinos('A'), 'UP', 1);
        moveMinos(getMinos('S'), 'UP', 1)
        const randCol = Math.floor(Math.random() * 10);
        for (let col = 0; col < 10; col++) {
            if (col != randCol) addMinos('S G', [[col, 0]], [0, 0]);
        }
    }
    displayShadow();
}

function updateNext() {
    nextQueueGrid = [...Array(15)].map(() => [...Array(4)].map(() => ''))
    const first5 = nextPieces[0].concat(nextPieces[1])
        .slice(0, gameSettings.nextPieces);
    first5.forEach((name, idx) => {
        const piece = pieces.filter(e => e.name == name)[0], nm = piece.name;
        let dx = 0, dy = 3 * (4 - idx);
        if (nm == 'o') [dx, dy] = [dx + 1, dy + 1]
        pieceToCoords(piece.shape1).forEach(([x, y]) => nextQueueGrid[y + dy][x + dx] = 'A ' + nm)
    });
    const colour = displaySettings.colouredQueues
        ? pieces.filter(e => e.name == first5[0])[0].colour
        : '#dbeaf3';
    canvasNext.style.outline = `0.2vh solid ${colour}`
    renderToCanvas(ctxN, canvasNext, nextQueueGrid, 15)
}

function resetHoldGrid() {
    holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ''));
    ctxH.clearRect(0, 0, canvasHold.offsetWidth + 10, canvasHold.offsetHeight)
}
function updateHold() {
    if (holdPiece.occured) return;
    clearLockDelay(); MinoToNone('A'); isTspin = false; isMini = false;
    if (holdPiece.piece == null) { // first time holding
        holdPiece.piece = currentPiece;
        spawnPiece(randomiser());
    } else {
        [holdPiece.piece, currentPiece] = [currentPiece, holdPiece.piece]
        spawnPiece(currentPiece);
    }
    const name = holdPiece.piece.name; isO = name == 'o', isI = name == 'i';
    const dx = isO ? 1 : 0, dy = isO ? 1 : isI ? -1 : 0;
    resetHoldGrid()
    const coords = pieceToCoords(holdPiece.piece.shape1);
    coords.forEach(([x, y]) => holdQueueGrid[y + dy][x + dx] = 'A ' + name)
    if (checkDeath(getMinos('A'), getMinos('S')) == 'blockout') { endGame('blockout'); return }
    playSound('hold'); renderDanger(); clearInterval(timeouts['gravity']); startGravity();
    if (!gameSettings.infiniteHold) holdPiece.occured = true;
    const len = Math.round(minoSize / 2), shiftX = isO || isI ? 0 : len, shiftY = isI ? 0 : len;
    renderToCanvas(ctxH, canvasHold, holdQueueGrid, 2, [shiftX, shiftY])
    const colour = displaySettings.colouredQueues ? holdPiece.piece.colour : '#dbeaf3';
    canvasHold.style.outline = `0.2vh solid ${colour}`
}

// GUI rendering
function renderDanger() {
    const condition = getMinos('S').some(c => c[1] > 16);
    inDanger = condition ? true : false;
    divDanger[0].style.opacity = condition ? 0.1 : 0;
    if (condition && !inDanger) playSound('damage_alert');
}

function renderActionText(linecount, remainingMinos) {
    const isBTB = ((isTspin || isMini || linecount == 4) && linecount > 0);
    const isPC = remainingMinos.length == 0;
    const damagetype = (isTspin ? 'Tspin ' : '') + (isMini ? 'mini ' : '') + cleartypes[linecount];
    btbCount = isBTB ? btbCount + 1 : (linecount != 0) ? - 1 : btbCount;
    combonumber = linecount == 0 ? -1 : combonumber + 1;
    const damage = calcDamage(combonumber, damagetype.toUpperCase().trim(), isPC, btbCount, isBTB);
    totalScore += calcScore(damagetype, isPC, isBTB, combonumber);
    totalLines += linecount; totalAttack += damage; spikeCounter += damage;

    if (damagetype != '') setText('cleartext', damagetype, 2000);
    if (combonumber > 0) setText('combotext', `Combo ${combonumber}`, 2000);
    if (isBTB && btbCount > 0) setText('btbtext', `BTB ${btbCount} `, 2000);
    if (isPC) setText('pctext', "Perfect Clear", 2000);
    if (damage > 0) setText('linessent', `${spikeCounter}`, 1500);

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
    divLinesSent.style.color = colour;
    divLinesSent.style.textShadow = `0 0 1vh ${colour}`;
    divLinesSent.style.fontSize = `${3.5 * size}vh`;
}

function setText(id, text, duration) {
    const textbox = document.getElementById(id);
    textbox.textContent = text;
    textbox.style.transform = 'translateX(-2%)'; textbox.style.opacity = 1;
    if (timeouts[id] != 0) stopTimeout(id);
    timeouts[id] = setTimeout(() => {
        textbox.style.opacity = 0; textbox.style.transform = 'translateX(2%)'; spikeCounter = 0;
    }, duration);
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

function renderStyles() {
    document.body.style.background = displaySettings.background[0] == '#'
        ? `${displaySettings.background} no-repeat fixed center`
        : `url("${displaySettings.background}") no-repeat fixed center`;
    divBoard.style.transform = `scale(${Number(displaySettings.boardHeight) + 10}%) translate(-50%, -50%)`;
    canvasHold.style.outline = `0.2vh solid #dbeaf3`;
    const background = `rgba(0, 0, 0, ${Number(displaySettings.boardOpacity) / 100})`
    divBoard.style.backgroundColor = background;
    canvasHold.style.backgroundColor = background;
    canvasNext.style.backgroundColor = background;
}

function renderStats() {
    totalTimeSeconds += 0.02
    let displaytime = (Math.round(totalTimeSeconds * 10) / 10).toFixed(1)
    let pps = 0.00, apm = 0.0;
    if (totalTimeSeconds != 0) pps = Math.round(totalPieceCount * 100 / totalTimeSeconds) / 100;
    if (totalTimeSeconds != 0) apm = Math.round(totalAttack * 10 / (totalTimeSeconds / 60)) / 10;
    document.getElementById('stats1').textContent = `${displaytime}`
    document.getElementById('stats2').textContent = `${apm.toFixed(1)}`
    document.getElementById('stats3').textContent = `${pps.toFixed(2)}`
    document.getElementById('smallStat1').textContent = `${totalAttack}`
    document.getElementById('smallStat2').textContent = `${totalPieceCount}`
    objectives();
}

function objectives() {
    const time = (Math.round(totalTimeSeconds * 100) / 100).toFixed(2), gs = gameSettings.gamemode;
    document.getElementById('objective').textContent = {
        0: '',
        1: `${totalLines}/${gameSettings.requiredLines}`,
        2: `${totalScore}`,
        3: `${totalAttack}/${gameSettings.requiredAttack}`,
        4: `${garbRowsLeft}`
    }[gs]
    if (gs == 1 && totalLines >= gameSettings.requiredLines) {
        endGame(`${time}s`, `Cleared ${totalLines} lines in ${time} seconds`);
    } else if (gs == 2 && totalTimeSeconds >= Number(gameSettings.timeLimit)) {
        endGame(`${totalScore} points`, `Scored ${totalScore} points in ${time} seconds`);
    } else if (gs == 3 && totalAttack >= gameSettings.requiredAttack) {
        endGame(`${time}s`, `Sent ${totalAttack} damage in ${time} seconds`);
    } else if (gs == 4 && garbRowsLeft < 1) {
        endGame(`${time}s`, `Dug ${gameSettings.requiredGarbage} lines in ${time} seconds`);
    }
}

const audioLevel = 10;
function playSound(audioName) {
    if (sfx[audioName] == undefined) {
        sfx[audioName] = new Audio(`assets/sfx/${audioName}.mp3`)
        sfx[audioName].volume = audioLevel / 1000;
    };
    if (firstMove == true) return;
    sfx[audioName].currentTime = 0;
    sfx[audioName].play();
}

// Board manipulations and rendering
function checkMino([x, y], val) { return boardState[y][x].split(' ').includes(val) }
function replaceMino([x, y], val) { boardState[y][x] = val }
function MinoToNone(val) { getMinos(val).forEach(c => removeValue(c, val)) }
function resetBoard() { boardState = [...Array(40)].map(() => [...Array(10)].map(() => "")); }
function addMinos(val, c, [dx, dy]) { c.forEach(([x, y]) => setValue([x + dx, y + dy], val)) }
function addValFront([x, y], val) { boardState[y][x] = `${val} ${boardState[y][x]}` }
function addValue([x, y], val) { boardState[y][x] = (boardState[y][x] + ' ' + val).trim() }
function setValue([x, y], val) { boardState[y][x] = val }
function removeValue([x, y], val) { boardState[y][x] = boardState[y][x].replace(val, '').trim().replace('  ', ' ') }
function getMinos(name) { return getCoords(boardState, c => c.split(' ').includes(name), [0, 0]) }
function pieceToCoords(arr, cd = [0, 0]) { return getCoords(arr.toReversed(), c => c == 1, cd) }

function getCoords(array, filter, [dx, dy]) {
    let coords = [];
    array.forEach((row, y) => row.forEach((col, x) => { if (filter(col)) coords.push([x, y]) }))
    return coords.map(([x, y]) => [x + dx, y + dy]);
}

function moveMinos(coords, dir, size, value = false) {
    const getChange = ([x, y]) => {
        return { 'RIGHT': [x + size, y], 'LEFT': [x - size, y], 'DOWN': [x, y - size], 'UP': [x, y + size] }
    }
    const newcoords = coords.map((c) => getChange(c)[dir]);
    const valTable = coords.map(([x, y]) => value ? value : boardState[y][x])
    coords.forEach((c, idx) => removeValue(c, valTable[idx]))
    newcoords.forEach((c, idx) => value ? addValue(c, valTable[idx]) : setValue(c, valTable[idx]))
    spawnOverlay()
}

function renderingLoop() {
    renderToCanvas(ctx, canvasField, boardState, 39)
    requestAnimationFrame(renderingLoop)
}

function renderToCanvas(cntx, canvas, grid, yPosChange, [dx, dy] = [0, 0]) {
    cntx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
    grid.forEach((row, y) => {
        row.forEach((col, x) => {
            const [posX, posY] = [x * minoSize, (yPosChange - y) * minoSize]
            const cell = col.split(' ')
            cntx.lineWidth = 1;
            if (cell.includes('A') || cell.includes('S')) {
                cntx.fillStyle = cell.includes('G')
                    ? 'gray'
                    : pieces.filter(p => p.name == cell[1])[0].colour;
                cntx.fillRect(posX + dx, posY + dy, minoSize, minoSize)
            } else if (cell.includes('NP') && inDanger) {
                cntx.fillStyle = '#ff000020';
                cntx.fillRect(posX, posY, minoSize, minoSize)
            } else if (cell.includes('Sh')) {
                const colour = displaySettings.colouredShadow ? currentPiece.colour : '#ffffff'
                cntx.fillStyle = colour + toHex(displaySettings.shadowOpacity);
                cntx.fillRect(posX, posY, minoSize, minoSize)
            } else if (y < 20 && displaySettings.showGrid && cntx == ctx) {
                cntx.strokeStyle = '#ffffff' + toHex(displaySettings.gridopacity);
                cntx.beginPath()
                cntx.roundRect(posX, posY, minoSize - 1, minoSize - 1, minoSize / 4);
                cntx.stroke()
            }
        })
    })
}

// interactivity in settings
function openModal(id) {
    let settingGroup = id.replace('Dialog', '');
    if (id == 'gamemodeDialog') settingGroup = 'gameSettings';
    const options = [...document.getElementsByClassName('option')]
    options.filter((item) => item.parentElement.parentElement.id == id)
        .forEach((setting) => {
            let newValue = eval(settingGroup)[setting.id];
            if (setting.classList[2] == 'exp') newValue = toLogValue(newValue);
            setting.value = newValue
            if (setting.classList[1] == 'keybind') setting.textContent = newValue;
            if (setting.classList[1] == 'check') setting.checked = (newValue);
            if (setting.classList[1] == 'range') sliderChange(setting);
        });
    const gamemodeSelect = [...document.getElementsByClassName('gamemodeSelect')]
    gamemodeSelect.forEach((setting) => {
        setting.classList.remove('selected');
        if (setting.id == "gamemode" + gameSettings.gamemode) setting.classList.add('selected');
    })
    document.getElementById(id).showModal();
    const settingPanel = document.getElementById('settingsPanel');
    if (id != 'settingsPanel' && settingPanel.open) closeDialog(settingPanel);
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

function downloadSettings() {
    saveSettings();
    let el = document.createElement('a');
    const text = localStorage.getItem('settings');
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    el.setAttribute('download', 'settings.teti');
    document.body.appendChild(el); el.click(); document.body.removeChild(el);
}

function uploadSettings(el) {
    const reader = new FileReader();
    reader.readAsText(el.files[0]);
    reader.onload = () => { localStorage.setItem('settings', reader.result); loadSettings() }
}

function setGamemode(modeNum) {
    gameSettings.gamemode = modeNum;
    const modesText = { 0: 'Zen', 1: 'Lines', 2: 'Score', 3: 'Damage', 4: 'Remaining' }
    divObjectiveText.textContent = modesText[gameSettings.gamemode];
}

function resetSettings(settingGroup) {
    for (let setting in eval(settingGroup)) eval(settingGroup)[setting] = "";
    saveSettings();
    location.reload();
}

function toggleDialog() {
    if (isDialogOpen) { closeDialog(document.querySelectorAll("dialog[open]")[0]) }
    else { openModal('settingsPanel'); StartGame() }
}

let menuSFX = (e, sfx) => document.querySelectorAll(e)
    .forEach(el => el.onmouseenter = () => playSound(sfx));
menuSFX('.settingsButton', 'menuhover'); menuSFX('.settingLayout', 'menutap');
menuSFX('.closeDialog', 'menutap'); menuSFX('.gamemodeSelect', 'menutap')

// misc functions
function stopTimeout(name) { clearTimeout(timeouts[name]); timeouts[name] = 0; }
function stopInterval(name) { clearInterval(timeouts[name]); timeouts[name] = 0; }
function toExpValue(x) { return Math.round(Math.pow(2, 0.1 * x) - 1) }
function toLogValue(y) { return Math.round(Math.log2(y + 1) * 10) }
function newGame(k, d) { if (k == controlSettings.resetKey) { closeModal(d); StartGame(); } }
function toHex(num) {
    const hex = Math.round(((Number(num) / 100) * 255)).toString(16);
    return hex.length > 1 ? hex : 0 + hex;
}

// data
const pieces = [{
    name: "z",
    shape1: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    shape2: [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
    shape3: [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
    shape4: [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
    colour: "#D83A28"
}, {
    name: "s",
    shape1: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    shape2: [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
    shape3: [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
    shape4: [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
    colour: "#7ACD44"
}, {
    name: "o",
    shape1: [[1, 1], [1, 1]],
    colour: "#F2D74C"
}, {
    name: "t",
    shape1: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    shape2: [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    shape3: [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    shape4: [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
    colour: "#C132D0"
}, {
    name: "j",
    shape1: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    shape2: [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    shape3: [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    shape4: [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
    colour: "#3358DD"
}, {
    name: "l",
    shape1: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    shape2: [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    shape3: [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    shape4: [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
    colour: "#EDA93F"
}, {
    name: "i",
    shape1: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    shape2: [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    shape3: [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    shape4: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    colour: "#65DBC8"
}];

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
renderingLoop()