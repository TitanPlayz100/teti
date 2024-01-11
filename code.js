// GLOBALS
let loopfunction = null;
let rotationState = 1;
let currentPiece = null;
let heldpiece = { piece: null, occured: false };
let currentLoc = null;
let gameEnd = false;
let remainingpieces = [[], []]
let dasfunc = null;
let arrfunc = null;
let sdarrfunc = null;

// settings
const grid = true;
const arr = 50;
const das = 150;
const sdarr = 100;
const gravitySpeed = 1000;

const rightKey = 'ArrowRight';
const leftKey = 'ArrowLeft';
const cwKey = 'ArrowUp';
const ccwKey = 'z';
const hdKey = ' ';
const sdKey = 'ArrowDown';
const hold = 'c';

function main() {
    if (grid) drawGrid();
    drawPiece(randomiser());
    loopfunction = setInterval(() => { movePieceDown(false) }, gravitySpeed);
}

// Keyboard listeners
this.addEventListener('keydown', event => {
    if (event.repeat) return;
    if (gameEnd) return;
    if (event.key == rightKey) movePiece("RIGHT");
    if (event.key == leftKey) movePiece("LEFT");
    if (event.key == cwKey) rotate("CW");
    if (event.key == ccwKey) rotate("CCW");
    if (event.key == hdKey) movePieceDown(true);
    if (event.key == hold) holdPiece();

    // set das times
    if (event.key == rightKey || event.key == leftKey) {
        dasfunc = setTimeout(() => {
            arrfunc = setInterval(() => {
                if (event.key == rightKey) movePiece("RIGHT");
                if (event.key == leftKey) movePiece("LEFT");
            }, arr);
        }, das);
    }

    if (event.key == sdKey) {
        movePieceDown(false);
        sdarrfunc = setInterval(() => {
            if (event.key == sdKey) movePieceDown(false);
        }, sdarr);
    }
});

this.addEventListener('keyup', event => { if (event.key == rightKey || event.key == leftKey || event.key == sdKey) endDasArr() });

function endDasArr() {
    clearTimeout(dasfunc);
    clearInterval(arrfunc);
    clearInterval(sdarrfunc)
    dasfunc = null;
    arrfunc = null;
    sdarrfunc = null;
}

// piece movements
function rotate(type) {
    if (currentPiece.name == 'o') { return; }
    let stoprotate = false;
    let newrotationstate = (type == "CW") ?
        rotationState + 1 > 4 ? 1 : rotationState + 1
        : rotationState - 1 < 1 ? 4 : rotationState - 1
    const DOMboard = document.getElementsByClassName('board')[0];
    const currentShape = currentPiece['shape' + newrotationstate];
    for (let column = 0; column < currentShape.length; column++) {
        for (let row = 0; row < currentShape.length; row++) {
            if (currentShape[column][row] == 1) {
                let mino = document.createElement('div');
                let newcol = column + currentLoc[1] + 1
                let newrow = row + currentLoc[0] + 1
                if (newrow <= 0 || newrow > 10 || newcol > 19) stoprotate = true;
                mino.style.gridArea = newcol + "/" + newrow + "/span 1/span 1"
                mino.style.backgroundColor = currentPiece.colour;
                mino.classList.add('rotating')
                DOMboard.appendChild(mino);
            }
        }
    }
    const DOMrotated = document.querySelectorAll('.rotating')
    document.querySelectorAll('.stopped').forEach((stoppedmino) => {
        DOMrotated.forEach((rotatemino) => {
            if (stoppedmino.style.gridArea == rotatemino.style.gridArea) stoprotate = true;
        })
    })

    if (stoprotate == true) {
        DOMrotated.forEach((mino) => { mino.remove() });
        return;
    }
    document.querySelectorAll('.active').forEach((mino) => { mino.remove() });
    DOMrotated.forEach((mino) => {
        mino.classList.remove('rotating');
        mino.classList.add('active');
    })
    rotationState = newrotationstate
}

function movePiece(direction) {
    let stopmove = false;
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    for (let i = 0; i < DOMminos.length; i++) {
        let gridarea = DOMminos[i].style.gridArea.split('/');
        stopmove = (direction == 'RIGHT') ?
            Number(gridarea[1]) == 10 ? true : stopmove
            : stopmove = Number(gridarea[1]) == 1 ? true : stopmove
        for (let j = 0; j < DOMminostopped.length; j++) {
            let gridarea2 = DOMminostopped[j].style.gridArea.split('/');
            stopmove = (direction == 'RIGHT') ?
                stopmove = (Number(gridarea[1]) + 1 == Number(gridarea2[1]) && gridarea[0] == gridarea2[0]) ? true : stopmove
                : stopmove = (Number(gridarea[1]) - 1 == Number(gridarea2[1]) && gridarea[0] == gridarea2[0]) ? true : stopmove
        }
    }

    if (stopmove == true) return;
    for (let i = 0; i < DOMminos.length; i++) {
        let gridarea = DOMminos[i].style.gridArea.split('/');
        let newrow = null
        newrow = (direction == 'RIGHT') ? Number(gridarea[1]) + 1 : Number(gridarea[1]) - 1
        gridarea.splice(1, 1, newrow);
        gridarea.splice(2, 1);
        DOMminos[i].style.gridArea = gridarea.join('/');
    }
    currentLoc[0] = direction == 'RIGHT' ? currentLoc[0] + 1 : currentLoc[0] - 1
}

function movePieceDown(instant) {
    let stopfalling = false;
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    DOMminos.forEach((piece) => {
        let gridarea = piece.style.gridArea.split('/');
        if (gridarea[0] > 19) { // reached bottom of board
            stopfalling = true;
            DOMminos.forEach((mino) => { mino.classList.remove('active'); mino.classList.add('stopped'); });
        }
        DOMminostopped.forEach((stoppedmino) => {
            let gridarea2 = stoppedmino.style.gridArea.split('/');
            if ((Number(gridarea[0]) + 1) == Number(gridarea2[0]) && Number(gridarea[1]) == Number(gridarea2[1])) {
                if (Number(gridarea[0]) == 2) endGame();
                stopfalling = true;
                DOMminos.forEach((mino) => { mino.classList.remove('active'); mino.classList.add('stopped'); });
            }
        });
    });
    if (stopfalling == true) { hitGround(); return; }
    DOMminos.forEach((mino) => { // has not hit ground
        let gridarea = mino.style.gridArea.split('/');
        let newheight = Number(gridarea[0]) + 1;
        gridarea.splice(0, 1);
        mino.style.gridArea = newheight + "/" + gridarea.join('/');
    })
    currentLoc[1] += 1;
    if (instant) movePieceDown(true);
}

// gameplay mechanics
function hitGround() {
    rotationState = 1;
    heldpiece.occured = false;
    endDasArr()
    clearLines()
    drawPiece(randomiser())
}

function endGame() {
    gameEnd = true;
    clearInterval(loopfunction);
    console.log('END');
}

function clearLines() {
    const DOMminostopped = document.querySelectorAll('.stopped');
    let columns = {};
    DOMminostopped.forEach((stoppedmino) => {
        let row = Number(stoppedmino.style.gridArea.split('/')[0]);
        columns[row] = (columns[row] == undefined) ? 1 : columns[row] += 1
    });

    for (const key in columns) {
        if (columns[key] < 10) continue;
        DOMminostopped.forEach((stoppedmino) => { // clear minos in line
            if (Number(stoppedmino.style.gridArea.split('/')[0]) != key) return;
            stoppedmino.remove();
        });
        DOMminostopped.forEach((stoppedmino) => { // move minos down
            let row = Number(stoppedmino.style.gridArea.split('/')[0]);
            if (row >= key) return;
            let gridarea = stoppedmino.style.gridArea.split('/');
            let newheight = Number(gridarea[0]) + 1;
            gridarea.splice(0, 1);
            stoppedmino.style.gridArea = newheight + "/" + gridarea.join('/');
        });
    }
}

function randomiser() {
    if (remainingpieces[1].length == 0) {
        pieces.forEach((piece) => remainingpieces[1].push(piece.name))
        remainingpieces[1] = shuffleArray(remainingpieces[1])
    }
    if (remainingpieces[0].length == 0) {
        remainingpieces[0] = remainingpieces[1];
        remainingpieces[1] = [];
        pieces.forEach((piece) => remainingpieces[1].push(piece.name))
        remainingpieces[1] = shuffleArray(remainingpieces[1])
    }
    const piece = remainingpieces[0][0];
    remainingpieces[0].splice(0, 1);
    return piece, pieces.filter((element) => { return element.name == piece })[0];
}

function shuffleArray(array) {
    let unshuffled = array;
    return unshuffled.map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value);
}

function drawPiece(piece) {
    currentPiece = piece;
    const DOMboard = document.getElementsByClassName('board')[0];
    for (let column = 0; column < piece.shape1.length; column++) {
        for (let row = 0; row < piece.shape1.length; row++) {
            if (piece.shape1[column][row] != 1) continue; // check pattern specified to colour in
            let mino = document.createElement('div');
            let offset = (piece.name == 'o') ? 4 : 3;
            mino.style.gridArea = (column + 1) + "/" + (row + 1 + offset) + "/span 1/span 1"
            mino.style.backgroundColor = piece.colour;
            mino.classList.add('active')
            DOMboard.appendChild(mino);
            currentLoc = [offset, 1];
        }
    }
    updateNext();
}

function updateNext() {
    let first5 = remainingpieces[0].concat(remainingpieces[1]).slice(0, 5);
    const DOMNext = document.getElementsByClassName('next')[0];
    DOMNext.replaceChildren()
    for (let i = 0; i < first5.length; i++) {
        const piece = pieces.filter((element) => { return element.name == first5[i] })[0];
        const pieceheight = piece.shape1.length;
        const piecelength = piece.shape1[0].length;
        for (let column = 0; column < pieceheight; column++) {
            for (let row = 0; row < piecelength; row++) {
                if (piece.shape1[column][row] != 1) continue; // pattern to colour in
                let mino = document.createElement('div');
                let offset = (piece.name == 'o') ? 2 : 1;
                mino.style.gridArea = (column + (3 * i) + 1) + "/" + (row + offset) + "/span 1/span 1"
                mino.style.backgroundColor = piece.colour;
                DOMNext.appendChild(mino);
            }
        }
    }
}

function holdPiece() {
    if (heldpiece.occured == true) return;
    const DOMminos = document.querySelectorAll('.active');
    DOMminos.forEach((mino) => mino.remove());

    if (heldpiece.piece == null) {
        heldpiece.piece = currentPiece;
        hitGround();
    } else {
        let newpiece = heldpiece.piece;
        heldpiece.piece = currentPiece;
        currentPiece = newpiece;
        rotationState = 1;
        drawPiece(currentPiece);
    }

    const DOMheldpiece = document.querySelectorAll('.hold')[0];
    DOMheldpiece.replaceChildren();
    const pieceheight = heldpiece.piece.shape1.length;
    const piecelength = heldpiece.piece.shape1[0].length;
    for (let column = 0; column < pieceheight; column++) {
        for (let row = 0; row < piecelength; row++) {
            if (heldpiece.piece.shape1[column][row] != 1) continue; // pattern to colour in
            let mino = document.createElement('div');
            let offset = (heldpiece.piece.name == 'o') ? 2 : 1;
            mino.style.gridArea = (column + 1) + "/" + (row + offset) + "/span 1/span 1"
            mino.style.backgroundColor = heldpiece.piece.colour;
            DOMheldpiece.appendChild(mino);
        }
    }
    heldpiece.occured = true;
}

function drawGrid() {
    const DOMboard = document.getElementsByClassName('board')[0];
    for (let col = 0; col < 20; col++) {
        for (let row = 0; row < 10; row++) {
            let mino = document.createElement('div');
            mino.style.gridArea = (col + 1) + "/" + (row + 1) + "/span 1/span 1"
            mino.classList.add('gridLine');
            DOMboard.appendChild(mino);
        }
    }
}

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
main();