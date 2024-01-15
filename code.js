// GLOBALS
let loopfunction, currentPiece, currentLoc, dasfunc, arrfunc, sdarrfunc, lockdelayfunc;
let rotationState = 1;
let heldpiece = { piece: null, occured: false };
let gameEnd = false;
let remainingpieces = [[], []]
let lockcount = 0;
let combonumber = -1;
let tspin = false;
let minispin = false;
let BTBcount = -1;

// settings
const grid = true;
const arr = 0;
const das = 75;
const sdarr = 0;
const gravitySpeed = 1000;
const shadowOpacity = 20;
const lockDelay = 1000;
const maxLockMovements = 15;
const nextPieces = 5;
const colouredShadow = true;

const rightKey = 'ArrowRight';
const leftKey = 'ArrowLeft';
const cwKey = 'ArrowUp';
const ccwKey = 'z';
const hdKey = ' ';
const sdKey = 'ArrowDown';
const holdKey = 'c';
const resetKey = 'd'
const rotate180Key = 'x'

function main() {
    if (grid) drawGrid();
    drawPiece(randomiser()); // render first piece
    if (gravitySpeed != 0) { // loop for dropping piece through gravity
        loopfunction = setInterval(() => { movePieceDown(false, false) }, gravitySpeed)
    };
}

this.addEventListener('keydown', event => { // Keyboard listeners
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
        else { sdarrfunc = setInterval(() => { movePieceDown(false, false); }, sdarr); }
    }
});

this.addEventListener('keyup', event => {
    if (event.key == rightKey || event.key == leftKey || event.key == sdKey) endDasArr();
});

function startDas(direction) { // apply custom das and arr
    movePieceSide(direction, false)
    endDasArr()
    dasfunc = setTimeout(() => {
        if (arr == 0) { movePieceSide(direction, true) }
        else { arrfunc = setInterval(() => { movePieceSide(direction, false); }, arr); }
    }, das);
}

function endDasArr() {
    clearTimeout(dasfunc);
    clearInterval(arrfunc);
    clearInterval(sdarrfunc)
    dasfunc = null; arrfunc = null; sdarrfunc = null;
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
    const rotatingCoords = pieceToCoords(currentPiece, 'shape' + newRotation, currentLoc[0], currentLoc[1]);
    const newTransformation = kickdata.find((transformation) => {
        const dx = transformation[0], dy = transformation[1]
        const coords = rotatingCoords.map((coord) => [coord[0] + dx, coord[1] - dy]);
        if (!checkCollision(coords, DOMstopped, 'ROTATE')) return true;
    });
    if (newTransformation == undefined) return;
    removeMinos('.active')
    renderPieceFromCoords(document.getElementsByClassName('board')[0],
        rotatingCoords, -1 * newTransformation[1], newTransformation[0], currentPiece, 'active');
    currentLoc = [currentLoc[0] + newTransformation[0], currentLoc[1] - newTransformation[1]]
    if (checkTspin(newRotation, currentLoc, DOMstopped, newTransformation)) tspin = true;
    rotationState = newRotation;
    incrementLock();
    renderShadowPiece();
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
    renderShadowPiece();
    incrementLock();
    tspin = false;
    minispin = false;
    if (instant) movePieceSide(direction, true);
}

function movePieceDown(harddrop, softdrop) {
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    if (lockdelayfunc != null) { // if piece is locking and used harddrop
        if (harddrop) lockPiece(DOMminos);
        return;
    };
    renderPieceMovement('DOWN', DOMminos);
    tspin = false;
    minispin = false;
    currentLoc[1] += 1;
    if (checkCollision(minoToCoords(DOMminos), DOMminostopped, 'DOWN')) {
        if (harddrop || lockcount > maxLockMovements) { lockPiece(DOMminos); } // harddrop instant
        else { lockdelayfunc = setTimeout(() => { lockPiece(DOMminos); }, lockDelay); }
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
    heldpiece.occured = false;
    endDasArr();
    drawPiece(randomiser());
}

function incrementLock() { // reset lockdelay, increment lock count
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    clearTimeout(lockdelayfunc);
    lockdelayfunc = null;
    lockcount++;
    if (checkCollision(minoToCoords(DOMminos), DOMminostopped, 'DOWN')) {
        if (lockcount > maxLockMovements) { lockPiece(DOMminos); }
        else { lockdelayfunc = setTimeout(() => { lockPiece(DOMminos); }, lockDelay); }
    }
}

function resetVariables() {
    rotationState = 1;
    clearTimeout(lockdelayfunc);
    lockdelayfunc = null;
    lockcount = 0;
    tspin = false;
    minispin = false;
}

function endGame() {
    gameEnd = true;
    clearInterval(loopfunction);
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
    clearInterval(loopfunction);
    resetBoard([".board", ".next", ".hold"]);
    main();
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
    displayLineClear(clearRows.length, document.querySelectorAll('.stopped'))
}

function displayLineClear(count, remainingMinos) {
    let cleartype = '';
    if (tspin || minispin || count == 4) {
        BTBcount += 1;
        if (BTBcount > 0) cleartype += `BTB ${BTBcount} `
    } else {
        if (count != 0) BTBcount = -1;
    }

    if (minispin) cleartype += 'mini ';
    if (tspin) cleartype += 'tspin ';

    switch (count) {
        case 0: cleartype += ''; combonumber = -1; break;
        case 1: cleartype += 'single '; combonumber += 1; break;
        case 2: cleartype += 'double '; combonumber += 1; break;
        case 3: cleartype += 'triple '; combonumber += 1; break;
        case 4: cleartype += 'tetris '; combonumber += 1; break;
    }
    if (combonumber > 0) cleartype += `combo ${combonumber} `
    if (remainingMinos.length == 0) cleartype += "perfect clear "
    if (cleartype != '') console.log(cleartype)
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
    return pieces.filter((element) => { return element.name == piece })[0]; // return piece object from pieces
}

function shuffleArray(array) {
    let unshuffled = array;
    return unshuffled
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

function drawPiece(piece) {
    const DOMboard = document.getElementsByClassName('board')[0];
    let offset = (piece.name == 'o') ? 4 : 3 // since o is smaller, set different starting pos
    renderPieceFromCoords(DOMboard, pieceToCoords(piece, 'shape1'), 1, 1 + offset, piece, 'active')
    currentLoc = [offset + 1, 1];
    currentPiece = piece;
    updateNext();
    renderShadowPiece();
}

function renderShadowPiece() {
    removeMinos('.shadow')
    const DOMboard = document.getElementsByClassName('board')[0];
    const DOMminostopped = document.querySelectorAll('.stopped');
    const coords = pieceToCoords(currentPiece, 'shape' + rotationState);
    const colour = colouredShadow ? currentPiece.colour : "#1a1a1a";
    const x = currentLoc[0], y = currentLoc[1]
    renderPieceFromCoords(DOMboard, coords, y, x, currentPiece, 'shadow', colour, shadowOpacity + "%");

    while (true) {
        const shadowMinos = document.querySelectorAll('.shadow');
        if (checkCollision(minoToCoords(shadowMinos), DOMminostopped, "DOWN")) break;
        renderPieceMovement("DOWN", shadowMinos);
    }
}

function updateNext() {
    const DOMNext = document.getElementsByClassName('next')[0];
    removeMinos('.nextmino')
    let first5 = remainingpieces[0]
        .concat(remainingpieces[1])
        .slice(0, (nextPieces > 5 ? 5 : nextPieces));
    for (let i = 0; i < first5.length; i++) {
        const piece = pieces.filter((element) => { return element.name == first5[i] })[0]; // get piece object
        renderPieceFromCoords(DOMNext, pieceToCoords(piece, 'shape1'),
            1 + (3 * i), ((piece.name == 'o') ? 2 : 1), piece, 'nextmino');
    }
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
    const DOMheldpiece = document.querySelectorAll('.hold')[0];
    DOMheldpiece.replaceChildren();
    renderPieceFromCoords(DOMheldpiece, pieceToCoords(heldpiece.piece, 'shape1'),
        1, ((heldpiece.piece.name == 'o') ? 2 : 1), heldpiece.piece)
    heldpiece.occured = true;
}

// screen rendering
function drawGrid() {
    const DOMboard = document.getElementsByClassName('board')[0];
    for (let col = 0; col < 20; col++) {
        for (let row = 0; row < 10; row++) {
            let mino = document.createElement('div');
            mino.style.gridArea = `${col + 1} / ${row + 1} /span 1/span 1`
            mino.classList.add('gridLine');
            if (col < 2) mino.classList.add('dangerZone')
            DOMboard.appendChild(mino);
        }
    }
}

function renderPieceFromCoords(parentDiv, coords, heightadjust = 0, rowadjust = 0, piece, classname = null, colour = piece.colour, opacity = "100%") {
    coords.forEach((coord) => {
        let mino = document.createElement('div');
        let newrow = coord[0] + rowadjust;
        let newcol = coord[1] + heightadjust;
        mino.style.gridArea = `${newcol} / ${newrow} /span 1/span 1`; // render new minos based of transformations
        mino.style.backgroundColor = colour;
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

// misc functions
function removeMinos(id) { document.querySelectorAll(id).forEach((mino) => mino.remove()); }

function resetBoard(classes) {
    classes.forEach((classname) => { document.querySelectorAll(classname)[0].replaceChildren(); })
}

function minoToCoords(minos) {
    return [...minos].map((mino) => {
        let gridarea = mino.style.gridArea.split('/');
        return [Number(gridarea[1]), Number(gridarea[0])];
    })
}

function pieceToCoords(piece, shape, dx = 0, dy = 0) {
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

// CCW data is CW data * -1  |   i piece is 2nd array
const KickDataCW = [[
    [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], // 4 -> 1 -> 4
    [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 1 -> 2 -> 1
    [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], // 2 -> 3 -> 2
    [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]] // 3 -> 4 -> 3
], [
    [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], // 4 -> 1
    [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], // 1 -> 2
    [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], // 2 -> 3
    [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]] // 3 -> 4
]]

const KickData180 = [[
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]], // 3 -> 1
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]], // 4 -> 2
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]], // 1 -> 3
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]], // 2 -> 4
], [
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]], // 3 -> 1
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]], // 4 -> 2
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]], // 1 -> 3
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]], // 2 -> 4
]];

const spinMinoChecks = [[[0, 0], [2, 0]], [[2, 0], [2, 2]], [[0, 2], [2, 2]], [[0, 0], [0, 2]]]

main();