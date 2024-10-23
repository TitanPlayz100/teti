import { Game } from "../game.js";

export class History {
    /**
     * stores every game state indexed
     * @type {string[]}
     */
    historyStates = [];
    /**
     * stores connections by assigning index as the node, and the value as an array of every connection to other nodes
     * @type {Number[][]}
     */
    historyConnections = [];
    currentState = 0;
    selectedbranch = 0;

    historyelement = document.getElementById("history");
    choiceselement = document.getElementById("redochoices");

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    save() {
        if (!this.game.settings.game.history) return;
        const map = this.convertToMapCompressed();
        this.pushHistory(map);
        this.updateUI();
    }

    pushHistory(map) {
        this.historyStates.push(map);
        const prevState = this.currentState;
        this.currentState = this.historyStates.length - 1;
        if (this.currentState == 0) return;

        if (this.historyConnections[prevState] == null) this.historyConnections[prevState] = [];
        this.historyConnections[prevState].push(this.currentState);
    }

    load() {
        const state = this.historyStates[this.currentState]
        this.convertFromMapCompressed(state);
        this.updateUI()
    }

    undo() {
        if (this.currentState == 0 || !this.game.settings.game.history) return;
        this.historyConnections.forEach((next, ind) => {
            if (next.includes(this.currentState)) {
                this.currentState = ind;
            }
        })
        this.game.sounds.playSound("undo");
        this.game.boardeffects.move(-1, 0);
        this.load()
    }

    redo() {
        if (!this.game.settings.game.history) return;
        const connection = this.historyConnections[this.currentState];
        if (connection == undefined) return;
        this.currentState = this.selectedbranch || Math.max(...connection);
        this.game.sounds.playSound("redo");
        this.game.boardeffects.move(1, 0);
        this.load()
    }

    goto(num) {
        this.currentState = num;
        this.load();
    }

    clearFuture(node) {
        const futureNodes = this.historyConnections[node];
        if (futureNodes != undefined) {
            futureNodes.forEach(node => this.clearFuture(node))
        }
        this.historyStates[node] = undefined;
        this.historyConnections[node] = undefined;
    }

    updateUI() {
        const branches = this.historyConnections[this.currentState] ?? [];
        this.selectedbranch = Math.max(...branches);
        this.historyelement.textContent = `history: ${this.currentState}`;
        if (branches.length <= 1) {
            this.choiceselement.style.opacity = "0";
            this.choiceselement.style.pointerEvents = "none";
            this.selectedbranch = 0;
            return;
        }

        this.choiceselement.style.opacity = "1";
        this.choiceselement.style.pointerEvents = "all";
        [...this.choiceselement.children].forEach(button => button.remove())
        branches.forEach(state => {
            const button = document.createElement("button");
            button.classList.add("redochoice");
            if (state == this.selectedbranch) button.classList.add("selected");
            button.textContent = state.toString();
            button.onclick = () => this.setSelected(state, button);
            this.choiceselement.appendChild(button)
        })
    }

    setSelected(state, button) {
        this.selectedbranch = state;
        [...this.choiceselement.children].forEach(el => {
            el.classList.remove("selected");
        })
        button.classList.add("selected");
    }

    compress(s) {
        // saves anywhere from 50% worst case to 90% on average
        // 250 blocks is 30kB ~~ 5 min of 3.3pps play is 120kB
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
        const currPiece = this.game.falling.piece == null ? "" : this.game.falling.piece.name;
        let boardstring = board.toReversed().flatMap(row => {
            return row.map(col => {
                col = col.replace("Sh", "").replace("NP", "").replace("G", "#");
                col = col.trim();
                if (col.length == 1) col = ""
                if (col[0] == "A") col = "";
                if (col[0] == "S") col = col[2];
                if (col == "") col = "_";
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
        this.game.board.boardState = board;
        this.game.bag.nextPieces = [next.split(","), []];
        this.game.hold.piece = this.game.renderer.getPiece(hold);
        this.game.mechanics.spawnPiece(this.game.bag.randomiser());
    }

    setHistoryDiv(bool) {
        this.historyelement.style.display = bool ? "block" : "none";
    }

}