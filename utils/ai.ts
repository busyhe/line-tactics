import { BoardState, Player, Point, Difficulty, BOARD_SIZE } from '../types';
import { getValidMoves, processCaptures, countPieces } from './gameLogic';

/**
 * Main entry point for getting the bot's move.
 */
export const getBotMove = (
  board: BoardState,
  botPlayer: Player,
  difficulty: Difficulty
): { from: Point; to: Point } | null => {
  const allMoves = getAllValidMoves(board, botPlayer);
  if (allMoves.length === 0) return null;

  switch (difficulty) {
    case 'easy':
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    case 'medium':
      return getMediumMove(board, botPlayer, allMoves);
    case 'hard':
      return getBestMove(board, botPlayer, 4); // Depth 4 for hard
    default:
      return allMoves[0];
  }
};

/**
 * Gets all valid moves for a player on the current board.
 */
const getAllValidMoves = (
  board: BoardState,
  player: Player
): { from: Point; to: Point }[] => {
  const moves: { from: Point; to: Point }[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) {
        const validTos = getValidMoves(board, { r, c });
        validTos.forEach((to) => moves.push({ from: { r, c }, to }));
      }
    }
  }
  return moves;
};

/**
 * Medium: Greedy approach - prefer moves that capture, or avoid being captured.
 */
const getMediumMove = (
  board: BoardState,
  player: Player,
  allMoves: { from: Point; to: Point }[]
): { from: Point; to: Point } => {
  let bestMove = allMoves[0];
  let maxScore = -Infinity;

  for (const move of allMoves) {
    const { newBoard: _newBoard, captured } = processCaptures(
      board,
      move.to,
      player
    );
    let score = captured.length * 10;

    // Slight penalty for moving to a position where it could be captured next turn (heuristic-ish)
    // For medium, we'll keep it simple: random among equally good scores
    if (score > maxScore) {
      maxScore = score;
      bestMove = move;
    } else if (score === maxScore && Math.random() > 0.5) {
      bestMove = move;
    }
  }

  return bestMove;
};

/**
 * Hard: Minimax with Alpha-Beta Pruning.
 */
const getBestMove = (
  board: BoardState,
  player: Player,
  depth: number
): { from: Point; to: Point } => {
  let bestScore = -Infinity;
  let bestMove = null;
  const allMoves = getAllValidMoves(board, player);
  const opponent = player === 'red' ? 'blue' : 'red';

  for (const move of allMoves) {
    const nextBoard = simulateMove(board, move, player);
    const score = minimax(
      nextBoard,
      depth - 1,
      false,
      -Infinity,
      Infinity,
      player,
      opponent
    );
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove || allMoves[0];
};

const simulateMove = (
  board: BoardState,
  move: { from: Point; to: Point },
  player: Player
): BoardState => {
  const nextBoard = board.map((row) => [...row]);
  nextBoard[move.from.r][move.from.c] = null;
  nextBoard[move.to.r][move.to.c] = player;
  const { newBoard } = processCaptures(nextBoard, move.to, player);
  return newBoard;
};

const minimax = (
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  botPlayer: Player,
  opponent: Player
): number => {
  const botCount = countPieces(board, botPlayer);
  const oppCount = countPieces(board, opponent);

  if (oppCount < 2) return 1000 + depth; // Bot wins
  if (botCount < 2) return -1000 - depth; // Opponent wins
  if (depth === 0) return evaluateBoard(board, botPlayer, opponent);

  const currentPlayer = isMaximizing ? botPlayer : opponent;
  const moves = getAllValidMoves(board, currentPlayer);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextBoard = simulateMove(board, move, botPlayer);
      const ev = minimax(
        nextBoard,
        depth - 1,
        false,
        alpha,
        beta,
        botPlayer,
        opponent
      );
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextBoard = simulateMove(board, move, opponent);
      const ev = minimax(
        nextBoard,
        depth - 1,
        true,
        alpha,
        beta,
        botPlayer,
        opponent
      );
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

/**
 * Heuristic evaluation function.
 */
const evaluateBoard = (
  board: BoardState,
  botPlayer: Player,
  opponent: Player
): number => {
  const botCount = countPieces(board, botPlayer);
  const oppCount = countPieces(board, opponent);

  // Weight piece difference heavily
  let score = (botCount - oppCount) * 20;

  // Mobility: count valid moves (more options is better)
  const botMoves = getAllValidMoves(board, botPlayer).length;
  const oppMoves = getAllValidMoves(board, opponent).length;
  score += botMoves - oppMoves;

  return score;
};
