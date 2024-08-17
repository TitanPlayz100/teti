// @ts-check

import { cleartypes, scoringTable } from "./data.js";
import { Game } from "./game.js";

export class Mechanics {
    garbRowsLeft;
    isTspin;
    isMini;
    combonumber;
    btbCount;
    maxCombo;
    totalAttack;
    spikeCounter;
    totalLines;
    totalScore;
    garbageQueue;
    lockCount;
    totalSentLines;
    totalPieceCount;
    board;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;
    }

    clearLines() {
        const rows = this.board.getMinos('S').map(coord => coord[1])
            .reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});
        const clearRows = Object.keys(rows).filter((key) => rows[key] >= 10)
            .map(row => +row).toReversed();
        let removedGarbage = 0;
        for (let row of clearRows) {
            const stopped = this.board.getMinos('S');
            if (stopped.filter(c => c[1] == row).some(c => this.board.checkMino(c, 'G'))) removedGarbage++;
            stopped.filter(c => c[1] == row).forEach(([x, y]) => this.board.setCoordEmpty([x, y]));
            this.board.moveMinos(stopped.filter(c => c[1] > row), "DOWN", 1)
        }
        if (this.garbRowsLeft > 10 && this.game.gameSettings.gamemode == 4) this.addGarbage(removedGarbage);

        this.garbRowsLeft -= removedGarbage;
        const linecount = clearRows.length;
        const isBTB = ((this.isTspin || this.isMini || linecount == 4) && linecount > 0);
        const isPC = this.board.getMinos('S').length == 0;
        const damagetype = (this.isTspin ? 'Tspin ' : '') + (this.isMini ? 'mini ' : '') + cleartypes[linecount];
        this.btbCount = isBTB ? this.btbCount + 1 : (linecount != 0) ? - 1 : this.btbCount;
        if (linecount == 0) this.maxCombo = this.combonumber;
        this.combonumber = linecount == 0 ? -1 : this.combonumber + 1;
        const damage = this.calcDamage(this.combonumber, damagetype.toUpperCase().trim(), isPC, this.btbCount, isBTB);
        this.totalScore += this.calcScore(damagetype, isPC, isBTB, this.combonumber);
        this.totalLines += linecount; this.totalAttack += damage; this.spikeCounter += damage;
        const garb = damage * this.game.gameSettings.backfireMulti;
        this.garbageQueue = this.garbageQueue == 0 ? garb : this.garbageQueue > garb ? this.garbageQueue - garb : 0;
        if (this.game.gameSettings.gamemode == 6 && garb > 0) playSound(garb > 4 ? 'garbage_in_large' : 'garbage_in_small');
        if (this.game.gameSettings.gamemode == 6 && this.combonumber == -1 && this.garbageQueue > 0) {
            this.addGarbage(this.garbageQueue, 0);
            this.garbageQueue = 0;
            this.game.progressDamage.value = 0;
        }
        if (damage > 0 && this.game.gameSettings.gamemode == 6) this.game.progressDamage.value = this.garbageQueue;
        this.game.rendering.renderActionText(damagetype, isBTB, isPC, damage, linecount)
    }

    calcDamage(combo, type, isPC, btb, isBTB) {
        const btbdamage = () => {
            const x = Math.log1p(btb * 0.8);
            return ~~(Math.floor(x + 1) + (1 + (x % 1)) / 3);
        }
        return this.game.attackValues[type][combo > 20 ? 20 : combo < 0 ? 0 : combo]
            + (isPC ? this.game.attackValues['ALL CLEAR'] : 0)
            + (isBTB && btb > 0 ? btbdamage() : 0);
    }

    calcScore(type, ispc, isbtb, combo) {
        return scoringTable[type.toUpperCase().trim()]
            + (ispc ? scoringTable['ALL CLEAR'] : 0)
            + (combo > 0 ? 50 * combo : 0)
            * (isbtb ? 1.5 : 1);
    }

    incrementLock() {
        if (this.game.timeouts['lockdelay'] != 0) {
            this.clearLockDelay(false);
            this.lockCount++;
            if (this.game.gameSettings.maxLockMovements != 0 && this.game.displaySettings.lockBar) {
                const amountToAdd = 100 / this.game.gameSettings.maxLockMovements;
                this.game.divLockCounter.value += amountToAdd;
            }
        }
        if (this.game.movement.checkCollision(this.board.getMinos('A'), 'DOWN')) this.scheduleLock();
    }

    scheduleLock() {
        const LockMoves = this.game.gameSettings.maxLockMovements == 0 ? 99999 : this.game.gameSettings.maxLockMovements;
        if (this.lockCount >= LockMoves) { this.lockPiece(); return; }
        if (this.game.gameSettings.lockDelay == 0) { this.game.timeouts['lockdelay'] = -1; return; }
        this.game.timeouts['lockdelay'] = setTimeout(() => this.lockPiece(), this.game.gameSettings.lockDelay);
        this.game.timeouts['lockingTimer'] = setInterval(() => {
            const amountToAdd = 1000 / this.game.gameSettings.lockDelay
            if (this.game.displaySettings.lockBar) this.game.divLockTimer.value += amountToAdd;
        }, 10);
    }

    lockPiece() {
        this.board.getMinos('A').forEach(c => { this.board.rmValue(c, 'A'); this.board.addValFront(c, 'S') });
        this.endGame(this.checkDeath(this.board.getMinos('S'), this.board.getMinos('NP')));
        this.clearLockDelay(); clearInterval(this.game.timeouts['gravity']); this.clearLines();
        this.totalPieceCount++;
        this.game.holdPiece.occured = false; this.isTspin = false; this.isMini = false; movedPieceFirst = false;
        this.spawnPiece(this.randomiser());
        this.startGravity();
        renderDanger();
    }

    clearLockDelay(clearCount = true) {
        clearInterval(this.game.timeouts['lockingTimer']);
        stopTimeout('lockdelay');
        divLockTimer.value = 0;
        if (!clearCount) return;
        this.game.divLockCounter.value = 0;
        this.lockCount = 0;
        if (this.game.gameSettings.preserveARR) return;
        directionState = { 'RIGHT': false, 'LEFT': false, 'DOWN': false }
        endDasArr('RIGHT'); endDasArr('LEFT'); endDasArr('DOWN');
    }

    checkDeath(coords, collider) {
        const collision = coords.every(c => this.game.movement.checkCollision([c], 'PLACE', []));
        const collision2 = this.game.movement.checkCollision(coords, 'SPAWN', collider)
        const isGarbage = collider.some(c => this.board.checkMino(c, 'G'))
        if (collision && this.game.gameSettings.allowLockout) return 'Lockout';
        if (collision2 && isGarbage) return 'Topout';
        if (collision2) return 'Blockout';
    }

    randomiser() {
        if (this.game.nextPieces[1].length == 0) this.shuffleRemainingPieces();
        if (this.game.nextPieces[0].length == 0) {
            this.game.nextPieces = [this.game.nextPieces[1], []];
            this.shuffleRemainingPieces();
        }
        const piece = this.game.nextPieces[0].splice(0, 1);
        return this.game.pieces.filter((element) => { return element.name == piece })[0];
    }

    shuffleRemainingPieces() {
        this.game.pieces.forEach((piece) => this.game.nextPieces[1].push(piece.name))
        this.game.nextPieces[1] = this.game.nextPieces[1].map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort).map(({ value }) => value);
    }

    spawnPiece(piece, start = false) {
        if (gameEnd) return;
        const dx = (piece.name == 'o') ? 4 : 3
        const dy = (piece.name == 'o') ? 21 : (piece.name == 'i') ? 19 : 20
        this.board.addMinos('A ' + piece.name, this.board.pieceToCoords(piece.shape1), [dx, dy])
        currentLoc = [dx, dy]; rotationState = 1; currentPiece = piece;
        this.spawnOverlay(); this.updateNext(); this.updateHold(); this.displayShadow();
        const rows = this.game.gameSettings.requiredGarbage < 10 ? this.game.gameSettings.requiredGarbage : 10
        if (this.garbRowsLeft > 0 && start && this.game.gameSettings.gamemode == 4) this.addGarbage(rows);
        if (this.game.gameSettings.gamemode == 7) this.board.setComboBoard(start);
        if (this.game.gameSettings.preserveARR) startArr('current');
    }

    spawnOverlay() {
        this.board.MinoToNone('NP')
        const next = this.game.pieces.filter(p => p.name == this.game.nextPieces[0].concat(this.game.nextPieces[1])[0])[0]
        const x = (next.name == 'o') ? 4 : 3
        const y = (next.name == 'o') ? 21 : (next.name == 'i') ? 19 : 20
        this.board.pieceToCoords(next.shape1, [x, y]).forEach((c) => this.board.addValue(c, 'NP'))
    }

    displayShadow() {
        this.board.MinoToNone('Sh')
        const coords = this.board.getMinos('A');
        if (coords.length == 0) return;
        coords.forEach(([x, y]) => this.board.addValue([x, y], 'Sh'))
        let count = 0;
        const shadow = this.board.getMinos('Sh')
        while (!this.game.movement.checkCollision(shadow.map(c => [c[0], c[1] - count]), "DOWN")) count++;
        this.board.moveMinos(shadow, "DOWN", count, 'Sh');
    }

    startGravity() {
        if (this.game.movement.checkCollision(this.board.getMinos('A'), 'DOWN')) this.incrementLock();
        if (this.game.gameSettings.gravitySpeed > 1000) return;
        if (this.game.gameSettings.gravitySpeed == 0) { this.game.movement.movePieceDown(true); return; }
        this.game.movement.movePieceDown(false);
        this.game.timeouts['gravity'] = setInterval(() => this.game.movement.movePieceDown(false), this.game.gameSettings.gravitySpeed);
    }

    addGarbage(lines, messiness = 100) {
        let randCol = Math.floor(Math.random() * 10);
        for (let i = 0; i < lines; i++) {
            if (this.game.movement.checkCollision(this.board.getMinos('A'), 'DOWN')) {
                if (this.game.timeouts['lockdelay'] == 0) this.incrementLock();
                this.board.moveMinos(this.board.getMinos('A'), 'UP', 1);
            };
            this.board.moveMinos(this.board.getMinos('S'), 'UP', 1)
            const mustchange = Math.floor(Math.random() * 100);
            if (mustchange < messiness) randCol = Math.floor(Math.random() * 10);
            for (let col = 0; col < 10; col++) {
                if (col != randCol) this.board.addMinos('S G', [[col, 0]], [0, 0]);
            }
        }
        this.displayShadow();
        this.totalSentLines += lines;
    }

    switchHold() {
        if (this.game.holdPiece.occured) return;
        this.clearLockDelay(); this.board.MinoToNone('A'); this.isTspin = false; this.isMini = false;
        if (this.game.holdPiece.piece == null) {
            this.game.holdPiece.piece = currentPiece;
            this.spawnPiece(this.randomiser());
        } else {
            [this.game.holdPiece.piece, currentPiece] = [currentPiece, this.game.holdPiece.piece]
            this.spawnPiece(currentPiece);
        }
        if (this.checkDeath(this.board.getMinos('A'), this.board.getMinos('S')) == 'Blockout') { this.endGame('Blockout'); return }
        if (!this.game.gameSettings.infiniteHold) this.game.holdPiece.occured = true;
        playSound('hold'); renderDanger();
        clearInterval(this.game.timeouts['gravity']); this.startGravity();
        this.updateHold();
    }


}