let currentPiece, currentLoc, rotationState, totalTimeSeconds, totalPieceCount, totalAttack, heldpiece, gameEnd, remainingpieces, lockcount, combonumber, BTBcount, isTspin, isMini, firstMove;
let timeouts = { 'btbtext': 0, 'tspintext': 0, 'cleartext': 0, 'combotext': 0, 'pctext': 0, 'das': 0, 'sd': 0, 'lockdelay': 0, 'gravity': 0, 'stats': 0, 'arr': 0 }
let directionState = { 'RIGHT': false, 'LEFT': false, 'DOWN': false };

const displaySettings = {
    bgcolour: 'rgb(25, 25, 25)',
    boardcolour: 'black',
    gridopacity: 10,
    shadowOpacity: 20,
    BoardHeightPercent: 70,
    showGrid: true,
    colouredShadow: true,
    colouredQueues: true
}

const gameSettings = {
    arr: 0,
    das: 75,
    sdarr: 0,
    gravitySpeed: 1000,
    lockDelay: 600,
    maxLockMovements: 15,
    nextPieces: 5,
    allowLockout: false,
    preserveARR: true,
    infiniteHold: false
}

const keybinds = {
    rightKey: 'ArrowRight',
    leftKey: 'ArrowLeft',
    cwKey: 'ArrowUp',
    ccwKey: 'z',
    hdKey: ' ',
    sdKey: 'ArrowDown',
    holdKey: 'c',
    resetKey: 'd',
    rotate180Key: 'x'
}

function StartGame() {
    resetState();
    renderStyles();
    resetStats();
    renderStats();

    drawPiece(randomiser());
}

this.addEventListener('keydown', event => {
    if (!firstMove) firstMovement();
    if (gameEnd) return;
    if (event.repeat) return;
    if (event.key == keybinds.resetKey) StartGame();
    if (event.key == keybinds.cwKey) rotate("CW");
    if (event.key == keybinds.ccwKey) rotate("CCW");
    if (event.key == keybinds.rotate180Key) rotate("180");
    if (event.key == keybinds.hdKey) movePieceDown(true, false);
    if (event.key == keybinds.holdKey) holdPiece();
    if (event.key == keybinds.rightKey) startDas("RIGHT");
    if (event.key == keybinds.leftKey) startDas("LEFT");
    if (event.key == keybinds.sdKey) startArrSD(true);
});

this.addEventListener('keyup', event => {
    if (event.key == keybinds.rightKey) endDasArr('RIGHT');
    if (event.key == keybinds.leftKey) endDasArr('LEFT');
    if (event.key == keybinds.sdKey) endDasArr('DOWN');
});

function firstMovement() {
    startGravity(); timeouts['stats'] = setInterval(() => { renderStats() }, 100); firstMove = true;
}

function startDas(direction) {
    movePieceSide(direction, false);
    directionState[direction] = 'das'
    clearTimeout(timeouts['das']); timeouts['das'] = 0;
    clearInterval(timeouts['arr']); timeouts['arr'] = 0;
    timeouts['das'] = setTimeout(() => { startArr(direction); }, gameSettings.das)
}

function startArr(direction) {
    if (direction == 'current') {
        if (directionState['RIGHT'] == 'arr' && directionState['LEFT'] == 'arr') return;
        if (directionState['RIGHT'] == 'arr') startArr('RIGHT');
        if (directionState['LEFT'] == 'arr') startArr('LEFT');
        return;
    }
    directionState[direction] = 'arr';
    clearInterval(timeouts['arr']);
    timeouts['arr'] = 0
    if (gameSettings.arr == 0) { timeouts['arr'] = -1; movePieceSide(direction, true); return; }
    timeouts['arr'] = setInterval(() => { movePieceSide(direction, false); }, gameSettings.arr);
}

function startArrSD() {
    directionState['DOWN'] = 'arr';
    clearInterval(timeouts['sd']);
    if (gameSettings.sdarr == 0) { timeouts['sd'] = -1; movePieceDown(false, true); return; }
    timeouts['sd'] = setInterval(() => { movePieceDown(false, false); }, gameSettings.sdarr);
}

function endDasArr(direction = 'all') {
    if (direction == 'all') {
        if (!gameSettings.preserveARR) {
            directionState = { 'RIGHT': false, 'LEFT': false, 'DOWN': false }
            endDasArr('RIGHT'); endDasArr('LEFT'); endDasArr('DOWN');
        };
        return;
    }
    directionState[direction] = false;
    if (direction == 'RIGHT' || direction == 'LEFT') {
        if (directionState[direction == 'RIGHT' ? 'LEFT' : 'RIGHT'] == 'das') return;
        if (directionState[direction] == 'arr') { startArr(direction); return }
        clearTimeout(timeouts['das']); timeouts['das'] = 0;
        clearInterval(timeouts['arr']); timeouts['arr'] = 0;
    }
    if (direction == 'DOWN') { clearInterval(timeouts['sd']); timeouts['sd'] = 0; }
}

// movement
function checkCollision(coords, stoppedMinos, action) {
    for (let coord of coords) {
        const [x, y] = coord;
        switch (action) {
            case "RIGHT": if (x >= 10) return true; break;
            case "LEFT": if (x <= 1) return true; break;
            case "DOWN": if (y <= 1) return true; break;
            case "ROTATE": if (x < 1 || x > 10 || y < 1) return true; break;
            case "PLACE": if (y > 20) return true; break;
        }
        for (let stopped of stoppedMinos) {
            let gridarea2 = stopped.style.gridArea.split('/');
            const x2 = Number(gridarea2[1]), y2 = Number(gridarea2[0]);
            switch (action) {
                case "RIGHT": if (x + 1 == x2 && y == y2) return true; break;
                case "LEFT": if (x - 1 == x2 && y == y2) return true; break;
                case "ROTATE": if (x == x2 && y == y2) return true; break;
                case "DOWN": if (x == x2 && y - 1 == y2) return true; break;
                case "SPAWN": if (x == x2 && y == y2) return true; break;
            }
        }
    }
}

function checkTspin(rotation, location, stoppedMinos, transformation) {
    if (currentPiece.name != 't') return false;
    const [x, y] = location;
    const [dx, dy] = transformation;
    isMini = false;
    const backminos = spinChecks[(rotation + 1) % 4].map((coord) => [coord[0] + x, coord[1] + y]);
    const frontminos = spinChecks[rotation - 1].map((coord) => [coord[0] + x, coord[1] + y]);
    const back1 = checkCollision([backminos[0]], stoppedMinos, "ROTATE")
    const back2 = checkCollision([backminos[1]], stoppedMinos, "ROTATE")
    const front1 = checkCollision([frontminos[0]], stoppedMinos, "ROTATE")
    const front2 = checkCollision([frontminos[1]], stoppedMinos, "ROTATE")
    if ((front1 && front2) && (back1 || back2)) return true;
    if ((front1 || front2) && (back1 && back2)) {
        if ((dx == 1) || (dx == -1) && dy == -2) return true;
        isMini = true; return true;
    }
}

function rotate(type) {
    if (currentPiece.name == 'o') return;
    const DOMstopped = document.querySelectorAll('.stopped');
    const newRotation = getNewRotationState(type);
    const kickdata = getKickData(currentPiece, type, newRotation);
    const rotatingCoords = pieceToCoords(currentPiece, 'shape' + newRotation, currentLoc, true);
    const posChange = kickdata.find((transformation) => {
        const [dx, dy] = transformation;
        const coords = rotatingCoords.map((coord) => [coord[0] + dx, coord[1] + dy]);
        return !checkCollision(coords, DOMstopped, 'ROTATE');
    });
    if (posChange == undefined) return;
    removeMinos('.active')
    renderPieceFromCoords(document.getElementById('playingfield'), rotatingCoords, posChange[1],
        posChange[0], currentPiece, 'active');
    currentLoc = [currentLoc[0] + posChange[0], currentLoc[1] + posChange[1]]
    isTspin = checkTspin(newRotation, currentLoc, DOMstopped, posChange);
    rotationState = newRotation;
    incrementLock();
    displayShadow();
    startArr('current');
    if (directionState['DOWN'] == 'arr') startArrSD();
}

function getNewRotationState(type) {
    let newState = (rotationState + rmap[type] || 0) % 4;
    return newState == 0 ? 4 : newState;
}

function movePieceSide(direction, instant) {
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    if (checkCollision(minoToCoords(DOMminos), DOMminostopped, direction)) {
        clearInterval(timeouts['arr']);
        timeouts['arr'] = 0
        if (directionState['DOWN'] == 'arr') startArrSD();
        return;
    };
    renderPieceMovement(direction, DOMminos);
    currentLoc[0] = direction == 'RIGHT' ? currentLoc[0] + 1 : currentLoc[0] - 1;
    displayShadow();
    incrementLock();
    isTspin = false; isMini = false;
    if (instant) { movePieceSide(direction, true); return; }

}

function movePieceDown(harddrop, softdrop) {
    const DOMminos = document.querySelectorAll('.active');
    const stopped = document.querySelectorAll('.stopped');
    if (timeouts['lockdelay'] != 0) { // if piece is locking and used harddrop
        if (harddrop) scheduleLock(true);
        return;
    };
    renderPieceMovement('DOWN', DOMminos);
    isTspin = false; isMini = false;
    currentLoc[1] -= 1;
    if (checkCollision(minoToCoords(DOMminos), stopped, 'DOWN')) { scheduleLock(harddrop); return; }
    startArr('current')
    if (harddrop) movePieceDown(true, false);
    if (softdrop) movePieceDown(false, true);
}

// mechanics
function clearLines() {
    const rows = minoToCoords(document.querySelectorAll('.stopped')).map((coord) => coord[1])
        .reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {}) // count minos in row
    const clearRows = Object.keys(rows).filter((key) => rows[key] >= 10).map((row) => Number(row))
    clearRows.reverse()
    for (let row of clearRows) {
        const DOMstopped = document.querySelectorAll('.stopped');
        [...DOMstopped].filter((mino) => Number(mino.style.gridArea.split('/')[0]) == row)
            .forEach((mino) => mino.remove()) // remove minos on row
        const moveMinos = [...DOMstopped]
            .filter((mino) => Number(mino.style.gridArea.split('/')[0]) > row);
        renderPieceMovement('DOWN', moveMinos) // move other minos down
    }
    renderActionText(clearRows.length, document.querySelectorAll('.stopped'))
}

function incrementLock() {
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    if (timeouts['lockdelay'] != 0) {
        clearTimeout(timeouts['lockdelay']); timeouts['lockdelay'] = 0; lockcount++;
    }
    if (checkCollision(minoToCoords(DOMminos), DOMminostopped, 'DOWN')) scheduleLock(false);
}

function scheduleLock(harddrop) {
    if (lockcount > gameSettings.maxLockMovements || harddrop) { lockPiece(); }
    else { timeouts['lockdelay'] = setTimeout(() => { lockPiece(); }, gameSettings.lockDelay); }
}

function lockPiece() {
    const active = document.querySelectorAll('.active');
    const coordsPlaced = minoToCoords(active);
    const stoppedMinos = document.querySelectorAll('.stopped');
    clearTimeout(timeouts['lockdelay']); timeouts['lockdelay'] = 0;
    lockcount = 0;
    endDasArr();
    if (checkCollision(coordsPlaced, stoppedMinos, 'PLACE') && gameSettings.allowLockout) {
        endGame('lockout');
        return;
    }
    active.forEach((mino) => { mino.classList.remove('active'); mino.classList.add('stopped'); });
    clearInterval(timeouts['gravity']);
    clearLines();
    totalPieceCount++;
    heldpiece.occured = false;
    isTspin = false; isMini = false;
    drawPiece(randomiser());
    startGravity();
}

function endGame(type) {
    gameEnd = true;
    clearInterval(timeouts['gravity']);
    clearInterval(timeouts['stats']);
    console.log('END', type);
}

function resetState() {
    gameEnd = false;
    currentPiece = null; currentLoc = null;
    heldpiece = { piece: null, occured: false };
    remainingpieces = [[], []];
    BTBcount = -1;
    combonumber = -1;
    endDasArr();
    clearInterval(timeouts['gravity']);
    clearTimeout(timeouts['lockdelay']); timeouts['lockdelay'] = 0;
    lockcount = 0;
    isTspin = false; isMini = false;
    removeElements(["#grid", "#next", "#hold", "#playingfield"]);
}

function randomiser() {
    if (remainingpieces[1].length == 0) {
        pieces.forEach((piece) => remainingpieces[1].push(piece.name))
        remainingpieces[1] = shuffleArray(remainingpieces[1])
    }
    if (remainingpieces[0].length == 0) {
        remainingpieces = [remainingpieces[1], []]
        pieces.forEach((piece) => remainingpieces[1].push(piece.name))
        remainingpieces[1] = shuffleArray(remainingpieces[1])
    }
    const piece = remainingpieces[0][0];
    remainingpieces[0].splice(0, 1);
    return pieces.filter((element) => { return element.name == piece })[0];
}

function shuffleArray(array) {
    let unshuffled = array;
    return unshuffled
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

function drawPiece(piece) {
    const DOMboard = document.getElementById('playingfield');
    const DOMstopped = document.querySelectorAll('.stopped');
    let offsetx = (piece.name == 'o') ? 5 : 4 // o is smaller, set different pos
    let offsety = (piece.name == 'o') ? 21 : 20
    const coords = pieceToCoords(piece, 'shape1', undefined, true);
    const coordsmapped = coords.map((coord) => [coord[0] + offsetx, coord[1] + offsety]);
    if (checkCollision(coordsmapped, DOMstopped, 'SPAWN') == true) { endGame('blockout'); return; }
    renderPieceFromCoords(DOMboard, coords, offsety, offsetx, piece, 'active');
    currentLoc = [offsetx, offsety];
    rotationState = 1;
    currentPiece = piece;
    updateNext();
    displayShadow();
    if (gameSettings.preserveARR) startArr('current');
}

function displayShadow() {
    removeMinos('.shadow')
    const DOMboard = document.getElementById('playingfield');
    const DOMminostopped = document.querySelectorAll('.stopped');
    const coords = pieceToCoords(currentPiece, 'shape' + rotationState, undefined, true);
    const colour = displaySettings.colouredShadow ? currentPiece.colour : "#1a1a1a";
    const dx = currentLoc[0], dy = currentLoc[1]
    renderPieceFromCoords(DOMboard, coords, dy, dx, currentPiece, 'shadow', colour, displaySettings.shadowOpacity + "%");
    while (true) {
        const shadowMinos = document.querySelectorAll('.shadow');
        if (checkCollision(minoToCoords(shadowMinos), DOMminostopped, "DOWN")) break;
        renderPieceMovement("DOWN", shadowMinos);
    }
}

function updateNext() {
    const DOMNext = document.getElementById('next');
    removeMinos('.nextmino')
    let first5 = remainingpieces[0]
        .concat(remainingpieces[1])
        .slice(0, (gameSettings.nextPieces > 5 ? 5 : gameSettings.nextPieces));
    for (let i = 0; i < first5.length; i++) {
        const piece = pieces.filter((element) => { return element.name == first5[i] })[0];
        renderPieceFromCoords(DOMNext, pieceToCoords(piece, 'shape1'),
            1 + (3 * i), ((piece.name == 'o') ? 2 : 1), piece, 'nextmino');
    }
    const pieceColour = pieces.filter((element) => { return element.name == first5[0] })[0].colour
    changeColour('next', pieceColour)
}

function holdPiece() {
    if (heldpiece.occured) return;
    removeMinos('.active')
    if (heldpiece.piece == null) {              // first time holding
        heldpiece.piece = currentPiece;
        clearTimeout(timeouts['lockdelay']); timeouts['lockdelay'] = 0;
        lockcount = 0;
        isTspin = false; isMini = false;
        endDasArr()
        drawPiece(randomiser());
    } else {
        [heldpiece.piece, currentPiece] = [currentPiece, heldpiece.piece]
        clearTimeout(timeouts['lockdelay']); timeouts['lockdelay'] = 0;
        lockcount = 0;
        isTspin = false; isMini = false;
        endDasArr()
        drawPiece(currentPiece);
    }
    const DOMheldpiece = document.getElementById('hold');
    DOMheldpiece.replaceChildren();
    renderPieceFromCoords(DOMheldpiece, pieceToCoords(heldpiece.piece, 'shape1'),
        1, ((heldpiece.piece.name == 'o') ? 2 : 1), heldpiece.piece)
    changeColour('hold', heldpiece.piece.colour)
    if (!gameSettings.infiniteHold) heldpiece.occured = true;
}

// screen rendering
function drawGrid() {
    const DOMboard = document.getElementById('grid');
    for (let col = 0; col < 20; col++) {
        for (let row = 0; row < 10; row++) {
            let mino = document.createElement('div');
            mino.style.gridArea = `${col + 1} / ${row + 1} /span 1/span 1`
            mino.style.border = '1px solid white'
            mino.style.opacity = `${displaySettings.gridopacity}%`;
            mino.classList.add('gridLine');
            if (col < 2) mino.classList.add('dangerZone')
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
        mino.style.gridArea = `${newcol} / ${newrow} /span 1/span 1`; // render new minos
        mino.style.backgroundColor = colour;
        mino.style.border = `2px solid ${colour}`
        mino.style.opacity = opacity;
        if (classname != null) mino.classList.add(classname)
        parentDiv.appendChild(mino);
    })
}

function renderPieceMovement(direction, minos) {
    for (let mino of minos) {
        const gridarea = mino.style.gridArea.split('/');
        let x = Number(gridarea[1]), y = Number(gridarea[0]);
        switch (direction) {
            case "RIGHT": x += 1; break;
            case "LEFT": x -= 1; break;
            case "DOWN": y -= 1; break;
        }
        mino.style.gridArea = `${y} / ${x} / span 1 / span 1`; // render moved minos
    }
}

function renderActionText(linecount, remainingMinos) {
    const isBTB = ((isTspin || isMini || linecount == 4) && linecount > 0);     // increment stats
    const isPC = remainingMinos.length == 0;
    const damagetype = (isTspin ? 'Tspin ' : '') + (isMini ? 'mini ' : '') + cleartypes[linecount];
    BTBcount = isBTB ? BTBcount + 1 : (linecount != 0) ? - 1 : BTBcount;
    combonumber = linecount == 0 ? -1 : combonumber + 1
    const damageDealt = calcDamage(combonumber, damagetype.toUpperCase().trim(), isPC, BTBcount, isBTB)
    totalAttack += damageDealt;

    if (damagetype != '') setText('cleartext', damagetype, 2000);               // render action text
    if (combonumber > 0) setText('combotext', `Combo ${combonumber}`, 2000);
    if (isBTB && BTBcount > 0) setText('btbtext', `BTB ${BTBcount} `, 2000);
    if (isPC) setText('pctext', "Perfect Clear", 2000);
    if (damageDealt > 0) setText('linessent', `+${damageDealt}`, 1000)
}

function setText(id, text, duration) {
    const textbox = document.getElementById(id)
    textbox.textContent = text;
    if (timeouts[id] != 0) { clearTimeout(timeouts[id]); timeouts[id] = 0; }
    timeouts[id] = setTimeout(() => textbox.textContent = '', duration);
}

function renderStyles() {
    document.getElementById('body').style.backgroundColor = displaySettings.bgcolour;
    document.getElementById('board').style.backgroundColor = displaySettings.boardcolour;
    document.getElementById('hold').style.backgroundColor = displaySettings.boardcolour;
    document.getElementById('next').style.backgroundColor = displaySettings.boardcolour;
    document.getElementById('board').style.height = `${displaySettings.BoardHeightPercent}vh`;
    changeColour('hold', 'white')
    if (displaySettings.showGrid) drawGrid();
}

function renderStats() {
    totalTimeSeconds += 0.1;
    let displaytime = (Math.round(totalTimeSeconds * 10) / 10).toFixed(1)
    document.getElementById('stats1').textContent = `${totalAttack} sent`
    document.getElementById('stats2').textContent = `${totalPieceCount} pieces`
    document.getElementById('stats3').textContent = `${displaytime} s`
}

function changeColour(id, colour) {
    if (displaySettings.colouredQueues) { document.getElementById(id).style.border = `2px solid ${colour}`; }
}

// misc functions
function removeMinos(id) { document.querySelectorAll(id).forEach((mino) => mino.remove()); }

function removeElements(names) {
    names.forEach((name) => { document.querySelectorAll(name)[0].replaceChildren(); })
}

function minoToCoords(minos) {
    return [...minos].map((mino) => {
        let gridarea = mino.style.gridArea.split('/');
        return [Number(gridarea[1]), Number(gridarea[0])];
    })
}

function pieceToCoords(piece, shape, change = [0, 0], reverseY = false) {
    const dx = change[0], dy = change[1]
    let coords = []
    for (let col = 0; col < piece[shape].length; col++) {
        for (let row = 0; row < piece[shape][col].length; row++) {
            if (piece[shape][col][row] == 1) {
                coords.push([row + dx, (reverseY ? (piece[shape].length - 1 - col) : col) + dy])
            }
        }
    }
    return coords;
}

function getKickData(piece, rotationType, shapeNo) {
    let indexIsI = (piece.name == 'i') ? 1 : 0; // check if i piece
    let kickdataindex = (rotationType == "CCW") ? (shapeNo > 3) ? 0 : shapeNo : shapeNo - 1;
    return {
        "180": KickData180[indexIsI][kickdataindex],
        "CW": KickDataCW[indexIsI][kickdataindex],
        "CCW": KickDataCW[indexIsI][kickdataindex].map(row => row.map(element => element * -1))
    }[rotationType]
}

function resetStats() {
    if (timeouts['stats'] != 0) { clearInterval(timeouts['stats']) }
    totalTimeSeconds = -0.1; totalAttack = 0; totalPieceCount = 0; firstMove = false;
}

function calcDamage(combonumber, type, isPC, btb, isBTB) {
    let combo = combonumber > 20 ? 20 : combonumber < 0 ? 0 : combonumber;
    let damage = attackValues[type][combo] + (isPC?attackValues['ALL_CLEAR']:0);
    if (btb > 0 && isBTB) {
        const x = Math.log1p((BTBcount) * 0.8);
        damage += ~~(Math.floor(x + 1) + (1 + (x % 1)) / 3)
    }
    return damage;
}

function startGravity() {
    if (gameSettings.gravitySpeed == 0) return;
    const DOMminostopped = document.querySelectorAll('.stopped');
    const coords = minoToCoords(document.querySelectorAll('.active'));
    if (checkCollision(coords, DOMminostopped, 'DOWN')) incrementLock();
    timeouts['gravity'] = setInterval(() => { movePieceDown(false, false) }, gameSettings.gravitySpeed);
}

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
        colour: "red"
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
        colour: "LawnGreen"
    },
    {
        name: "o",
        shape1: [
            [1, 1],
            [1, 1]
        ],
        colour: "yellow"
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
        colour: "DarkMagenta"
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
        colour: "blue"
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
        colour: "darkorange"
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
        colour: "aqua"
    }
];

const KickDataCW = [[                           // CCW data is CW data * -1
    [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],   // 4 -> 1 -> 4
    [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],  // 1 -> 2 -> 1
    [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],      // 2 -> 3 -> 2
    [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]      // 3 -> 4 -> 3
], [                                            // I piece kicks
    [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],    // 4 -> 1      
    [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],    // 1 -> 2
    [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],    // 2 -> 3
    [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]]     // 3 -> 4
]]

const KickData180 = [[
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],    // 3 -> 1
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],    // 4 -> 2
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],    // 1 -> 3
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],    // 2 -> 4
], [                                            // I piece kicks
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],    // 3 -> 1      
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],    // 4 -> 2
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],    // 1 -> 3
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],    // 2 -> 4
]];

const spinChecks = [[[0, 2], [2, 2]], [[2, 2], [2, 0]], [[0, 0], [2, 0]], [[0, 0], [0, 2]]]
const cleartypes = { '0': '', '1': 'Single', '2': 'Double', '3': 'Triple', '4': 'Quad' }
const rmap = { "CW": 1, "CCW": -1, "180": 2 };
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
    'ALL_CLEAR': 10,
}

StartGame();