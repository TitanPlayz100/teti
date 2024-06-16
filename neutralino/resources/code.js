let currentPiece, currentLoc, rotationState, totalTimeSeconds, totalPieceCount, totalAttack, holdPiece, gameEnd, nextPieces, lockCount, combonumber, btbCount, isTspin, isMini, firstMove, isDialogOpen, spikeCounter, totalLines, totalScore, garbRowsLeft, sfx = {}, bindingKey, boardState = [], nextQueueGrid = [], holdQueueGrid = [], inDanger, totalSentLines, garbageQueue, maxCombo, movedPieceFirst, boardAlpha, boardAlphaChange, minoSize, audioLevel, currentRangeOption;
let timeouts = { 'arr': 0, 'das': 0, 'sd': 0, 'lockdelay': 0, 'gravity': 0, 'stats': 0, 'lockingTimer': 0 }
let directionState = { 'RIGHT': false, 'LEFT': false, 'DOWN': false };

let displaySettings = { background: '#080B0C', boardOpacity: 100, gridopacity: 20, shadowOpacity: 20, boardHeight: 80, showGrid: true, colouredShadow: false, colouredQueues: true, lockBar: true }
let gameSettings = { arr: 33, das: 160, sdarr: 100, gravitySpeed: 950, lockDelay: 600, maxLockMovements: 15, nextPieces: 5, allowLockout: false, preserveARR: true, infiniteHold: false, gamemode: 1, requiredLines: 40, timeLimit: 120, requiredAttack: 40, requiredGarbage: 10, survivalRate: 60, backfireMulti: 1, allowQueueModify: true, lookAheadPieces: 3 }
let controlSettings = { rightKey: 'ArrowRight', leftKey: 'ArrowLeft', cwKey: 'ArrowUp', ccwKey: 'z', hdKey: ' ', sdKey: 'ArrowDown', holdKey: 'c', resetKey: 'r', rotate180Key: 'a' }

const canvasField = document.getElementById('playingfield'),
    canvasNext = document.getElementById('next'),
    canvasHold = document.getElementById('hold'),
    divBoard = document.getElementById('board'),
    divLockTimer = document.getElementById('lockTimer'),
    divLockCounter = document.getElementById('lockCounter'),
    progressDamage = document.getElementById('garbageQueue'),
    divDanger = document.getElementById('dangerOverlay'),
    divLinesSent = document.getElementById('linessent'),
    divObjectiveText = document.getElementById('objectiveText'),
    elementStats1 = document.getElementById('stats1'),
    elementStats2 = document.getElementById('stats2'),
    elementStats3 = document.getElementById('stats3'),
    elementSmallStat1 = document.getElementById('smallStat1'),
    elementSmallStat2 = document.getElementById('smallStat2'),
    elementObjective = document.getElementById('objective'),
    ctx = canvasField.getContext('2d'),
    ctxN = canvasNext.getContext('2d'),
    ctxH = canvasHold.getContext('2d');

window.onresize = function () { location.reload(); }

function init() {
    [canvasField, canvasNext, canvasHold].forEach(c => {
        c.width = Math.round(c.offsetWidth / 10) * 10;
        c.height = Math.round(c.offsetHeight / 40) * 40;
    });
    divBoard.style.width = `${canvasField.width}px`
    divBoard.style.height = `${canvasField.height / 2}px`
    minoSize = canvasField.width / 10;
    audioLevel = 10;
    let menuSFX = (e, sfx) =>
        document.querySelectorAll(e).forEach(el => el.onmouseenter = () => playSound(sfx));
    menuSFX('.settingLayout', 'menutap');
    menuSFX('.gamemodeSelect', 'menutap');
    startGame();
    renderingLoop();
}

function startGame() {
    loadSettings();
    resetState();
    renderStyles();
    spawnPiece(randomiser(), true);
}

this.addEventListener('keydown', event => {
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

this.addEventListener('keyup', event => {
    if (event.key == controlSettings.rightKey) endDasArr('RIGHT');
    if (event.key == controlSettings.leftKey) endDasArr('LEFT');
    if (event.key == controlSettings.sdKey) endDasArr('DOWN');
});

function firstMovement() {
    startGravity();
    firstMove = false;
    timeouts['stats'] = setInterval(() => renderStats(), 20);
    const time = 60 * 1000 / gameSettings.survivalRate
    if (gameSettings.gamemode == 5) timeouts['survival'] = setInterval(() => addGarbage(1), time);
}

function startDas(direction) {
    movePieceSide(direction);
    directionState[direction] = 'das'
    stopTimeout('das');
    stopInterval('arr');
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
    if (gameSettings.arr == 0) { timeouts['arr'] = -1; movePieceSide(direction, Infinity); }
    else { timeouts['arr'] = setInterval(() => movePieceSide(direction), gameSettings.arr); }
}

function startArrSD() {
    directionState['DOWN'] = 'arr';
    clearInterval(timeouts['sd']);
    if (gameSettings.sdarr == 0) { timeouts['sd'] = -1; movePieceDown(true); return; }
    timeouts['sd'] = setInterval(() => movePieceDown(false), gameSettings.sdarr);
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
        for (let [x2, y2] of collider) {
            const col = (dx, dy) => x + dx == x2 && y + dy == y2;
            if ((action == "RIGHT" && col(1, 0)) || (action == "LEFT" && col(-1, 0)) ||
                (action == "DOWN" && col(0, -1)) ||
                ((action == "ROTATE" || action == "SPAWN") && col(0, 0))) return true;
        }
    }
}

function checkTspin(rotation, [x, y], [dx, dy]) {
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
    rotationState = newRotation; movedPieceFirst = true;
    incrementLock(); playSound('rotate'); displayShadow();
    if (isTspin) playSound('spin')
    if (gameSettings.gravitySpeed == 0) startGravity();
    startArr('current');
    if (directionState['DOWN'] == 'arr') startArrSD();
}

function newRotateState(type, state) {
    const newState = (state + { "CW": 1, "CCW": -1, "180": 2 }[type]) % 4;
    return newState == 0 ? 4 : newState;
}

function getKickData(piece, rotationType, shapeNo) {
    const isI = (piece.name == 'i') ? 1 : 0;
    const direction = (rotationType == "CCW") ? (shapeNo > 3) ? 0 : shapeNo : shapeNo - 1;
    return {
        "180": KickData180[isI][direction],
        "CW": KickData[isI][direction],
        "CCW": KickData[isI][direction].map(row => row.map(x => x * -1))
    }[rotationType]
}

function movePieceSide(direction, max = 1) {
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

function movePieceDown(sonic) {
    const minos = getMinos('A');
    if (checkCollision(minos, 'DOWN')) return;
    moveMinos(minos, 'DOWN', 1);
    isTspin = false; isMini = false; currentLoc[1] -= 1; totalScore += 1; movedPieceFirst = true;
    if (checkCollision(getMinos('A'), 'DOWN')) scheduleLock();
    startArr('current');
    if (sonic) movePieceDown(true);
}

function harddrop() {
    const minos = getMinos('A');
    let amount = 0;
    while (!checkCollision(minos.map(([x, y]) => [x, y - amount]), 'DOWN')) amount++;
    if (amount > 0) { isTspin = false; isMini = false; }
    moveMinos(minos, 'DOWN', amount);
    currentLoc[1] -= amount; totalScore += 2;
    playSound('harddrop');
    lockPiece();
}

//#region Mechanics
function clearLines() {
    const rows = getMinos('S').map(coord => coord[1])
        .reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});
    const clearRows = Object.keys(rows).filter((key) => rows[key] >= 10)
        .map(row => +row).toReversed();
    let removedGarbage = 0;
    for (let row of clearRows) {
        const stopped = getMinos('S');
        if (stopped.filter(c => c[1] == row).some(c => checkMino(c, 'G'))) removedGarbage++;
        stopped.filter(c => c[1] == row).forEach(([x, y]) => boardState[y][x] = "")
        moveMinos(stopped.filter(c => c[1] > row), "DOWN", 1)
    }
    if (garbRowsLeft > 10 && gameSettings.gamemode == 4) addGarbage(removedGarbage);

    garbRowsLeft -= removedGarbage;
    const linecount = clearRows.length;
    const isBTB = ((isTspin || isMini || linecount == 4) && linecount > 0);
    const isPC = getMinos('S').length == 0;
    const damagetype = (isTspin ? 'Tspin ' : '') + (isMini ? 'mini ' : '') + cleartypes[linecount];
    btbCount = isBTB ? btbCount + 1 : (linecount != 0) ? - 1 : btbCount;
    if (linecount == 0) maxCombo = combonumber;
    combonumber = linecount == 0 ? -1 : combonumber + 1;
    const damage = calcDamage(combonumber, damagetype.toUpperCase().trim(), isPC, btbCount, isBTB);
    totalScore += calcScore(damagetype, isPC, isBTB, combonumber);
    totalLines += linecount; totalAttack += damage; spikeCounter += damage;
    const garb = damage * gameSettings.backfireMulti;
    garbageQueue = garbageQueue == 0 ? garb : garbageQueue > garb ? garbageQueue - garb : 0;
    if (gameSettings.gamemode == 6 && combonumber == -1 && garbageQueue > 0) {
        addGarbage(garbageQueue, 0);
        garbageQueue = 0;
        progressDamage.value = 0;
    }
    if (damage > 0 && gameSettings.gamemode == 6) progressDamage.value = garbageQueue;
    renderActionText(damagetype, isBTB, isPC, damage, linecount)
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

function incrementLock() {
    if (timeouts['lockdelay'] != 0) {
        clearLockDelay(false);
        lockCount++;
        if (gameSettings.maxLockMovements != 0 && displaySettings.lockBar) {
            const amountToAdd = 100 / gameSettings.maxLockMovements;
            divLockCounter.value += amountToAdd;
        }
    }
    if (checkCollision(getMinos('A'), 'DOWN')) scheduleLock();
}

function scheduleLock() {
    const LockMoves = gameSettings.maxLockMovements == 0 ? 99999 : gameSettings.maxLockMovements;
    if (lockCount >= LockMoves) { lockPiece(); return; }
    if (gameSettings.lockDelay == 0) { timeouts['lockdelay'] = -1; return; }
    timeouts['lockdelay'] = setTimeout(() => lockPiece(), gameSettings.lockDelay);
    timeouts['lockingTimer'] = setInterval(() => {
        const amountToAdd = 1000 / gameSettings.lockDelay
        if (displaySettings.lockBar) divLockTimer.value += amountToAdd;
    }, 10);
}

function lockPiece() {
    getMinos('A').forEach(c => { rmValue(c, 'A'); addValFront(c, 'S') });
    endGame(checkDeath(getMinos('S'), getMinos('NP')));
    clearLockDelay(); clearInterval(timeouts['gravity']); clearLines();
    totalPieceCount++;
    holdPiece.occured = false; isTspin = false; isMini = false; movedPieceFirst = false;
    spawnPiece(randomiser());
    startGravity();
    renderDanger();
}

function clearLockDelay(clearCount = true) {
    clearInterval(timeouts['lockingTimer']);
    stopTimeout('lockdelay');
    divLockTimer.value = 0;
    if (!clearCount) return;
    divLockCounter.value = 0;
    lockCount = 0;
    if (gameSettings.preserveARR) return;
    directionState = { 'RIGHT': false, 'LEFT': false, 'DOWN': false }
    endDasArr('RIGHT'); endDasArr('LEFT'); endDasArr('DOWN');
}

function checkDeath(coords, collider) {
    const collision = coords.every(c => checkCollision([c], 'PLACE', []));
    const collision2 = checkCollision(coords, 'SPAWN', collider)
    const isGarbage = collider.some(c => checkMino(c, 'G'))
    if (collision && gameSettings.allowLockout) return 'Lockout';
    if (collision2 && isGarbage) return 'Topout';
    if (collision2) return 'Blockout';
}

function endGame(top, bottom = 'Better luck next time') {
    const ded = ['Lockout', 'Topout', 'Blockout'].includes(top)
    if (gameSettings.gamemode == 5 && ded) { gameEnd = true; return; };

    switch (top) {
        case 'Lockout':
        case 'Topout':
        case 'Blockout': playSound('failure'); playSound('topout'); break;
        case undefined: return; break;
        default: playSound('finish'); break;
    }

    gameEnd = true;
    clearInterval(timeouts['gravity']);
    clearInterval(timeouts['stats']);
    clearInterval(timeouts['survival']);
    openModal('gameEnd');
    document.getElementById('reason').textContent = top;
    document.getElementById('result').textContent = bottom;
}

function resetState() {
    gameEnd = false; currentPiece = null; currentLoc = []; isTspin = false; isMini = false;
    holdPiece = { piece: null, occured: false }; nextPieces = [[], []];
    totalLines = 0; totalScore = 0; garbRowsLeft = gameSettings.requiredGarbage; spikeCounter = 0;
    btbCount = -1; combonumber = -1; totalTimeSeconds = -0.02; totalAttack = 0; totalPieceCount = 0;
    firstMove = true; rotationState = 1; inDanger = false; totalSentLines = 0;
    garbageQueue = 0; maxCombo = 0; movedPieceFirst = false; boardAlpha = 1; boardAlphaChange = 0;
    clearInterval(timeouts['gravity']);
    clearInterval(timeouts['survival']);
    progressDamage.value = 0;
    ['btbtext', 'cleartext', 'combotext', 'pctext', 'linessent'].forEach(id => {
        document.getElementById(id).style.opacity = 0;
    })
    boardState = [...Array(40)].map(() => [...Array(10)].map(() => ""));
    clearLockDelay(); renderDanger(); clearInterval(timeouts['stats']); renderStats();
    ctxH.clearRect(0, 0, canvasHold.offsetWidth + 10, canvasHold.offsetHeight)
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
    spawnOverlay(); updateNext(); updateHold(); displayShadow();
    const rows = gameSettings.requiredGarbage < 10 ? gameSettings.requiredGarbage : 10
    if (garbRowsLeft > 0 && start && gameSettings.gamemode == 4) addGarbage(rows);
    if (gameSettings.gamemode == 7) setComboBoard(start);
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
    const coords = getMinos('A');
    if (coords.length == 0) return;
    coords.forEach(([x, y]) => addValue([x, y], 'Sh'))
    let count = 0;
    const shadow = getMinos('Sh')
    while (!checkCollision(shadow.map(c => [c[0], c[1] - count]), "DOWN")) count++;
    moveMinos(shadow, "DOWN", count, 'Sh');
}

function startGravity() {
    if (checkCollision(getMinos('A'), 'DOWN')) incrementLock();
    if (gameSettings.gravitySpeed > 1000) return;
    if (gameSettings.gravitySpeed == 0) { movePieceDown(true); return; }
    movePieceDown(false);
    timeouts['gravity'] = setInterval(() => movePieceDown(false), gameSettings.gravitySpeed);
}

function addGarbage(lines, messiness = 100) {
    let randCol = Math.floor(Math.random() * 10);
    for (let i = 0; i < lines; i++) {
        if (checkCollision(getMinos('A'), 'DOWN')) {
            if (timeouts['lockdelay'] == 0) incrementLock();
            moveMinos(getMinos('A'), 'UP', 1);
        };
        moveMinos(getMinos('S'), 'UP', 1)
        const mustchange = Math.floor(Math.random() * 100);
        if (mustchange < messiness) randCol = Math.floor(Math.random() * 10);
        for (let col = 0; col < 10; col++) {
            if (col != randCol) addMinos('S G', [[col, 0]], [0, 0]);
        }
    }
    displayShadow();
    totalSentLines += lines;
}

function updateNext() {
    nextQueueGrid = [...Array(15)].map(() => [...Array(4)].map(() => ''))
    const first5 = nextPieces[0].concat(nextPieces[1])
        .slice(0, gameSettings.nextPieces);
    first5.forEach((name, idx) => {
        const piece = getPiece(name), pn = piece.name;
        let dx = 0, dy = 3 * (4 - idx);
        if (pn == 'o') [dx, dy] = [dx + 1, dy + 1]
        pieceToCoords(piece.shape1).forEach(([x, y]) => nextQueueGrid[y + dy][x + dx] = 'A ' + pn)
    });
    renderToCanvas(ctxN, canvasNext, nextQueueGrid, 15)
    if (gameSettings.gamemode == 8 || !displaySettings.colouredQueues) return;
    canvasNext.style.outlineColor = pieces.filter(e => e.name == first5[0])[0].colour
}

function switchHold() {
    if (holdPiece.occured) return;
    clearLockDelay(); MinoToNone('A'); isTspin = false; isMini = false;
    if (holdPiece.piece == null) {
        holdPiece.piece = currentPiece;
        spawnPiece(randomiser());
    } else {
        [holdPiece.piece, currentPiece] = [currentPiece, holdPiece.piece]
        spawnPiece(currentPiece);
    }
    if (checkDeath(getMinos('A'), getMinos('S')) == 'blockout') { endGame('blockout'); return }
    if (!gameSettings.infiniteHold) holdPiece.occured = true;
    playSound('hold'); renderDanger();
    clearInterval(timeouts['gravity']); startGravity();
    updateHold();
}

function updateHold() {
    holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ''));
    ctxH.clearRect(0, 0, canvasHold.offsetWidth + 10, canvasHold.offsetHeight)
    if (holdPiece.piece == undefined) return;
    const name = holdPiece.piece.name;
    const isO = name == 'o', isI = name == 'i';
    const [dx, dy] = [isO ? 1 : 0, isO ? 1 : isI ? -1 : 0];
    const coords = pieceToCoords(holdPiece.piece.shape1);
    coords.forEach(([x, y]) => holdQueueGrid[y + dy][x + dx] = 'A ' + name)
    const len = Math.round(minoSize / 2);
    const [shiftX, shiftY] = [isO || isI ? 0 : len, isI ? 0 : len];
    renderToCanvas(ctxH, canvasHold, holdQueueGrid, 2, [shiftX, shiftY])
    if (gameSettings.gamemode == 8 || !displaySettings.colouredQueues) return;
    canvasHold.style.outline = `0.2vh solid ${holdPiece.piece.colour}`
}

//#region GUI rendering
function renderDanger() {
    const condition = getMinos('S').some(c => c[1] > 16) && gameSettings.gamemode != 7;
    if (condition && !inDanger) playSound('damage_alert');
    inDanger = condition;
    divDanger.style.opacity = condition ? 0.1 : 0;
}

function renderActionText(damagetype, isBTB, isPC, damage, linecount) {
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

function renderStyles() {
    document.body.style.background = displaySettings.background;
    const height = Number(displaySettings.boardHeight) + 10
    divBoard.style.transform = `scale(${height}%) translate(-50%, -50%)`;
    canvasHold.style.outline = `0.2vh solid #dbeaf3`;
    const background = `rgba(0, 0, 0, ${Number(displaySettings.boardOpacity) / 100})`
    divBoard.style.backgroundColor = background;
    canvasHold.style.backgroundColor = background;
    canvasNext.style.backgroundColor = background;
}

function renderStats() {
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

function objectives() {
    const time = (Math.round(totalTimeSeconds * 100) / 100).toFixed(2), gs = gameSettings.gamemode;
    const pieces = gameSettings.lookAheadPieces;
    elementObjective.textContent = {
        0: '',
        1: `${totalLines}/${gameSettings.requiredLines}`,
        2: `${totalScore}`,
        3: `${totalAttack}/${gameSettings.requiredAttack}`,
        4: `${garbRowsLeft}`,
        5: `${totalSentLines}`,
        6: `${totalAttack}/${gameSettings.requiredAttack}`,
        7: `${combonumber}`,
        8: `${totalLines}/${gameSettings.requiredLines}`
    }[gs]

    const obj1 = totalLines >= gameSettings.requiredLines,
        obj2 = totalTimeSeconds >= Number(gameSettings.timeLimit),
        obj3 = totalAttack >= gameSettings.requiredAttack, obj4 = garbRowsLeft < 1,
        obj5 = gameEnd, obj6 = combonumber == -1 && totalLines >= 1;
    const ts = ` in ${time} seconds`, cl = `Cleared ${totalLines} lines`;
    const total = totalScore, reqGarb = gameSettings.requiredGarbage;

    switch (gs) {
        case 1: if (obj1) { endGame(`${time}s`, cl + ts); } break;
        case 2: if (obj2) { endGame(`${total} points`, `Scored ${total} points` + ts); } break;
        case 3: if (obj3) { endGame(`${time}s`, `Sent ${totalAttack} damage` + ts); } break;
        case 4: if (obj4) { endGame(`${time}s`, `Dug ${reqGarb} lines` + ts); } break;
        case 5: if (obj5) { endGame(`${time}s`, `Survived ${totalSentLines} lines` + ts); } break;
        case 6: if (obj3) { endGame(`${time}s`, `Sent ${totalAttack} damage` + ts); } break;
        case 7: if (obj6) { endGame(`${time}s`, `Got a ${maxCombo} combo` + ts); } break;
        case 8: if (obj1) { endGame(`${time}s`, cl + ` using ${pieces} lookahead`); } break;
    }
}

function playSound(audioName, replace = true) {
    if (sfx[audioName] == undefined) {
        sfx[audioName] = new Audio(`assets/sfx/${audioName}.mp3`)
        sfx[audioName].volume = audioLevel / 1000;
    };
    if (firstMove == true) return;
    if (!replace && !sfx[audioName].ended && sfx[audioName].currentTime != 0) return;
    sfx[audioName].currentTime = 0;
    sfx[audioName].play();
}

//#region Rendering
function checkMino([x, y], val) { return boardState[y][x].split(' ').includes(val) }
function MinoToNone(val) { getMinos(val).forEach(c => rmValue(c, val)) }
function addMinos(val, c, [dx, dy]) { c.forEach(([x, y]) => setValue([x + dx, y + dy], val)) }
function addValFront([x, y], val) { boardState[y][x] = `${val} ${boardState[y][x]}` }
function addValue([x, y], val) { boardState[y][x] = (boardState[y][x] + ' ' + val).trim() }
function setValue([x, y], val) { boardState[y][x] = val }
function rmValue([x, y], val) { boardState[y][x] = boardState[y][x].replace(val, '').trim() }
function getMinos(name) { return getCoords(boardState, c => c.split(' ').includes(name), [0, 0]) }
function pieceToCoords(arr, cd = [0, 0]) { return getCoords(arr.toReversed(), c => c == 1, cd) }

function getCoords(array, filter, [dx, dy]) {
    const coords = [];
    array.forEach((row, y) => row.forEach((col, x) => { if (filter(col)) coords.push([x, y]) }))
    return coords.map(([x, y]) => [x + dx, y + dy]);
}

function moveMinos(coords, dir, size, value = false) {
    const getChange = ([x, y], a) => {
        return { 'RIGHT': [x + a, y], 'LEFT': [x - a, y], 'DOWN': [x, y - a], 'UP': [x, y + a] }
    }
    const newcoords = coords.map((c) => getChange(c, size)[dir]);
    if (newcoords.some(([x, y]) => y > 39)) { endGame('Topout'); return; }
    const valTable = coords.map(([x, y]) => value ? value : boardState[y][x])
    coords.forEach((c, idx) => rmValue(c, valTable[idx]))
    newcoords.forEach((c, idx) => value ? addValue(c, valTable[idx]) : setValue(c, valTable[idx]))
    spawnOverlay()
}

function setComboBoard(start) {
    boardState.forEach((row, y) => row.forEach((col, x) => {
        if (x < 3 || x > 6) addMinos('S G', [[x, y]], [0, 0])
    }))
    if (start) { addMinos('S G', [[3, 0], [3, 1], [4, 1]], [0, 0]); displayShadow() }
}

function renderToCanvas(cntx, canvas, grid, yPosChange, [dx, dy] = [0, 0]) {
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
    cntx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
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

function renderingLoop() {
    renderToCanvas(ctx, canvasField, boardState, 39)
    if (boardAlphaChange != 0) { updateNext(); updateHold(); }
    setTimeout(() => requestAnimationFrame(renderingLoop), 1);
}

//#region Menus
function openModal(id) {
    let settingGroup = id.replace('Dialog', '');
    if (id == 'gamemodeDialog') settingGroup = 'gameSettings';
    if (id == 'queueModify' && !gameSettings.allowQueueModify) return;
    const options = [...document.getElementsByClassName('option')]
    options.filter((item) => item.parentElement.parentElement.id == id)
        .forEach((setting) => {
            let newValue = eval(settingGroup)[setting.id];
            if (setting.classList[2] == 'exp') newValue = toLogValue(newValue);
            if (setting.id == 'nextQueue')
                newValue = nextPieces[0].concat(nextPieces[1]).splice(0, 7).join(' ');
            if (setting.id == 'holdQueue') newValue = holdPiece.piece ? holdPiece.piece.name : '';
            setting.value = newValue
            if (setting.classList[1] == 'keybind') setting.textContent = newValue;
            if (setting.classList[1] == 'check') setting.checked = (newValue);
            if (setting.classList[1] == 'range') { sliderChange(setting); rangeClickListener(setting) };
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
            const settingid = setting.id, type = setting.classList[1];
            if (type == 'number' && setting.value == '') setting.value = currentRangeOption.min;
            eval(settingGroup)[settingid] =
                type == 'check' ? setting.checked :
                    type == 'keybind' ? setting.textContent :
                        setting.classList[2] == 'exp' ? toExpValue(setting.value) :
                            setting.value;
            if (settingid == 'nextQueue') {
                nextPieces[0] = setting.value.split(' ').filter((p) => pieceNames.includes(p))
                shuffleRemainingPieces();
                updateNext();
            }
            if (settingid == 'holdQueue') {
                const filtp = [setting.value].filter((p) => pieceNames.includes(p))
                holdPiece = { piece: getPiece(filtp), occured: false }; updateHold();
            }
            if (id == 'changeRangeValue') {
                currentRangeOption.value = document.getElementById('rangeValue').value;
                sliderChange(currentRangeOption);
            }
        })
    closeDialog(document.getElementById(id));
    saveSettings();
    if (id == 'displaySettingsDialog') renderStyles();
    if (id == 'gameSettingsDialog' || id == 'gamemodeDialog' || id == 'gameEnd') startGame();
    if (id == 'changeRangeValue') isDialogOpen = true;
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

function rangeClickListener(el) {
    el.parentElement.children[0].addEventListener('click', () => {
        currentRangeOption = el;
        openModal('changeRangeValue')
        document.getElementById('rangeValue').value = el.value;
    })
}

function buttonInput(el) { document.getElementById('frontdrop').showModal(); bindingKey = el.id; }

function setKeybind(key) {
    document.getElementById(bindingKey).textContent = key;
    for (let i in controlSettings) {
        if (i == bindingKey) continue;
        const otherKeys = document.getElementById(i);
        if (otherKeys.textContent == key) otherKeys.textContent = 'None';
    }
    closeDialog(document.getElementById('frontdrop'));
    isDialogOpen = true;
    bindingKey = undefined;
}

async function saveSettings() {
    const data = [displaySettings, gameSettings, controlSettings];
    localStorage.setItem('settings', JSON.stringify(data));
    await Neutralino.storage.setData('settings', JSON.stringify(data))
}

async function loadSettings() {
    // const data = localStorage.getItem('settings');
    if (!((await Neutralino.storage.getKeys()).includes('settings'))) return;
    const data = await Neutralino.storage.getData('settings');
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
    divObjectiveText.textContent = modesText[gameSettings.gamemode];
}

function setGamemode(modeNum) {
    gameSettings.gamemode = modeNum;
    divObjectiveText.textContent = modesText[gameSettings.gamemode];
}

async function downloadSettings() {
    saveSettings();
    let el = document.createElement('a');
    // const text = localStorage.getItem('settings');
    const text = await Neutralino.storage.getData('settings')
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    el.setAttribute('download', 'settings.teti');
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
}

function uploadSettings(el) {
    const reader = new FileReader();
    reader.readAsText(el.files[0]);
    reader.onload = async () => {
        localStorage.setItem('settings', reader.result); 
        await Neutralino.storage.setData('settings', reader.result);
        loadSettings()
    }
}

function resetSettings(settingGroup) {
    for (let setting in eval(settingGroup)) eval(settingGroup)[setting] = "";
    saveSettings();
    location.reload();
}

function toggleDialog() {
    if (isDialogOpen) { document.querySelectorAll("dialog[open]").forEach(e => closeDialog(e)) }
    else { openModal('settingsPanel'); }
}

function checkValue(el, el2 = currentRangeOption) {
    currentRangeOption = el2;
    if (el.value == '') return;
    if (el.value < Number(el2.min)) el.value = Number(el2.min);
    if (el.value > Number(el2.max)) el.value = Number(el2.max);
}

// misc functions
function stopTimeout(name) { clearTimeout(timeouts[name]); timeouts[name] = 0; }
function stopInterval(name) { clearInterval(timeouts[name]); timeouts[name] = 0; }
function toExpValue(x) { return Math.round(Math.pow(2, 0.1 * x) - 1) }
function toLogValue(y) { return Math.round(Math.log2(y + 1) * 10) }
function newGame(k, d) { if (k == controlSettings.resetKey) { closeModal(d); startGame(); } }
function getPiece(name) { return pieces.filter(p => p.name == name)[0] }
function toHex(num) {
    const hex = Math.round((+num * 255 / 100)).toString(16);
    return hex.length > 1 ? hex : 0 + hex;
}

//#region Data
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
const modesText = { 0: 'Zen', 1: 'Lines', 2: 'Score', 3: 'Damage', 4: 'Remaining', 5: 'Lines Survived', 6: 'Sent', 7: 'Combo', 8: 'Lines' }
const disabledKeys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'Escape'];
const spinChecks = [[[0, 2], [2, 2]], [[2, 2], [2, 0]], [[0, 0], [2, 0]], [[0, 0], [0, 2]]];
const pieceNames = ['s', 'z', 'i', 'j', 'l', 'o', 't'];

init();