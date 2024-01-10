// GLOBALS
let loopfunction = null;
let rotationState = null;
let currentPiece = null;
let currentLoc = null;
const arr = 50;
const das = 150;
const gravitySpeed = 1000

const rightKey = 'ArrowRight'
const leftKey = 'ArrowLeft'
const cwKey = 'ArrowUp'
const ccwKey = 'z'
const hdKey = ' '

function main() {
    drawPiece(randomiser())
    loopfunction = setInterval(() => {movePieceDown(false)}, gravitySpeed);
}

// Key listeners
this.addEventListener('keydown', event => {
    if (event.repeat) return;
    if (event.key == rightKey) movePiece("RIGHT");
    if (event.key == leftKey) movePiece("LEFT");
    if (event.key == cwKey) rotate("CW");
    if (event.key == ccwKey) rotate("CCW");
    if (event.key == hdKey) movePieceDown(true);
});

function rotate(type) {
    if (currentPiece.name == 'o') { return; }
    let stoprotate = false;
    let newrotationstate = (type == "CW") ?
        rotationState + 1 > 4 ? 1 : rotationState + 1
        : rotationState - 1 < 1 ? 4 : rotationState - 1
    const DOMboard = document.getElementsByClassName('board')[0];
    const currentShape = currentPiece['shape' + newrotationstate];
    for (let column = 0; column < currentShape.length; column++) {
        for (let row = 0; row < currentShape.length; row++) { // THERE MAY BE A PROBLEM WITH currentShape.length being the same
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
        if (gridarea[0] > 19) {
            stopfalling = true;
            DOMminos.forEach((mino) => {
                mino.classList.remove('active');
                mino.classList.add('stopped')
            })
        }
        DOMminostopped.forEach((stoppedmino) => {
            let gridarea2 = stoppedmino.style.gridArea.split('/');
            if ((Number(gridarea[0]) + 1) == Number(gridarea2[0]) && Number(gridarea[1]) == Number(gridarea2[1])) {
                if (Number(gridarea[0]) == 2) endGame();
                stopfalling = true;
                DOMminos.forEach((mino) => {
                    mino.classList.remove('active');
                    mino.classList.add('stopped');
                });
            }
        });
    });
    if (stopfalling == true) { // Has hit ground
        rotationState = 1;
        clearLines()
        drawPiece(randomiser())
        stoppiece = false;
        return;
    }
    DOMminos.forEach((mino) => { // has not hit ground
        let gridarea = mino.style.gridArea.split('/');
        let newheight = Number(gridarea[0]) + 1;
        gridarea.splice(0, 1);
        mino.style.gridArea = newheight + "/" + gridarea.join('/');
    })
    currentLoc[1] += 1;
    if (instant) movePieceDown(true);
}

function endGame() {
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
        if (columns[key] >= 10) {
            DOMminostopped.forEach((stoppedmino) => {
                let row = Number(stoppedmino.style.gridArea.split('/')[0]);
                if (row == key) {
                    stoppedmino.remove();
                }
            });
            DOMminostopped.forEach((stoppedmino) => {
                let row = Number(stoppedmino.style.gridArea.split('/')[0]);
                if (row < key) {
                    let gridarea = stoppedmino.style.gridArea.split('/');
                    let newheight = Number(gridarea[0]) + 1;
                    gridarea.splice(0, 1);
                    stoppedmino.style.gridArea = newheight + "/" + gridarea.join('/');
                }
            });
        }
    }
}

const remainingpieces = [[], []]
function randomiser() {
    if (remainingpieces[1].length == 0) {
        pieces.forEach((piece) => remainingpieces[1].push(piece.name))
        let unshuffled = remainingpieces[1];
        let shuffled = unshuffled
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
        remainingpieces[1] = shuffled
    }
    if (remainingpieces[0].length == 0) {
        remainingpieces[0] = remainingpieces[1];
        remainingpieces[1] = [];
        pieces.forEach((piece) => remainingpieces[1].push(piece.name))
        let unshuffled = remainingpieces[1];
        let shuffled = unshuffled
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
        remainingpieces[1] = shuffled
    }
    const piece = remainingpieces[0][0];
    remainingpieces[0].splice(0, 1);
    let index = 0;
    for (let i = 0; i < pieces.length; i++) {
        if (pieces[i].name == piece) {
            index = i
        }
    }
    return pieces[index]
}

function drawPiece(piece) {
    currentPiece = piece;
    const DOMboard = document.getElementsByClassName('board')[0];

    const pieceheight = piece.shape1.length;
    const piecelength = piece.shape1[0].length;
    for (let column = 0; column < pieceheight; column++) {
        for (let row = 0; row < piecelength; row++) {
            if (piece.shape1[column][row] == 1) {
                let mino = document.createElement('div');
                if (piece.name == "i") {
                    mino.style.gridArea = (column + 1) + "/" + (row + 1 + 3) + "/span 1/span 1"
                    currentLoc = [3, 1];
                } else {
                    mino.style.gridArea = (column + 1) + "/" + (row + 1 + 4) + "/span 1/span 1"
                    currentLoc = [4, 1];
                }
                mino.style.backgroundColor = piece.colour;
                mino.classList.add('active')
                DOMboard.appendChild(mino);
            }
        }
    }
    updateNext();
}

function updateNext() {
    let first5 = remainingpieces[0].concat(remainingpieces[1]).slice(0, 5);
    const DOMNext = document.getElementsByClassName('next')[0];
    DOMNext.replaceChildren()
    for (let i = 0; i < first5.length; i++) {
        let index = 0;
        for (let j = 0; j < pieces.length; j++) {
            if (pieces[j].name == first5[i]) {
                index = j
            }
        }
        const piece = pieces[index]
        const pieceheight = piece.shape1.length;
        const piecelength = piece.shape1[0].length;
        for (let column = 0; column < pieceheight; column++) {
            for (let row = 0; row < piecelength; row++) {
                if (piece.shape1[column][row] == 1) {
                    let mino = document.createElement('div');
                    if (piece.name == "o") {
                        mino.style.gridArea = (column + (3 * i) + 1) + "/" + (row + 2) + "/span 1/span 1"
                    } else {
                        mino.style.gridArea = (column + (3 * i) + 1) + "/" + (row + 1) + "/span 1/span 1"
                    }
                    mino.style.backgroundColor = piece.colour;
                    DOMNext.appendChild(mino);
                }
            }
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
        colour: "green"
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
        colour: "purple"
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
        colour: "orange"
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
]

main();
