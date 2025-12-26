import React, { useState, useEffect, useRef } from 'react';
import { BoardState, Player, Point, GameMode, NetworkMessage } from './types';
import {
  createInitialBoard,
  getValidMoves,
  processCaptures,
  countPieces,
} from './utils/gameLogic';
import { NetworkService } from './utils/network';
import GridBoard from './components/GridBoard';
import InfoPanel from './components/InfoPanel';
import RulesModal from './components/RulesModal';
import Lobby from './components/Lobby';

const App: React.FC = () => {
  // --- Game State ---
  const [gameMode, setGameMode] = useState<GameMode | 'lobby'>('lobby');
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [turn, setTurn] = useState<Player>('red');
  const [winner, setWinner] = useState<Player | null>(null);

  // --- Interaction State ---
  const [selectedPiece, setSelectedPiece] = useState<Point | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Point[]>([]);
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);

  // --- Network State ---
  const [myPlayer, setMyPlayer] = useState<Player | null>(null); // null = local (both)
  const [roomId, setRoomId] = useState<string>('');
  const networkRef = useRef<NetworkService | null>(null);
  const boardRef = useRef<BoardState>(board); // Keep latest board for network callbacks

  // --- Helpers ---
  const redCount = countPieces(board, 'red');
  const blueCount = countPieces(board, 'blue');
  const addLog = (msg: string) => setLogs((prev) => [msg, ...prev].slice(0, 5));

  // --- Logic ---
  const checkWinCondition = (currentBoard: BoardState) => {
    const rCount = countPieces(currentBoard, 'red');
    const bCount = countPieces(currentBoard, 'blue');

    if (rCount < 2) {
      setWinner('blue');
      addLog('Blue wins! Red eliminated.');
      return true;
    } else if (bCount < 2) {
      setWinner('red');
      addLog('Red wins! Blue eliminated.');
      return true;
    }
    return false;
  };

  // --- Initialization ---
  useEffect(() => {
    if (gameMode === 'lobby') {
      // Cleanup network if returning to lobby
      if (networkRef.current) {
        networkRef.current.disconnect();
        networkRef.current = null;
      }
    }
  }, [gameMode]);

  // Keep boardRef in sync with board state for network callbacks
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // Heartbeat to keep room alive during online game
  useEffect(() => {
    if (gameMode !== 'online' || !roomId || !myPlayer) return;

    const apiBaseUrl =
      import.meta.env.VITE_WS_URL?.replace('wss://', 'https://').replace(
        '/websocket',
        ''
      ) || '';
    if (!apiBaseUrl) return;

    const sendHeartbeat = async () => {
      try {
        await fetch(`${apiBaseUrl}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            color: myPlayer,
            action: 'heartbeat',
          }),
        });
      } catch (e) {
        console.error('Heartbeat failed:', e);
      }
    };

    // Send heartbeat every 5 seconds
    const interval = setInterval(sendHeartbeat, 5 * 1000);
    return () => clearInterval(interval);
  }, [gameMode, roomId, myPlayer]);

  // Unregister from room when leaving
  const unregisterFromRoom = async () => {
    if (!roomId || !myPlayer) return;
    const apiBaseUrl =
      import.meta.env.VITE_WS_URL?.replace('wss://', 'https://').replace(
        '/websocket',
        ''
      ) || '';
    if (apiBaseUrl) {
      try {
        await fetch(`${apiBaseUrl}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, color: myPlayer, action: 'leave' }),
        });
      } catch (e) {
        console.error('Failed to unregister from room:', e);
      }
    }
  };

  const startLocalGame = () => {
    resetGame();
    setGameMode('local');
    setMyPlayer(null); // Local player controls both
    addLog("Local game started. Red's turn.");
  };

  const startOnlineGame = async (room: string, role: 'host' | 'join') => {
    resetGame();
    setGameMode('online');
    setRoomId(room);

    // Assign player based on role (Host=Red, Join=Blue)
    // Note: In a real server scenario, the server would assign this.
    const playerRole = role === 'host' ? 'red' : 'blue';
    setMyPlayer(playerRole);
    addLog(`Joined Room: ${room} as ${playerRole.toUpperCase()}`);

    // Register with room registry
    const apiBaseUrl =
      import.meta.env.VITE_WS_URL?.replace('wss://', 'https://').replace(
        '/websocket',
        ''
      ) || '';
    if (apiBaseUrl) {
      try {
        await fetch(`${apiBaseUrl}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: room,
            color: playerRole,
            action: 'join',
          }),
        });
      } catch (e) {
        console.error('Failed to register room:', e);
      }
    }

    // Init Network
    networkRef.current = new NetworkService((msg: NetworkMessage) => {
      handleNetworkMessage(msg);
    });
    networkRef.current.connect(room);
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn('red');
    setWinner(null);
    setSelectedPiece(null);
    setPossibleMoves([]);
    setLastMove(null);
    setLogs([]);
  };

  const handleResetRequest = () => {
    resetGame();
    if (gameMode === 'online') {
      networkRef.current?.send({ type: 'RESET' });
      addLog('Game reset by player.');
    } else {
      addLog('Game reset.');
    }
  };

  // --- Core Game Loop ---
  const handlePieceClick = (r: number, c: number) => {
    if (winner) return;

    // Check Turn Integrity
    if (gameMode === 'online' && turn !== myPlayer) return;

    const clickedPiece = board[r][c];
    if (clickedPiece === turn) {
      if (selectedPiece?.r === r && selectedPiece?.c === c) {
        setSelectedPiece(null);
        setPossibleMoves([]);
        return;
      }
      setSelectedPiece({ r, c });
      setPossibleMoves(getValidMoves(board, { r, c }));
    }
  };

  const handleMoveClick = (r: number, c: number) => {
    if (!selectedPiece || winner) return;
    if (gameMode === 'online' && turn !== myPlayer) return;

    executeMove({ from: selectedPiece, to: { r, c } });

    // Broadcast if online
    if (gameMode === 'online') {
      networkRef.current?.send({
        type: 'MOVE',
        payload: { from: selectedPiece, to: { r, c } },
        sender: myPlayer!,
      });
    }
  };

  const executeMove = (
    move: { from: Point; to: Point },
    currentBoard?: BoardState
  ) => {
    const { from, to } = move;

    // Use provided board or current state
    const boardToUse = currentBoard || board;

    // 1. Move Piece
    const nextBoard = boardToUse.map((row) => [...row]);
    const movingPiece = nextBoard[from.r][from.c] as Player; // Should be valid
    nextBoard[from.r][from.c] = null;
    nextBoard[to.r][to.c] = movingPiece;

    // 2. Process Captures
    const { newBoard, captured } = processCaptures(nextBoard, to, movingPiece);

    // 3. Update State
    setBoard(newBoard);
    setLastMove(to);
    setSelectedPiece(null);
    setPossibleMoves([]);

    if (captured.length > 0) {
      addLog(`${movingPiece.toUpperCase()} captured ${captured.length}!`);
    }

    // 4. Check Win
    const hasWon = checkWinCondition(newBoard);

    // 5. Switch Turn (if no win)
    if (!hasWon) {
      setTurn((prev) => (prev === 'red' ? 'blue' : 'red'));
    }
  };

  // --- Network Handlers ---
  const handleNetworkMessage = (msg: NetworkMessage) => {
    switch (msg.type) {
      case 'MOVE':
        if (msg.sender !== myPlayer) {
          // Use boardRef to get latest board state (avoids closure issue)
          executeMove(msg.payload, boardRef.current);
        }
        break;
      case 'RESET':
        resetGame();
        addLog('Opponent reset the game.');
        break;
      case 'JOIN':
        addLog('A player joined the room. Game starting!');
        // Reset game when second player joins for a fresh start
        resetGame();
        break;
    }
  };

  return (
    <div className='min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center font-sans overflow-x-hidden text-slate-100 selection:bg-indigo-500 selection:text-white'>
      {/* Background Decoration */}
      <div className='fixed inset-0 pointer-events-none overflow-hidden'>
        <div className='absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse' />
        <div className='absolute top-[30%] -right-[10%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[90px]' />
      </div>

      {/* Header */}
      <header className='relative z-10 pt-8 pb-4 sm:pt-10 sm:pb-8 text-center px-4 w-full'>
        <div className='flex items-center justify-center gap-3'>
          <h1 className='text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-cyan-300 drop-shadow-2xl tracking-tighter'>
            Line Tactics
          </h1>
        </div>
        <p className='text-indigo-200/50 text-xs sm:text-sm font-bold tracking-[0.2em] mt-2 uppercase'>
          {gameMode === 'online'
            ? `Online Room: ${roomId}`
            : 'The Four Pieces Strategy'}
        </p>
      </header>

      <main className='relative z-10 w-full max-w-6xl px-4 pb-8 flex-1 flex flex-col items-center justify-center'>
        {gameMode === 'lobby' ? (
          <Lobby onJoinLocal={startLocalGame} onJoinOnline={startOnlineGame} />
        ) : (
          <div className='w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-16'>
            {/* Game Board Area */}
            <div className='order-1 lg:order-1 w-full max-w-[600px] flex justify-center'>
              <GridBoard
                board={board}
                turn={turn}
                myPlayer={myPlayer}
                selectedPiece={selectedPiece}
                possibleMoves={possibleMoves}
                onPieceClick={handlePieceClick}
                onMoveClick={handleMoveClick}
                lastMove={lastMove}
                winner={winner}
              />
            </div>

            {/* Sidebar / Info Area */}
            <div className='order-2 lg:order-2 w-full max-w-[400px] lg:w-[350px] flex flex-col gap-5'>
              <InfoPanel
                turn={turn}
                redCount={redCount}
                blueCount={blueCount}
                winner={winner}
                onReset={handleResetRequest}
                onOpenRules={() => setRulesOpen(true)}
              />

              {/* Log & Exit */}
              <div className='w-full bg-slate-900/60 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl flex flex-col gap-3'>
                <div className='h-24 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent'>
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className='text-xs text-slate-400 font-mono border-l-2 border-slate-700 pl-2 py-0.5'
                    >
                      {log}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    unregisterFromRoom();
                    setGameMode('lobby');
                  }}
                  className='w-full py-2 text-xs font-bold text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors uppercase tracking-widest'
                >
                  Exit to Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
};

export default App;
