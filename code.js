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
let lockdelayfunc = null;
let lockcount = 0;

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

// Keyboard listeners
this.addEventListener('keydown', event => {
    if (event.repeat) return;
    if (gameEnd) return;
    if (event.key == resetKey) resetGame();
    if (event.key == cwKey) rotate("CW");
    if (event.key == ccwKey) rotate("CCW");
    if (event.key == rotate180Key) rotate("180");
    if (event.key == hdKey) movePieceDown(true, false);
    if (event.key == holdKey) holdPiece();

    // apply custom das and arr
    if (event.key == rightKey) {
        movePiece("RIGHT", false)
        endDasArr()
        dasfunc = setTimeout(() => {
            if (arr == 0) { movePiece("RIGHT", true) }
            else { arrfunc = setInterval(() => { movePiece("RIGHT", false); }, arr); }
        }, das);
    }

    if (event.key == leftKey) {
        movePiece("LEFT", false)
        endDasArr()
        dasfunc = setTimeout(() => {
            if (arr == 0) { movePiece("LEFT", true) }
            else { arrfunc = setInterval(() => { movePiece("LEFT", false); }, arr); }
        }, das);
    }

    if (event.key == sdKey) {
        if (sdarr == 0) { movePieceDown(false, true) }
        else { sdarrfunc = setInterval(() => { movePieceDown(false, false); }, sdarr); }
    }
});

this.addEventListener('keyup', event => {
    if (event.key == rightKey || event.key == leftKey || event.key == sdKey) endDasArr()
});

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
    const DOMboard = document.getElementsByClassName('board')[0];
    const DOMstopped = document.querySelectorAll('.stopped');
    let newrotationstate =
        type == "CW" ? (rotationState + 1) % 4 :
            type == "CCW" ? (rotationState - 1) % 4 :
                type == "180" ? (rotationState + 2) % 4 :
                    null
    if (newrotationstate == 0) newrotationstate = 4; // get correct rotation state after spin
    const newPiece = currentPiece['shape' + newrotationstate];
    let newtranformations = [0, 0];
    let rotate = false;
    let rotatingCoords = [];
    newPiece.forEach((row, column) => { // get coords of new rotated minos
        row.forEach((cell, rowIdx) => {
            if (cell === 1) rotatingCoords.push([rowIdx + currentLoc[0], column + currentLoc[1]]);
        });
    });
    let indexIsI = (currentPiece.name == 'i') ? 1 : 0; // check if i piece
    let kickdataindex = (type == "CCW") ? (newrotationstate > 3) ? 0 : newrotationstate
        : newrotationstate - 1; // change row to one below for correct info when CCW
    let kickdata = // get correct kick data
        type == "180" ? KickData180[indexIsI][kickdataindex] :
            type == "CW" ? KickDataCW[indexIsI][kickdataindex] :
                type == "CCW" ? KickDataCW[indexIsI][kickdataindex]
                    .map(row => row.map(element => element * -1))
                    : null
    kickdata.forEach((transformation) => {
        if (rotate == true) return;
        let canspin = true;
        rotatingCoords.forEach((coord) => {
            let newposX = coord[0] + transformation[0];
            let newposY = 21 - coord[1] + transformation[1];
            if (newposX < 1 || newposX > 10 || newposY < 1) canspin = false; // mino off board
            DOMstopped.forEach((stoppedmino) => {
                let stoppedgridmino = stoppedmino.style.gridArea.split('/');
                if (newposY == (21 - Number(stoppedgridmino[0]))
                    && newposX == Number(stoppedgridmino[1])) canspin = false; // mino collided with board
            });
        });
        if (canspin == true) { newtranformations = transformation; rotate = true; } // if nothing failed, then use that transformations for spin
    });
    if (!rotate) { return; }

    document.querySelectorAll('.active').forEach((mino) => { mino.remove() });
    rotatingCoords.forEach((coord) => { 
        let mino = document.createElement('div');
        let newrow = coord[0] + newtranformations[0];
        let newcol = coord[1] - newtranformations[1];
        mino.style.gridArea = `${newcol} / ${newrow} /span 1/span 1`; // render new minos based of transformations
        mino.style.backgroundColor = currentPiece.colour;
        mino.style.outline = `1px solid ${currentPiece.colour}`;
        mino.classList.add('active')
        DOMboard.appendChild(mino);
    })
    currentLoc = [currentLoc[0] + newtranformations[0], currentLoc[1] - newtranformations[1]]
    rotationState = newrotationstate;
    incrementLock();
    renderShadowPiece();
}

function movePiece(direction, instant) {
    let stopmove = false;
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    for (let i = 0; i < DOMminos.length; i++) {
        let gridarea = DOMminos[i].style.gridArea.split('/');
        stopmove = (direction == 'RIGHT') ? // check boundaries of 1 and 10
            Number(gridarea[1]) == 10 ? true : stopmove
            : Number(gridarea[1]) == 1 ? true : stopmove;
        for (let j = 0; j < DOMminostopped.length; j++) {
            let gridarea2 = DOMminostopped[j].style.gridArea.split('/');
            stopmove = (direction == 'RIGHT') ?
                (Number(gridarea[1]) + 1 == Number(gridarea2[1]) && // moving right and hit placed mino
                    gridarea[0] == gridarea2[0]) ?
                    true : stopmove
                : (Number(gridarea[1]) - 1 == Number(gridarea2[1]) && // moving left and hit placed mino
                    gridarea[0] == gridarea2[0]) ?
                    true : stopmove
        }
    }
    if (stopmove) return;

    for (let i = 0; i < DOMminos.length; i++) { 
        let gridarea = DOMminos[i].style.gridArea.split('/');
        let newrow = null
        newrow = (direction == 'RIGHT') ? Number(gridarea[1]) + 1 : Number(gridarea[1]) - 1
        gridarea.splice(1, 1, newrow);
        gridarea.splice(2, 1);
        DOMminos[i].style.gridArea = gridarea.join('/'); // render moved minos
    }
    currentLoc[0] = direction == 'RIGHT' ? currentLoc[0] + 1 : currentLoc[0] - 1;
    renderShadowPiece();
    incrementLock();
    if (instant) movePiece(direction, true);
}

function movePieceDown(harddrop, softdrop) {
    if (lockdelayfunc != null) { // if piece is locking and used harddrop
        if (harddrop) checkFalling(false, true);
        return;
    };
    const DOMminos = document.querySelectorAll('.active');
    DOMminos.forEach((mino) => { // piece has not hit ground by now
        let gridarea = mino.style.gridArea.split('/');
        let newheight = Number(gridarea[0]) + 1; // render piece 1 down
        gridarea.splice(0, 1);
        mino.style.gridArea = newheight + "/" + gridarea.join('/');
    })
    currentLoc[1] += 1;
    if (checkFalling(harddrop, false)) return; // after drop if piece is on floor then dont harddrop or softdrop 
    if (harddrop) movePieceDown(true, false);
    if (softdrop) movePieceDown(false, true);
}

function checkFalling(harddrop, lock) {
    const DOMminos = document.querySelectorAll('.active');
    const DOMminostopped = document.querySelectorAll('.stopped');
    let falling = true;
    if (lock) { lockPiece(DOMminos); return true; }
    DOMminos.forEach((piece) => {
        let gridarea = piece.style.gridArea.split('/');
        if (Number(gridarea[0]) > 19) falling = false; // reached bottom of board
        DOMminostopped.forEach((stoppedmino) => {
            let gridarea2 = stoppedmino.style.gridArea.split('/');
            if ((Number(gridarea[0]) + 1) == Number(gridarea2[0])
                && Number(gridarea[1]) == Number(gridarea2[1])) {
                if (Number(gridarea[0]) == 2) endGame();// reached top of board
                falling = false;                        // hit mino
            }
        });
    });
    if (!falling) { // cannot go down further
        if (harddrop || lockcount > maxLockMovements) { lockPiece(DOMminos); } // harddrop instant
        else { lockdelayfunc = setTimeout(() => { lockPiece(DOMminos); }, lockDelay); } // set lock start
        return true;
    }
    return false;
}

// gameplay mechanics
function lockPiece(DOMminos) { // set piece from active to stopped
    DOMminos.forEach((mino) => { 
        mino.classList.remove('active'); 
        mino.classList.add('stopped'); });
    hitGround();
}

function incrementLock() { // reset lockdelay, increment lock count
    clearTimeout(lockdelayfunc);
    lockdelayfunc = null;
    lockcount++;
    checkFalling(false, false);
}

function hitGround() {
    rotationState = 1;
    heldpiece.occured = false;
    clearTimeout(lockdelayfunc);
    lockdelayfunc = null;
    lockcount = 0;
    endDasArr()
    clearLines()
    drawPiece(randomiser())
}

function endGame() {
    gameEnd = true;
    clearInterval(loopfunction);
    console.log('END');
}

function resetGame() {
    rotationState = 1;
    currentPiece = null;
    heldpiece = { piece: null, occured: false };
    currentLoc = null;
    remainingpieces = [[], []];
    lockdelayfunc = null;
    lockcount = 0;
    endDasArr();
    clearInterval(loopfunction);
    document.querySelectorAll('.board')[0].replaceChildren();
    document.querySelectorAll('.next')[0].replaceChildren();
    document.querySelectorAll('.hold')[0].replaceChildren();
    main();
}

function clearLines() {
    const DOMminostopped = document.querySelectorAll('.stopped');
    let rows = {};
    DOMminostopped.forEach((stoppedmino) => { // sort each stopped mino into its columns
        let column = Number(stoppedmino.style.gridArea.split('/')[0]);
        rows[column] = (rows[column] == undefined) ? 1 : rows[column] += 1
    });

    for (const key in rows) {
        if (rows[key] < 10) continue; // if a row has 10 minos
        DOMminostopped.forEach((stoppedmino) => { // clear minos in row
            if (Number(stoppedmino.style.gridArea.split('/')[0]) != key) return;
            stoppedmino.remove();
        });
        DOMminostopped.forEach((stoppedmino) => { 
            let row = Number(stoppedmino.style.gridArea.split('/')[0]);
            if (row >= key) return;
            let gridarea = stoppedmino.style.gridArea.split('/');
            let newheight = Number(gridarea[0]) + 1;
            gridarea.splice(0, 1);
            stoppedmino.style.gridArea = newheight + "/" + gridarea.join('/'); // move rest of minos down
        });
    }
}

function randomiser() {
    if (remainingpieces[1].length == 0) { // empty bag 2
        pieces.forEach((piece) => remainingpieces[1].push(piece.name)) // add pieces
        remainingpieces[1] = shuffleArray(remainingpieces[1]) // shuffle bag 2
    }
    if (remainingpieces[0].length == 0) { // empty bag 1, move bag 2 to bag 1, refill bag 2
        remainingpieces[0] = remainingpieces[1];
        remainingpieces[1] = [];
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
    for (let column = 0; column < piece.shape1.length; column++) {
        for (let row = 0; row < piece.shape1.length; row++) {
            if (piece.shape1[column][row] != 1) continue; // check pattern specified to colour in
            let mino = document.createElement('div');
            let offset = (piece.name == 'o') ? 4 : 3 // since o is smaller, set different starting pos
            const newcol = column + 1;
            const newrow = row + 1 + offset;
            mino.style.gridArea = `${newcol} / ${newrow} /span 1/span 1`
            mino.style.backgroundColor = piece.colour;
            mino.style.outline = `1px solid ${piece.colour}`
            mino.classList.add('active')
            DOMboard.appendChild(mino);
            currentLoc = [offset + 1, 1];
        }
    }
    currentPiece = piece;
    updateNext();
    renderShadowPiece();
}

function renderShadowPiece() {
    const DOMboard = document.getElementsByClassName('board')[0];
    const currentShadow = document.querySelectorAll('.shadow');
    currentShadow.forEach((mino) => mino.remove()); // remove shadow
    const pieceShape = currentPiece["shape" + rotationState];
    for (let column = 0; column < pieceShape.length; column++) {
        for (let row = 0; row < pieceShape.length; row++) {
            if (pieceShape[column][row] != 1) continue; // check pattern specified to colour in
            let mino = document.createElement('div');
            let newcol = column + currentLoc[1];
            let newrow = row + currentLoc[0];
            mino.style.gridArea = `${newcol} / ${newrow} /span 1/span 1` // render shadow minos
            mino.style.backgroundColor = colouredShadow ? currentPiece.colour : "#1a1a1a";
            mino.style.opacity = shadowOpacity + "%";
            mino.classList.add('shadow')
            DOMboard.appendChild(mino);
        }
    }

    let falling = true;
    const DOMminostopped = document.querySelectorAll('.stopped');
    while (falling) { // drop shadow until it hits something or bottom of board
        const shadowMinos = document.querySelectorAll('.shadow');
        shadowMinos.forEach((shadow) => {
            let gridarea = shadow.style.gridArea.split('/');
            let newheight = Number(gridarea[0]) + 1;
            if (newheight > 20) falling = false; // bottom of board
            DOMminostopped.forEach((stoppedmino) => {
                let gridarea2 = stoppedmino.style.gridArea.split('/');
                if ((newheight) == Number(gridarea2[0]) &&
                    Number(gridarea[1]) == Number(gridarea2[1])) falling = false; // hit mino
            });
        });
        shadowMinos.forEach((shadow) => {
            if (falling) {
                let gridarea = shadow.style.gridArea.split('/');
                let newheight = Number(gridarea[0]) + 1;
                gridarea.splice(0, 1);
                shadow.style.gridArea = newheight + "/" + gridarea.join('/'); // move shadow 1 down
            }
        })
    }
}

function updateNext() {
    let first5 = remainingpieces[0]
        .concat(remainingpieces[1])
        .slice(0, (nextPieces > 5 ? 5 : nextPieces)); // get first 5 pieces
    const DOMNext = document.getElementsByClassName('next')[0];
    DOMNext.replaceChildren()
    for (let i = 0; i < first5.length; i++) {
        const piece = pieces.filter((element) => { return element.name == first5[i] })[0]; // get piece object
        const pieceheight = piece.shape1.length;
        const piecelength = piece.shape1[0].length;
        for (let column = 0; column < pieceheight; column++) {
            for (let row = 0; row < piecelength; row++) {
                if (piece.shape1[column][row] != 1) continue; // pattern to colour in
                let mino = document.createElement('div');
                const newcol = column + (3 * i) + 1;
                const newrow = row + ((piece.name == 'o') ? 2 : 1);
                mino.style.gridArea = `${newcol} / ${newrow} /span 1/span 1` // render next minos
                mino.style.backgroundColor = piece.colour;
                DOMNext.appendChild(mino);
            }
        }
    }
}

function holdPiece() { // similar to next queue
    if (heldpiece.occured == true) return;
    const DOMminos = document.querySelectorAll('.active');
    DOMminos.forEach((mino) => mino.remove());

    if (heldpiece.piece == null) { // first time holding
        heldpiece.piece = currentPiece;
        hitGround();
    } else { // swap hold and current piece
        let newpiece = heldpiece.piece;
        heldpiece.piece = currentPiece;
        currentPiece = newpiece;
        rotationState = 1;
        clearTimeout(lockdelayfunc);
        lockdelayfunc = null;
        lockcount = 0;
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
            const newcol = column + 1;
            const newrow = row + ((heldpiece.piece.name == 'o') ? 2 : 1);
            mino.style.gridArea = `${newcol} / ${newrow} /span 1/span 1`
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
            mino.style.gridArea = `${col + 1} / ${row + 1} /span 1/span 1`
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

// to get ccw multiply cw by -1 for each value eg. [-1, 0] -> [1, 0]
// index 0 is for all pieces except i,o; index 1 is for i piece
const KickDataCW = [[
    [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], // 4 -> 1 -> 4
    [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 1 -> 2 -> 1
    [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], // 2 -> 3 -> 2
    [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]] // 3 -> 4 -> 3
],
[
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
],
[
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]], // 3 -> 1
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]], // 4 -> 2
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]], // 1 -> 3
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]], // 2 -> 4
]];

main();