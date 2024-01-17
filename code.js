// GLOBALS
let timeouts = { 'btbtext': 0, 'tspintext': 0, 'cleartext': 0, 'combotext': 0, 'pctext': 0, 'das': 0, 'arr': 0, 'sd': 0, 'lockdelay': 0, 'gravity': 0, 'stats': 0 }
let currentPiece, currentLoc, rotationState, totalTimeSeconds, totalPieceCount, totalAttack;
let heldpiece = { piece: null, occured: false };
let gameEnd = false;
let remainingpieces = [[], []]
let lockcount = 0;
let combonumber = -1;
let BTBcount = -1;
let tspin = false;
let minispin = false;
let firstMovement = false;

// display
const bgcolour = 'rgb(25, 25, 25)';
const boardcolour = 'black'
const gridopacity = 10;
const shadowOpacity = 20;
const BoardHeightPercent = 70;
const grid = true;
const colouredShadow = true;
const colouredQueues = true;

// settings
const arr = 0;
const das = 75;
const sdarr = 0;
const gravitySpeed = 1000;
const lockDelay = 1000;
const maxLockMovements = 15;
const nextPieces = 5;

// keys
const rightKey = 'ArrowRight';
const leftKey = 'ArrowLeft';
const cwKey = 'ArrowUp';
const ccwKey = 'z';
const hdKey = ' ';
const sdKey = 'ArrowDown';
const holdKey = 'c';
const resetKey = 'd'
const rotate180Key = 'x'

function StartGame() {
    renderStyles();
    resetStats();
    renderStats();
    drawPiece(randomiser()); // render first piece
    if (gravitySpeed != 0) { // loop for dropping piece through gravity
        timeouts['gravity'] = setInterval(() => { movePieceDown(false, false) }, gravitySpeed);
    };
}

this.addEventListener('keydown', event => { // Keyboard listeners
    if (!firstMovement) {
        timeouts['stats'] = setInterval(() => { renderStats() }, 100);
        firstMovement = true;
    }
    if (event.repeat) return;
    if (gameEnd) return;
    if (event.key == resetKey) resetGame();
    if (event.key == cwKey) rotate("CW");
    if (event.key == ccwKey) rotate("CCW");
    if (event.key == rotate180Key) rotate("180");
    if (event.key == hdKey) movePieceDown(true, false);
    if (event.key == holdKey) holdPiece();
    if (event.key == rightKey) { startDas("RIGHT") }
    if (event.key == leftKey) { startDas("LEFT") }
    if (event.key == sdKey) {
        if (sdarr == 0) { movePieceDown(false, true) }
        else { timeouts['sd'] = setInterval(() => { movePieceDown(false, false); }, sdarr); }
    }
});

this.addEventListener('keyup', event => {
    if (event.key == rightKey || event.key == leftKey || event.key == sdKey) endDasArr();
});

function startDas(direction) { // apply custom das and arr
    movePieceSide(direction, false)
    endDasArr()
    timeouts['das'] = setTimeout(() => {
        if (arr == 0) { movePieceSide(direction, true) }
        else { timeouts['arr'] = setInterval(() => { movePieceSide(direction, false); }, arr); }
    }, das);
}

function endDasArr() {
    clearTimeout(timeouts['das']);
    clearInterval(timeouts['arr']);
    clearInterval(timeouts['sd'])
    timeouts['das'] = 0;
    timeouts['arr'] = 0;
    timeouts['sd'] = 0;
}

function checkCollision(coords, stoppedMinos, action) {
    for (let coord of coords) {
        const x = coord[0], y = coord[1];
        switch (action) {
            case "RIGHT": if (x == 10) return true; break;
            case "LEFT": if (x == 1) return true; break;
            case "DOWN": if (y > 19) return true; break;
            case "ROTATE": if (x < 1 || x > 10 || y > 20) return true; break;
        }
        for (let stopped of stoppedMinos) {
            let gridarea2 = stopped.style.gridArea.split('/');
            const x2 = Number(gridarea2[1]), y2 = Number(gridarea2[0]);
            switch (action) {
                case "RIGHT": if (x + 1 == x2 && y == y2) return true; break;
                case "LEFT": if (x - 1 == x2 && y == y2) return true; break;
                case "ROTATE": if (y == y2 && x == x2) return true; break;
                case "DOWN": if (x == x2 && y + 1 == y2) {
                    if (y == 2) endGame();
                    return true;
                } break;
            }
        }
    }
    return false
}

function checkTspin(rotation, location, stoppedMinos, transformation) {
    if (currentPiece.name != 't') return false;
    const x = location[0], y = location[1];
    const backminos = spinMinoChecks[(rotation + 1) % 4].map((coord) => [coord[0] + x, coord[1] + y]);
    const frontminos = spinMinoChecks[rotation - 1].map((coord) => [coord[0] + x, coord[1] + y]);
    const back1 = checkCollision([backminos[0]], stoppedMinos, "ROTATE")
    const back2 = checkCollision([backminos[1]], stoppedMinos, "ROTATE")
    const front1 = checkCollision([frontminos[0]], stoppedMinos, "ROTATE")
    const front2 = checkCollision([frontminos[1]], stoppedMinos, "ROTATE")
    if ((front1 && front2) && (back1 || back2)) { return true; }
    else if ((front1 || front2) && (back1 && back2)) {
        if (transformation[0] == 1 && transformation[1] == -2) return true;
        if (transformation[0] == -1 && transformation[1] == -2) return true;
        minispin = true; return true;
    }
    return false;
}

// movement logic
function rotate(type) {
    if (currentPiece.name == 'o') { return; }
    const DOMstopped = document.querySelectorAll('.stopped');
    const newRotation = getNewRotationState(type);
    const kickdata = getKickData(currentPiece, type, newRotation);
    const rotatingCoords = pieceToCoords(currentPiece, 'shape' + newRotation, currentLoc);
    const newTransformation = kickdata.find((transformation) => {
        const dx = transformation[0], dy = transformation[1]
        const coords = rotatingCoords.map((coord) => [coord[0] + dx, coord[1] - dy]);
        if (!checkCollision(coords, DOMstopped, 'ROTATE')) return true;
    });
    if (newTransformation == undefined) return;
    removeMinos('.active')
    renderPieceFromCoords(document.getElementById('playingfield'),
        rotatingCoords, -1 * newTransformation[1], newTransformation[0], currentPiece, 'active');
    currentLoc = [currentLoc[0] + newTransformation[0], currentLoc[1] - newTransformation[1]]
    if (checkTspin(newRotation, currentLoc, DOMstopped, newTransformation)) tspin = true;
    rotationState = newRotation;
    incrementLock();
    displayShadow();
}

function getNewRotationState(type) {
    const rotationMapping = { "CW": 1, "CCW": -1, "180": 2 };
    let newState = (rotationState + rotationMapping[type] || 0) % 4;
    return newState == 0 ? 4 : newState;
}

function movePieceSide(direction, instant) {
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    if (checkCollision(minoToCoords(DOMminos), DOMminostopped, direction)) return;
    renderPieceMovement(direction, DOMminos);
    currentLoc[0] = direction == 'RIGHT' ? currentLoc[0] + 1 : currentLoc[0] - 1;
    displayShadow();
    incrementLock();
    tspin = false;
    minispin = false;
    if (instant) movePieceSide(direction, true);
}

function movePieceDown(harddrop, softdrop) {
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    if (timeouts['lockdelay'] != 0) { // if piece is locking and used harddrop
        if (harddrop) lockPiece(DOMminos);
        return;
    };
    renderPieceMovement('DOWN', DOMminos);
    tspin = false;
    minispin = false;
    currentLoc[1] += 1;
    if (checkCollision(minoToCoords(DOMminos), DOMminostopped, 'DOWN')) {
        if (harddrop || lockcount > maxLockMovements) { lockPiece(DOMminos); } // harddrop instant
        else { timeouts['lockdelay'] = setTimeout(() => { lockPiece(DOMminos); }, lockDelay); }
        return;
    }
    if (harddrop) movePieceDown(true, false);
    if (softdrop) movePieceDown(false, true);
}

// mechanics
function lockPiece(DOMminos = []) {
    DOMminos.forEach((mino) => { mino.classList.remove('active'); mino.classList.add('stopped'); });
    clearLines();
    resetVariables();
    totalPieceCount++;
    heldpiece.occured = false;
    endDasArr();
    drawPiece(randomiser());
}

function incrementLock() { // reset lockdelay, increment lock count
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    clearTimeout(timeouts['lockdelay']);
    timeouts['lockdelay'] = 0;
    lockcount++;
    if (checkCollision(minoToCoords(DOMminos), DOMminostopped, 'DOWN')) {
        if (lockcount > maxLockMovements) { lockPiece(DOMminos); }
        else { timeouts['lockdelay'] = setTimeout(() => { lockPiece(DOMminos); }, lockDelay); }
    }
}

function resetVariables() {
    clearTimeout(timeouts['lockdelay']);
    timeouts['lockdelay'] = 0;
    lockcount = 0;
    tspin = false;
    minispin = false;
}

function endGame() {
    gameEnd = true;
    clearInterval(timeouts['gravity']);
    clearInterval(timeouts['stats']);
    console.log('END');
}

function resetGame() {
    currentPiece = null; currentLoc = null;
    heldpiece = { piece: null, occured: false };
    remainingpieces = [[], []];
    BTBcount = -1;
    combonumber = -1;
    endDasArr();
    resetVariables()
    clearInterval(timeouts['gravity']);
    removeElements(["#grid", "#next", "#hold", "#playingfield"]);
    StartGame();
}

function clearLines() {
    const rows = minoToCoords(document.querySelectorAll('.stopped')).map((coord) => coord[1])
        .reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {}) // count minos in row
    const clearRows = Object.keys(rows).filter((key) => rows[key] >= 10).map((row) => Number(row))
    for (let row of clearRows) {
        const DOMstopped = document.querySelectorAll('.stopped');
        [...DOMstopped].filter((mino) => Number(mino.style.gridArea.split('/')[0]) == row)
            .forEach((mino) => mino.remove()) // remove minos on row
        const moveMinos = [...DOMstopped]
            .filter((mino) => Number(mino.style.gridArea.split('/')[0]) < row);
        renderPieceMovement('DOWN', moveMinos) // move other minos down
    }
    renderActionText(clearRows.length, document.querySelectorAll('.stopped'))
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
    const piece = remainingpieces[0][0]; // take first piece from first bag
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
    let offset = (piece.name == 'o') ? 4 : 3 // since o is smaller, set different starting pos
    renderPieceFromCoords(DOMboard, pieceToCoords(piece, 'shape1'), 1, 1 + offset, piece, 'active')
    currentLoc = [offset + 1, 1];
    rotationState = 1;
    currentPiece = piece;
    updateNext();
    displayShadow();
}

function displayShadow() {
    removeMinos('.shadow')
    const DOMboard = document.getElementById('playingfield');
    const DOMminostopped = document.querySelectorAll('.stopped');
    const coords = pieceToCoords(currentPiece, 'shape' + rotationState);
    const colour = colouredShadow ? currentPiece.colour : "#1a1a1a";
    const dx = currentLoc[0], dy = currentLoc[1]
    renderPieceFromCoords(DOMboard, coords, dy, dx, currentPiece, 'shadow', colour, shadowOpacity + "%");

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
        .slice(0, (nextPieces > 5 ? 5 : nextPieces));
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
    if (heldpiece.piece == null) {
        heldpiece.piece = currentPiece;// first time holding
        resetVariables();
        heldpiece.occured = false;
        endDasArr();
        drawPiece(randomiser());
    } else {
        [heldpiece.piece, currentPiece] = [currentPiece, heldpiece.piece]
        resetVariables();
        drawPiece(currentPiece);
    }
    const DOMheldpiece = document.getElementById('hold');
    DOMheldpiece.replaceChildren();
    renderPieceFromCoords(DOMheldpiece, pieceToCoords(heldpiece.piece, 'shape1'),
        1, ((heldpiece.piece.name == 'o') ? 2 : 1), heldpiece.piece)
    changeColour('hold', heldpiece.piece.colour)
    heldpiece.occured = true;
}

// screen rendering
function drawGrid() {
    const DOMboard = document.getElementById('grid');
    for (let col = 0; col < 20; col++) {
        for (let row = 0; row < 10; row++) {
            let mino = document.createElement('div');
            mino.style.gridArea = `${col + 1} / ${row + 1} /span 1/span 1`
            mino.style.border = '1px solid white'
            mino.style.opacity = `${gridopacity}%`;
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
        let gridarea = mino.style.gridArea.split('/');
        let x = Number(gridarea[1]);
        let y = Number(gridarea[0]);
        switch (direction) {
            case "RIGHT": x += 1; break;
            case "LEFT": x -= 1; break;
            case "DOWN": y += 1; break;
        }
        mino.style.gridArea = `${y} / ${x} / span 1 / span 1`; // render moved minos
    }
}

function renderActionText(linecount, remainingMinos) {
    const isBTB = (tspin || minispin || linecount == 4) && linecount > 0; 
    const isPC = remainingMinos.length == 0;
    const damagetype = (tspin?'Tspin ':'') + (minispin?'mini ':'') + cleartypes[linecount];
    BTBcount = isBTB? BTBcount + 1: linecount != 0? BTBcount - 1: BTBcount; // increment stats
    combonumber = linecount == 0 ? -1 : combonumber + 1
    totalAttack += calcDamage(combonumber, damagetype.toUpperCase().trim(), isPC, BTBcount, isBTB);

    if (damagetype != '') setText('cleartext', damagetype, 2000);
    if (combonumber > 0) setText('combotext', `Combo ${combonumber}`, 2000);
    if (isBTB && BTBcount > 0) setText('btbtext', `BTB ${BTBcount} `, 2000); // render action text
    if (isPC) setText('pctext', "Perfect Clear", 2000);
}

function setText(id, text, duration) {
    const textbox = document.getElementById(id)
    textbox.textContent = text;
    if (timeouts[id] != 0) { clearTimeout(timeouts[id]); timeouts[id] = 0; }
    timeouts[id] = setTimeout(() => textbox.textContent = '', duration);
}

function renderStyles() {
    document.getElementById('body').style.backgroundColor = bgcolour;
    document.getElementById('board').style.backgroundColor = boardcolour;
    document.getElementById('hold').style.backgroundColor = boardcolour;
    document.getElementById('next').style.backgroundColor = boardcolour;
    document.getElementById('board').style.height = `${BoardHeightPercent}vh`;
    changeColour('hold', 'white')
    if (grid) drawGrid();
}

function renderStats() {
    totalTimeSeconds += 0.1;
    let displaytime = (Math.round(totalTimeSeconds * 10) / 10).toFixed(1)
    document.getElementById('stats1').textContent = `${totalAttack} sent`
    document.getElementById('stats2').textContent = `${totalPieceCount} pieces`
    document.getElementById('stats3').textContent = `${displaytime} s`
}

function changeColour(id, colour) {
    if (colouredQueues) {document.getElementById(id).style.border = `2px solid ${colour}`;}
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

function pieceToCoords(piece, shape, change = [0, 0]) {
    const dx = change[0], dy = change[1]
    return piece[shape].flatMap((row, column) =>
        row.reduce((acc, cell, rowIdx) => {
            if (cell == 1) acc.push([rowIdx + dx, column + dy]);
            return acc
        }, [])
    );
}

function getKickData(piece, rotationType, shapeNumber) {
    let indexIsI = (piece.name == 'i') ? 1 : 0; // check if i piece
    let kickdataindex = (rotationType == "CCW") ? (shapeNumber > 3) ? 0 : shapeNumber : shapeNumber - 1;
    let kickdata = // get correct kick data
        rotationType == "180" ? KickData180[indexIsI][kickdataindex] :
            rotationType == "CW" ? KickDataCW[indexIsI][kickdataindex] :
                rotationType == "CCW" ? KickDataCW[indexIsI][kickdataindex]
                    .map(row => row.map(element => element * -1)) : null
    return kickdata;
}

function resetStats() {
    if (timeouts['stats'] != 0) { clearInterval(timeouts['stats']) }
    totalTimeSeconds = -0.1;
    totalAttack = 0;
    totalPieceCount = 0;
    firstMovement = false;
}

function calcDamage(combonumber, damagetype, isPC, btb, isBTB) {
    let calccombo = combonumber > 20 ? 20 : combonumber < 0 ? 0 : combonumber;
    let damage = 0;    
    damage += attackValues[damagetype][calccombo]
    if (isPC) damage += attackValues['ALL_CLEAR'];
    if (btb > 0 && isBTB) {
        const x = Math.log1p((BTBcount) * 0.8)
        damage += ~~(Math.floor(x + 1) + (1 + (x % 1)) / 3)
    }
    return damage;
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

const spinMinoChecks = [[[0, 0], [2, 0]], [[2, 0], [2, 2]], [[0, 2], [2, 2]], [[0, 0], [0, 2]]]
const cleartypes = { '0': '', '1': 'Single', '2': 'Double', '3': 'Triple', '4': 'Quad' }

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