# 🐛 AI調試指南

## 🎯 問題：AI按鈕可以點擊但不操作方塊

### 📋 調試步驟

#### 1. **確認遊戲模式**
- ✅ 必須在 "**Zen / Custom**" 模式
- ❌ 不是在 "Climb" 或其他模式

#### 2. **檢查瀏覽器控制台**
請用手機瀏覽器打開開發者工具：

**Chrome手機版：**
1. 在地址欄輸入：`chrome://inspect`
2. 或使用桌面Chrome連接手機調試

**Safari手機版：**
1. 設定 → Safari → 進階 → 網頁檢閱器
2. 在Mac上用Safari連接調試

#### 3. **預期的控制台訊息**

當你點擊AI按鈕時，應該看到：

```
🤖 Tetris AI started - isActive: true
```

當AI嘗試更新時，應該看到：
```
🎮 AI updating with game state: {hasFallingPiece: true, pieceType: "T", position: {x: 4, y: 0}}
🧠 AI calculating move for piece: T
🎲 AI simple suggestion: {type: "suggestion", moves: [...]}
🎯 AI suggestion: {...}
🎮 AI executing move: {...}
🔽 AI executing hard drop with key: Space
✅ AI hard drop executed
```

#### 4. **可能的錯誤訊息**

**如果看到：**
```
🚫 AI update skipped: {aiActive: false, gameStarted: true, gameEnded: false}
```
→ AI沒有正確啟動

**如果看到：**
```
⏸️ AI waiting: No falling piece
```
→ 遊戲中沒有下落的方塊

**如果看到：**
```
❌ AI could not execute hard drop - missing key or controls
```
→ 按鍵設定問題

## 🔧 **快速修復方案**

### 方案1：強制AI立即執行
如果你看到AI有建議但沒有執行，可以在控制台手動測試：

```javascript
// 檢查AI狀態
console.log('AI Active:', Game.tetrisAI.isActive);

// 手動觸發AI
Game.updateAI();

// 手動執行硬降
Game.controls.handleKeyDown({code: 'Space'});
```

### 方案2：檢查遊戲狀態
```javascript
// 檢查當前遊戲模式
console.log('Game mode:', Game.settings.game.gamemode);

// 檢查是否有下落方塊
console.log('Falling piece:', Game.falling);

// 檢查遊戲是否開始
console.log('Game started:', Game.started);
```

### 方案3：重新啟動AI
```javascript
// 重新初始化AI
Game.tetrisAI.stop();
Game.tetrisAI.start();
```

## 🎮 **測試步驟**

1. **開啟遊戲**
2. **選擇Zen模式** (不是Climb!)
3. **開始遊戲** - 等待方塊開始下落
4. **點擊AI按鈕** - 確認變紅色
5. **檢查控制台** - 查看調試訊息
6. **觀察方塊** - 應該自動hard drop

## 📱 **手機調試技巧**

### 方法1：使用桌面瀏覽器
1. 在桌面瀏覽器開啟相同網址
2. 開啟開發者工具 (F12)
3. 切換到手機模擬模式
4. 測試AI功能

### 方法2：使用簡化版日誌
如果無法查看控制台，我可以讓AI在遊戲畫面上顯示狀態：

```javascript
// 在遊戲中顯示AI狀態
Game.renderer.renderTimeLeft("AI: " + (Game.tetrisAI.isActive ? "ON" : "OFF"));
```

## 🚨 **常見問題**

### 問題1: AI按鈕不變色
- **原因**: JavaScript錯誤
- **解決**: 檢查控制台錯誤訊息

### 問題2: AI啟動但不操作
- **原因**: 沒有進入zen模式
- **解決**: 確認選擇"Zen / Custom"

### 問題3: AI只執行一次
- **原因**: 重力循環沒有正確調用AI
- **解決**: 檢查遊戲是否正在運行

### 問題4: 控制台沒有訊息
- **原因**: 開發者工具沒有正確開啟
- **解決**: 使用桌面版測試

## 📊 **下一步**

請告訴我你在控制台看到什麼訊息，我可以根據具體的錯誤訊息進一步調試和修復！