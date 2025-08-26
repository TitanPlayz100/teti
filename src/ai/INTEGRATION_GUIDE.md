# MisaMinoTBP 與 Teti 整合技術說明

## 1. 整合架構概述

```
Teti Game Loop
      ↓
  updateAI() 每個重力週期
      ↓
 收集遊戲狀態 (gameState)
      ↓
tetrisAI.updateGameState(gameState)
      ↓
   格式轉換 (Teti → TBP)
      ↓
    AI計算建議
      ↓
   格式轉換 (TBP → Teti)
      ↓
  executeAIMove(move)
      ↓
  轉換為按鍵序列
      ↓
   執行遊戲動作
```

## 2. 數據格式轉換詳解

### 2.1 Teti 遊戲狀態收集

```javascript
// 在 src/game.js 的 updateAI() 方法中
const gameState = {
    board: this.board,        // Teti 遊戲板面物件
    falling: this.falling,    // 當前下落方塊
    next: this.hold.nextQueue, // 下一個方塊序列
    hold: this.hold.piece,    // Hold區的方塊
    stats: this.stats         // 遊戲統計
};
```

### 2.2 MisaMinoTBP 期望的 TBP 協議格式

**開始訊息 (start):**
```json
{
    "type": "start",
    "hold": null,
    "queue": ["I","T","I","L","O","Z"],
    "combo": 0,
    "back_to_back": false,
    "board": [
        [null,null,null,null,null,null,null,null,null,null],
        // ... 40列 x 10行的二維陣列
        // null = 空格, "I"/"T"/"O"等 = 方塊類型
    ]
}
```

**請求建議 (suggest):**
```json
{
    "type": "suggest"
}
```

**AI回應格式:**
```json
{
    "type": "suggestion",
    "moves": [
        {
            "location": {
                "orientation": "east",  // north/east/south/west
                "type": "T",           // 方塊類型
                "x": 4,                // X座標 (0-9)
                "y": 18               // Y座標 (0-39)
            },
            "spin": "none"            // none/mini/full
        }
    ]
}
```

### 2.3 板面格式轉換實作

```javascript
// 在 tetris_ai_wrapper.js 中
convertBoard(tetiBoard) {
    const board = [];
    for (let y = 0; y < 40; y++) {
        const row = [];
        for (let x = 0; x < 10; x++) {
            if (tetiBoard.board && tetiBoard.board[y] && tetiBoard.board[y][x]) {
                // Teti 的方塊有 .type 屬性
                row.push(tetiBoard.board[y][x].type || 'filled');
            } else {
                // 空格用 null 表示
                row.push(null);
            }
        }
        board.push(row);
    }
    return board;
}
```

### 2.4 方塊資訊轉換

```javascript
// 將 Teti 的方塊格式轉換為 TBP 格式
function convertPieceToTBP(tetiPiece) {
    if (!tetiPiece) return null;
    
    return {
        type: tetiPiece.type || tetiPiece.name,  // "I", "T", "O", etc.
        x: tetiPiece.x,                          // 當前X座標
        y: tetiPiece.y,                          // 當前Y座標
        rotation: tetiPiece.rotation             // "north", "east", "south", "west"
    };
}
```

## 3. AI建議執行流程

### 3.1 接收 AI 建議

```javascript
// AI 返回的建議格式
const suggestion = {
    type: 'suggestion',
    moves: [{
        location: {
            type: 'T',
            x: 4,
            y: 18,
            orientation: 'east'
        },
        spin: 'none'
    }]
};
```

### 3.2 計算動作序列

```javascript
// 在 src/game.js 中
calculateMoveSequence(current, target) {
    const moves = [];
    
    // 1. 計算旋轉差異
    const rotationDiff = this.getRotationDifference(
        current.rotation, 
        target.orientation
    );
    
    // 2. 添加旋轉動作
    if (rotationDiff > 0) {
        for (let i = 0; i < rotationDiff; i++) {
            moves.push('cw');  // 順時針旋轉
        }
    } else if (rotationDiff < 0) {
        for (let i = 0; i < Math.abs(rotationDiff); i++) {
            moves.push('ccw'); // 逆時針旋轉
        }
    }
    
    // 3. 計算水平移動
    const horizontalDiff = target.x - current.x;
    if (horizontalDiff > 0) {
        for (let i = 0; i < horizontalDiff; i++) {
            moves.push('right');
        }
    } else if (horizontalDiff < 0) {
        for (let i = 0; i < Math.abs(horizontalDiff); i++) {
            moves.push('left');
        }
    }
    
    // 4. 硬降
    moves.push('hd');
    
    return moves;
}
```

### 3.3 按鍵對應轉換

```javascript
// 將動作類型轉換為 Teti 的按鍵碼
getMoveKeycode(move) {
    const keybinds = this.settings.keybinds;
    
    switch(move) {
        case 'left': return keybinds.left;    // 左移
        case 'right': return keybinds.right;  // 右移
        case 'cw': return keybinds.cw;        // 順時針旋轉
        case 'ccw': return keybinds.ccw;      // 逆時針旋轉
        case '180': return keybinds.rotate180; // 180度旋轉
        case 'sd': return keybinds.sd;        // 軟降
        case 'hd': return keybinds.hd;        // 硬降
        case 'hold': return keybinds.hold;    // Hold
        default: return null;
    }
}
```

### 3.4 時序控制執行

```javascript
// 按序列執行動作，有時間延遲
executeMoveSequence(moveSequence) {
    let currentIndex = 0;
    
    const executeNext = () => {
        if (currentIndex >= moveSequence.length || !this.tetrisAI.isActive) {
            return;
        }

        const move = moveSequence[currentIndex];
        const keycode = this.getMoveKeycode(move);
        
        if (keycode) {
            // 模擬按鍵事件
            this.controls.handleKeyDown({ code: keycode });
        }

        currentIndex++;
        
        // 50ms 延遲執行下一個動作
        if (currentIndex < moveSequence.length) {
            setTimeout(executeNext, 50);
        }
    };

    executeNext();
}
```

## 4. 整合時機控制

### 4.1 遊戲循環整合

```javascript
// 在 src/mechanics/mechanics.js 的重力計時器中
Game.gravityTimer = new TetiInterval(
    () => {
        Game.movement.movePieceDown(false);
        
        // AI 更新時機：每次重力下降時
        if (Game.tetrisAI && Game.tetrisAI.isActive && 
            Game.settings.game.gamemode === "custom") {
            Game.updateAI();  // 觸發 AI 更新
        }
    },
    Game.settings.game.gravitySpeed
);
```

### 4.2 性能節流

```javascript
// 在 tetris_ai_wrapper.js 中防止過度頻繁的 AI 計算
async updateGameState(gameState) {
    // 節流控制：最小 200ms 間隔
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateThrottle) {
        return this.lastSuggestion;
    }
    
    this.lastUpdateTime = now;
    // ... AI 計算邏輯
}
```

## 5. 啟用條件與UI控制

### 5.1 按鈕顯示控制

```javascript
// 在 src/features/modes.js 中
loadModes() {
    // 只在 zen (custom) 模式顯示 AI 按鈕
    const aiButton = document.getElementById("aiToggleButton");
    if (aiButton) {
        if (Game.settings.game.gamemode == 'custom') {
            aiButton.style.display = "block";
        } else {
            aiButton.style.display = "none";
        }
    }
}
```

### 5.2 狀態切換

```javascript
// AI 開關切換
toggleAI() {
    const isActive = this.tetrisAI.toggle();
    const button = document.getElementById('aiToggleButton');
    
    if (button) {
        if (isActive) {
            button.classList.add('ai-active');  // 綠色發光效果
            button.title = 'AI Active - Click to return to manual control';
        } else {
            button.classList.remove('ai-active');
            button.title = 'Toggle AI Control';
        }
    }
    
    // 顯示切換通知
    if (isActive) {
        this.renderer.renderTimeLeft("AI CONTROL ENABLED");
    } else {
        this.renderer.renderTimeLeft("MANUAL CONTROL");
    }
    
    return isActive;
}
```

## 6. 未來 WebAssembly 整合準備

目前實作使用啟發式AI作為替代方案，但架構已經準備好整合真正的 MisaMinoTBP WebAssembly：

```javascript
// 在 tetris_ai_wrapper.js 中預留的 WebAssembly 整合接口
async initWebAssemblyAI() {
    // 載入 WebAssembly AI 的預留實作
    // 當 misamino.js 和 misamino.wasm 可用時：
    
    this.worker = new Worker("/src/ai/build.emscripten/misaImport.js");
    
    this.worker.onmessage = (msg) => {
        const response = msg.data;
        if (response.type === "suggestion") {
            this.lastSuggestion = response;
        }
    };
    
    // 發送 TBP 協議訊息
    this.worker.postMessage({
        type: "start",
        hold: null,
        queue: this.convertNextQueue(gameState.next),
        combo: gameState.stats.combo || 0,
        back_to_back: gameState.stats.btb || false,
        board: this.convertBoard(gameState.board)
    });
}
```

這個整合架構提供了完整的數據流轉換和動作執行機制，既支援當前的啟發式AI，也為未來的 WebAssembly 整合做好了準備。