# MisaMinoTBP AI Integration for Teti

This directory contains the integration of MisaMinoTBP (Tetris Bot Protocol) into the Teti game.

## Features

- **AI Toggle Button**: Available in Zen mode (Zen/Custom gamemode)
- **Smart Heuristic AI**: Uses board analysis to make intelligent piece placements
- **Seamless Integration**: Toggle between AI control and manual play without interrupting the game
- **Visual Feedback**: Button changes appearance when AI is active

## How It Works

### AI Wrapper (`tetris_ai_wrapper.js`)
- Provides a unified interface for AI control
- Implements a heuristic-based AI as fallback
- Ready for WebAssembly integration when MisaMinoTBP is compiled

### Game Integration
- AI button appears only in Zen mode (custom gamemode)
- AI updates on each gravity tick when active
- Calculates optimal piece placements using board analysis
- Executes moves through the game's control system

## Usage

1. Start a game in Zen mode (Zen/Custom gamemode)
2. The AI toggle button appears in the top-right corner of the game board
3. Click the button to enable AI control
4. Click again to return to manual control

## AI Strategy

The current heuristic AI considers:
- **Height**: Prefers lower placements
- **Line Completion**: Prioritizes moves that complete lines
- **Holes**: Avoids creating holes in the board
- **Bumpiness**: Minimizes height variations between columns

## Future Enhancements

- Full MisaMinoTBP WebAssembly integration
- Multiple AI difficulty levels
- AI vs AI battles
- Learning capabilities

## Technical Details

### Board Analysis
The AI analyzes the board for:
- Column heights
- Hole count
- Completable lines
- Bumpiness metric

### Move Execution
1. Calculate target position for current piece
2. Generate move sequence (rotations + horizontal movement + drop)
3. Execute moves with timing delays
4. Repeat for next piece

### Integration Points
- `Game.updateAI()`: Called on gravity ticks when AI is active
- `Game.toggleAI()`: Toggles AI control and updates UI
- `Game.executeAIMove()`: Converts AI decisions to game controls

## Files

- `tetris_ai_wrapper.js`: Main AI interface and heuristic implementation
- `build.emscripten/`: MisaMinoTBP source files (for future WebAssembly build)
- Integration in `../game.js`: Game class extensions for AI control
- UI elements in `../../index.html`: AI toggle button
- Styling in `../../styles/style.css`: AI button appearance

## Dependencies

- ES6 Modules support
- Teti game framework
- (Optional) Emscripten for WebAssembly build

