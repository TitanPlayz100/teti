//@ts-check

import { Game } from "../game.js";

export class Versions {
    /**
     * @type {string[]}
     */
    // stores every game state existing indexed
    historyStates = [];
    /**
     * @type {Number[][]}
     */
    // stores connections by assigning index as the node, and the value as an array of every connection to other nodes
    historyConnections = [];
    currentState = 0;
    redoMostRecentBranch = false;


    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    storeData() {
        const map = this.convertToMapCompressed();
        this.pushHistory(map);
    }

    getData() {
        return this.historyStates[this.currentState]
    }

    pushHistory(map) {
        this.historyStates.push(map);
        const prevState = this.currentState;
        this.currentState = this.historyStates.length - 1;
        if (this.currentState == 0) return;

        if (this.historyConnections[prevState] == null) this.historyConnections[prevState] = [];
        this.historyConnections[prevState].push(this.currentState);
    }

    gotoState(num) {
        this.currentState = num;
        this.getData();
    }

    undo() {
        if (this.currentState == 0) return;
        this.historyConnections.forEach((next, ind) => {
            if (next.includes(this.currentState)) {
                this.currentState = ind;
            }
        })
    }

    redo() {
        const connection = this.historyConnections[this.currentState];
        if (connection == undefined) return;
        const next = this.redoMostRecentBranch ? Math.max(...connection) : Math.min(...connection);
        this.currentState = next;
    }

    clearFuture(node) {
        const futureNodes = this.historyConnections[node];
        if (futureNodes != undefined) {
            futureNodes.forEach(node => this.clearFuture(node))
        }
        this.historyStates[node] = undefined;
        this.historyConnections[node] = undefined;
    }

    testing() {
        // 0
        this.storeData();
        this.game.board.boardState[0][0] = 'S G'; // 1
        this.storeData();
        this.game.board.boardState[0][0] = 'S t'; // 2
        this.storeData();
        this.game.board.boardState[0][0] = 'S o'; // 3a
        this.storeData();
        this.game.board.boardState[0][0] = 'S l'; // 4a
        this.storeData();
        this.gotoState(2); // back to 2
        this.game.board.boardState[0][0] = 'S i'; // 3b
        this.storeData();
        this.game.board.boardState[0][0] = 'S z'; // 4b
        this.storeData();
        this.undo(); // back to 3b
        this.undo(); // back to 2
        this.redo(); // forward to 3a
        this.redo(); // forward to 4a
        this.redo(); // does nothing (no more redos)
        this.gotoState(1);
        this.clearFuture(2);
        console.log(this.historyStates);
        console.log(this.historyConnections);
        console.log(this.historyStates[this.currentState]);
    }

    compress(s) {
        let cs = "";
        let count = 1;
        for (let i = 1; i < s.length; i++) {
            if (s[i] == s[i - 1]) {
                count++;
            } else {
                cs += `${count}${s[i - 1]}`;
                count = 1;
            }
        }
        cs += `${count}${s[s.length - 1]}`;
        return cs;
    }

    decompress(s) {
        let ds = "";
        let int = '';
        for (let i = 0; i < s.length; i++) {
            if (!isNaN(parseInt(s[i]))) {
                int += s[i];
                continue;
            }
            const count = parseInt(int);
            const char = s[i];
            ds += char.repeat(count);
            int = '';
        }
        return ds;
    }

    convertToMapCompressed() {
        const board = this.game.board.boardState;
        const next = this.game.bag.nextPieces;
        const hold = this.game.hold.piece == null ? "" : this.game.hold.piece.name;
        const currPiece = this.game.falling.piece.name;
        let boardstring = board.toReversed().flatMap(row => {
            return row.map(col => {
                col = col.replace("Sh", "").replace("NP", "").replace("G", "#");
                if (col.length == 1) col = ""
                if (col[0] == "A") col = "";
                if (col[0] == "S") col = col[2];
                if (col.trim() == "") col = "_";
                return col;
            })
        }).join("")
        return `${this.compress(boardstring)}?${currPiece},${next.flat()}?${hold}`

    }

    convertFromMapCompressed(string) {
        let [board, next, hold] = string.split("?");
        board = this.decompress(board);
        board = board.match(/.{1,10}/g).toReversed().map(row => {
            return row.split("").map(col => {
                col = col.replace("#", "G").replace("_", "")
                if (col != "") col = `S ${col}`
                return col
            });
        })
        return { board, next, hold }
    }

}