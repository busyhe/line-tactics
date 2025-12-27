export type Player = 'red' | 'blue';

export interface Point {
  r: number;
  c: number;
}

// The board is a flattened array or 2D array representation.
// We use a 4x4 grid.
export type BoardState = (Player | null)[][];

export interface GameState {
  board: BoardState;
  turn: Player;
  winner: Player | null;
  selectedPiece: Point | null;
  possibleMoves: Point[];
  gameLog: string[];
}

export const BOARD_SIZE = 4;

// Networking & Game Modes
export type GameMode = 'local' | 'online' | 'bot';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface NetworkMessage {
  type: 'MOVE' | 'RESET' | 'JOIN' | 'SYNC' | 'ONLINE_COUNT' | 'EMOJI';
  payload?: any;
  sender?: Player;
}

export interface PlayerState {
  id: string;
  color: Player | null; // null means spectator or not assigned yet
}

export interface LogEntry {
  key: string;
  params?: Record<string, any>;
}
