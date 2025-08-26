/**
 * TetrisAI Wrapper for Teti Integration
 * Provides a simplified AI interface that can work with the Teti game state
 */

export class TetrisAI {
    constructor() {
        this.isActive = false;
        this.worker = null;
        this.currentGameState = null;
        this.lastSuggestion = null;
        this.moveQueue = [];
        this.isCalculating = false;
        this.lastUpdateTime = 0;
        this.updateThrottle = 200; // Minimum ms between AI updates
        
        // Simple move types
        this.MOVES = {
            LEFT: 'left',
            RIGHT: 'right',
            ROTATE_CW: 'cw',
            ROTATE_CCW: 'ccw',
            ROTATE_180: '180',
            SOFT_DROP: 'sd',
            HARD_DROP: 'hd',
            HOLD: 'hold'
        };
    }

    /**
     * Initialize the AI system
     */
    async init() {
        try {
            // Try to load the WebAssembly AI if available
            if (this.checkWebAssemblySupport()) {
                await this.initWebAssemblyAI();
            } else {
                // Fallback to simple heuristic AI
                this.initSimpleAI();
            }
            return true;
        } catch (error) {
            console.warn('Failed to initialize advanced AI, using simple heuristics:', error);
            this.initSimpleAI();
            return true;
        }
    }

    /**
     * Check if WebAssembly and the AI files are available
     */
    checkWebAssemblySupport() {
        return typeof WebAssembly !== 'undefined' && 
               this.checkAIFilesExist();
    }

    /**
     * Check if the AI files exist
     */
    checkAIFilesExist() {
        // For now, return false since we don't have the compiled files
        // This would check for misamino.js and misamino.wasm
        return false;
    }

    /**
     * Initialize WebAssembly AI (when available)
     */
    async initWebAssemblyAI() {
        // This would load the actual MisaMinoTBP WebAssembly AI
        // For now, this is a placeholder
        throw new Error('WebAssembly AI not available');
    }

    /**
     * Initialize simple heuristic AI
     */
    initSimpleAI() {
        console.log('Using simple heuristic AI');
        // Simple AI is ready immediately
    }

    /**
     * Start the AI for the current game
     */
    start() {
        this.isActive = true;
        this.moveQueue = [];
        console.log('Tetris AI started');
    }

    /**
     * Stop the AI
     */
    stop() {
        this.isActive = false;
        this.moveQueue = [];
        this.isCalculating = false;
        console.log('Tetris AI stopped');
    }

    /**
     * Toggle AI on/off
     */
    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
        return this.isActive;
    }

    /**
     * Update game state and get AI suggestion
     */
    async updateGameState(gameState) {
        if (!this.isActive) return null;

        // Throttle AI updates for performance
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateThrottle) {
            return this.lastSuggestion;
        }

        this.currentGameState = gameState;
        
        if (this.isCalculating) {
            return this.lastSuggestion;
        }

        this.lastUpdateTime = now;

        try {
            this.isCalculating = true;
            const suggestion = await this.calculateMove(gameState);
            this.lastSuggestion = suggestion;
            return suggestion;
        } catch (error) {
            console.error('AI calculation error:', error);
            return null;
        } finally {
            this.isCalculating = false;
        }
    }

    /**
     * Calculate the best move for the current game state
     */
    async calculateMove(gameState) {
        // Extract relevant game information
        const board = this.convertBoard(gameState.board);
        const currentPiece = gameState.falling;
        const nextPieces = gameState.next;
        const holdPiece = gameState.hold;

        // Simple heuristic AI logic
        return this.simpleHeuristicMove(board, currentPiece, nextPieces, holdPiece);
    }

    /**
     * Convert Teti board format to AI format
     */
    convertBoard(tetiBoard) {
        // Convert the Teti board representation to a format the AI can understand
        const board = [];
        for (let y = 0; y < 40; y++) {
            const row = [];
            for (let x = 0; x < 10; x++) {
                if (tetiBoard.board && tetiBoard.board[y] && tetiBoard.board[y][x]) {
                    row.push(tetiBoard.board[y][x].type || 'filled');
                } else {
                    row.push(null);
                }
            }
            board.push(row);
        }
        return board;
    }

    /**
     * Simple heuristic AI that makes basic decisions
     */
    simpleHeuristicMove(board, currentPiece, nextPieces, holdPiece) {
        if (!currentPiece) return null;

        // Better heuristic: analyze board and make smarter decisions
        const analysis = this.analyzeBoard(board);
        const bestMove = this.findBestPlacement(board, currentPiece, analysis);

        return {
            type: 'suggestion',
            moves: bestMove ? [bestMove] : [],
            analysis: analysis
        };
    }

    /**
     * Analyze the board to understand current state
     */
    analyzeBoard(board) {
        let totalHeight = 0;
        let holes = 0;
        let completableLines = 0;
        let bumpiness = 0;
        const columnHeights = [];

        // Calculate column heights and find holes
        for (let x = 0; x < 10; x++) {
            let height = 0;
            let foundBlock = false;
            
            for (let y = 39; y >= 0; y--) {
                if (board[y] && board[y][x]) {
                    if (!foundBlock) {
                        height = 40 - y;
                        foundBlock = true;
                    }
                } else if (foundBlock) {
                    holes++;
                }
            }
            
            columnHeights.push(height);
            totalHeight += height;
        }

        // Calculate bumpiness (height differences between adjacent columns)
        for (let x = 0; x < 9; x++) {
            bumpiness += Math.abs(columnHeights[x] - columnHeights[x + 1]);
        }

        // Check for completable lines
        for (let y = 0; y < 40; y++) {
            if (board[y]) {
                let filledCells = 0;
                for (let x = 0; x < 10; x++) {
                    if (board[y][x]) filledCells++;
                }
                if (filledCells >= 8) completableLines++;
            }
        }

        return {
            totalHeight,
            holes,
            completableLines,
            bumpiness,
            columnHeights,
            averageHeight: totalHeight / 10
        };
    }

    /**
     * Find the best placement for the current piece
     */
    findBestPlacement(board, piece, analysis) {
        const pieceName = piece.type || piece.name || 'T';
        const rotations = this.getPieceRotations(pieceName);
        let bestScore = -Infinity;
        let bestMove = null;

        // Try each rotation and position
        for (let rotation = 0; rotation < rotations.length; rotation++) {
            const shape = rotations[rotation];
            
            for (let x = 0; x < 10; x++) {
                const placement = this.simulatePlacement(board, shape, x, rotation);
                if (placement.valid) {
                    const score = this.scorePlacement(placement, analysis);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = {
                            location: {
                                type: pieceName,
                                x: x,
                                y: placement.finalY,
                                orientation: this.getOrientationName(rotation)
                            },
                            spin: 'none',
                            score: score
                        };
                    }
                }
            }
        }

        return bestMove;
    }

    /**
     * Get piece rotations (simplified shapes)
     */
    getPieceRotations(pieceName) {
        // Simplified piece shapes for different rotations
        const pieces = {
            'T': [
                [[0,1], [-1,0], [0,0], [1,0]],  // north
                [[0,0], [0,-1], [0,1], [1,0]],  // east
                [[0,-1], [-1,0], [0,0], [1,0]], // south
                [[0,0], [0,-1], [0,1], [-1,0]]  // west
            ],
            'I': [
                [[-1,0], [0,0], [1,0], [2,0]],  // horizontal
                [[0,-1], [0,0], [0,1], [0,2]]   // vertical
            ],
            'O': [
                [[0,0], [1,0], [0,1], [1,1]]    // square (no rotation)
            ],
            'L': [
                [[-1,0], [0,0], [1,0], [1,1]],  // north
                [[0,-1], [0,0], [0,1], [1,-1]], // east
                [[-1,-1], [-1,0], [0,0], [1,0]], // south
                [[-1,1], [0,-1], [0,0], [0,1]]  // west
            ],
            'J': [
                [[-1,0], [0,0], [1,0], [-1,1]], // north
                [[0,-1], [0,0], [0,1], [1,1]],  // east
                [[1,-1], [-1,0], [0,0], [1,0]], // south
                [[-1,-1], [0,-1], [0,0], [0,1]] // west
            ],
            'S': [
                [[-1,0], [0,0], [0,1], [1,1]],  // horizontal
                [[0,0], [0,1], [1,-1], [1,0]]   // vertical
            ],
            'Z': [
                [[-1,1], [0,1], [0,0], [1,0]],  // horizontal
                [[0,-1], [0,0], [1,0], [1,1]]   // vertical
            ]
        };

        return pieces[pieceName] || pieces['T'];
    }

    /**
     * Simulate placing a piece at a position
     */
    simulatePlacement(board, shape, startX, rotation) {
        let finalY = 39;
        
        // Find where the piece would land
        for (let y = 39; y >= 0; y--) {
            let canPlace = true;
            for (const [dx, dy] of shape) {
                const x = startX + dx;
                const newY = y + dy;
                
                if (x < 0 || x >= 10 || newY < 0) {
                    canPlace = false;
                    break;
                }
                
                if (newY < 40 && board[newY] && board[newY][x]) {
                    canPlace = false;
                    break;
                }
            }
            
            if (canPlace) {
                finalY = y;
            } else {
                break;
            }
        }

        return {
            valid: finalY <= 39,
            finalY: finalY,
            rotation: rotation
        };
    }

    /**
     * Score a placement based on heuristics
     */
    scorePlacement(placement, analysis) {
        let score = 0;
        
        // Prefer lower placements
        score += (40 - placement.finalY) * 10;
        
        // Prefer placements that complete lines
        score += analysis.completableLines * 100;
        
        // Penalize creating holes
        score -= analysis.holes * 50;
        
        // Penalize high stacks
        score -= analysis.totalHeight * 2;
        
        // Penalize bumpiness
        score -= analysis.bumpiness * 5;
        
        return score;
    }

    /**
     * Convert rotation number to orientation name
     */
    getOrientationName(rotation) {
        const orientations = ['north', 'east', 'south', 'west'];
        return orientations[rotation % 4];
    }

    /**
     * Generate possible moves for the current piece
     */
    generatePossibleMoves(board, piece) {
        const moves = [];
        
        // For simplicity, generate a few basic moves
        // In a real implementation, this would test all possible rotations and positions
        
        // Try moving left/right and rotating
        const basicMoves = [
            { action: this.MOVES.LEFT, priority: 5 },
            { action: this.MOVES.RIGHT, priority: 5 },
            { action: this.MOVES.ROTATE_CW, priority: 7 },
            { action: this.MOVES.ROTATE_CCW, priority: 6 },
            { action: this.MOVES.HARD_DROP, priority: 10 }
        ];

        return basicMoves;
    }

    /**
     * Evaluate moves and return the best one
     */
    evaluateMoves(moves, board) {
        if (moves.length === 0) return null;

        // Simple evaluation: prefer hard drop for now
        const hardDropMove = moves.find(move => move.action === this.MOVES.HARD_DROP);
        if (hardDropMove) {
            return {
                location: {
                    type: this.currentGameState?.falling?.type || 'T',
                    x: this.currentGameState?.falling?.x || 4,
                    y: this.currentGameState?.falling?.y || 0,
                    orientation: this.currentGameState?.falling?.rotation || 'north'
                },
                spin: 'none'
            };
        }

        // Return a random valid move
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        return {
            location: {
                type: this.currentGameState?.falling?.type || 'T',
                x: this.currentGameState?.falling?.x || 4,
                y: this.currentGameState?.falling?.y || 0,
                orientation: this.currentGameState?.falling?.rotation || 'north'
            },
            spin: 'none'
        };
    }

    /**
     * Get the next move from the AI
     */
    getNextMove() {
        if (this.moveQueue.length > 0) {
            return this.moveQueue.shift();
        }
        return null;
    }

    /**
     * Execute AI move in the game
     */
    executeMove(move) {
        if (!move || !this.isActive) return false;

        // Convert AI move to game input
        // This will be called by the game integration
        return true;
    }
}

// Export singleton instance
export const tetrisAI = new TetrisAI();