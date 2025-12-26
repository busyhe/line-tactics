import { BoardState, Player, Point, BOARD_SIZE } from '../types';

/**
 * Creates the initial board state.
 * Red on top row, Blue on bottom row.
 */
export const createInitialBoard = (): BoardState => {
  const board: BoardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  
  // Place Red pieces (Top Row)
  for (let c = 0; c < BOARD_SIZE; c++) {
    board[0][c] = 'red';
  }

  // Place Blue pieces (Bottom Row)
  for (let c = 0; c < BOARD_SIZE; c++) {
    board[BOARD_SIZE - 1][c] = 'blue';
  }

  return board;
};

/**
 * Checks if a move is valid.
 * A piece can move 1 unit vertically or horizontally to an empty spot.
 */
export const getValidMoves = (board: BoardState, piece: Point): Point[] => {
  const moves: Point[] = [];
  const directions = [
    { r: -1, c: 0 }, // Up
    { r: 1, c: 0 },  // Down
    { r: 0, c: -1 }, // Left
    { r: 0, c: 1 },  // Right
  ];

  for (const d of directions) {
    const newR = piece.r + d.r;
    const newC = piece.c + d.c;

    if (
      newR >= 0 && newR < BOARD_SIZE &&
      newC >= 0 && newC < BOARD_SIZE &&
      board[newR][newC] === null
    ) {
      moves.push({ r: newR, c: newC });
    }
  }

  return moves;
};

/**
 * Counts pieces for a player.
 */
export const countPieces = (board: BoardState, player: Player): number => {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) count++;
    }
  }
  return count;
};

/**
 * Checks and executes captures based on the game rules.
 * 
 * Rules:
 * 1. Active Capture: When a player moves to form [Own][Own][Enemy] or [Enemy][Own][Own] on a line.
 * 2. Passive Safety: Moving next to two enemies does not trigger capture. (Implicitly handled because we only check patterns formed by the *Active* player).
 * 3. Full Line Immunity: If a line (row/col) has 4 pieces, no capture occurs on that line.
 * 
 * Returns the new board and a list of captured points (for animation/logs).
 */
export const processCaptures = (
  board: BoardState, 
  lastMove: Point, 
  currentPlayer: Player
): { newBoard: BoardState, captured: Point[] } => {
  
  // Deep copy board to modify
  const nextBoard = board.map(row => [...row]);
  const captured: Point[] = [];
  const opponent: Player = currentPlayer === 'red' ? 'blue' : 'red';
  const { r, c } = lastMove;

  // Helper to check and remove enemy at specific pos if pattern matches
  const checkLine = (line: (Player | null)[], lineIndices: Point[]) => {
    // Rule 3: If line has 4 pieces (no nulls), NO capture is possible.
    const occupiedCount = line.filter(p => p !== null).length;
    if (occupiedCount === BOARD_SIZE) return;

    // We look for patterns: [Player, Player, Enemy] or [Enemy, Player, Player]
    // The sequence must be contiguous.
    
    // Check horizontally/vertically along the provided line array
    // Since board is 4x4, max index is 3. 
    // Possible triplets: (0,1,2) and (1,2,3)
    
    for (let i = 0; i <= BOARD_SIZE - 3; i++) {
      const p1 = line[i];
      const p2 = line[i+1];
      const p3 = line[i+2];

      // Pattern: Own - Own - Enemy
      if (p1 === currentPlayer && p2 === currentPlayer && p3 === opponent) {
        // Confirm the pattern involves the piece that just moved.
        // The moved piece must be one of the 'Own' pieces.
        const indices = [lineIndices[i], lineIndices[i+1], lineIndices[i+2]];
        const movedPieceInvolved = indices.some(idx => idx.r === r && idx.c === c);
        
        if (movedPieceInvolved) {
          const victim = lineIndices[i+2];
          // Check if already marked for capture in this turn (rare edge case)
          if (nextBoard[victim.r][victim.c] === opponent) {
             nextBoard[victim.r][victim.c] = null;
             captured.push(victim);
          }
        }
      }

      // Pattern: Enemy - Own - Own
      if (p1 === opponent && p2 === currentPlayer && p3 === currentPlayer) {
         // Confirm involvement
         const indices = [lineIndices[i], lineIndices[i+1], lineIndices[i+2]];
         const movedPieceInvolved = indices.some(idx => idx.r === r && idx.c === c);
         
         if (movedPieceInvolved) {
           const victim = lineIndices[i];
           if (nextBoard[victim.r][victim.c] === opponent) {
              nextBoard[victim.r][victim.c] = null;
              captured.push(victim);
           }
         }
      }
    }
  };

  // 1. Check Row (Horizontal)
  const row = nextBoard[r];
  const rowIndices = Array.from({length: BOARD_SIZE}, (_, i) => ({r: r, c: i}));
  checkLine(row, rowIndices);

  // 2. Check Column (Vertical)
  const col = nextBoard.map(row => row[c]);
  const colIndices = Array.from({length: BOARD_SIZE}, (_, i) => ({r: i, c: c}));
  checkLine(col, colIndices);

  return { newBoard: nextBoard, captured };
};
