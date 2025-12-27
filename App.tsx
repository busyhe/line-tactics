import React, { useState, useEffect, useRef } from 'react';
import {
  BoardState,
  Player,
  Point,
  GameMode,
  NetworkMessage,
  LogEntry,
} from './types';
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
import GameResult from './components/GameResult';
import { I18nProvider, useI18n } from './utils/i18n';
import { getBotMove } from './utils/ai';
import { Difficulty } from './types';

const Game: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  // --- Game State ---
  const [gameMode, setGameMode] = useState<GameMode | 'lobby'>('lobby');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [turn, setTurn] = useState<Player>('red');
  const [winner, setWinner] = useState<Player | null>(null);

  // --- Interaction State ---
  const [selectedPiece, setSelectedPiece] = useState<Point | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Point[]>([]);
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);

  // --- Network State ---
  const [myPlayer, setMyPlayer] = useState<Player | null>(null); // null = local (both)
  const [roomId, setRoomId] = useState<string>('');
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const networkRef = useRef<NetworkService | null>(null);
  const boardRef = useRef<BoardState>(board); // Keep latest board for network callbacks

  // --- Helpers ---
  const redCount = countPieces(board, 'red');
  const blueCount = countPieces(board, 'blue');
  const addLog = (entry: LogEntry) =>
    setLogs((prev) => [entry, ...prev].slice(0, 5));

  // --- Logic ---
  const checkWinCondition = (currentBoard: BoardState) => {
    const rCount = countPieces(currentBoard, 'red');
    const bCount = countPieces(currentBoard, 'blue');

    if (rCount < 2) {
      setWinner('blue');
      addLog({ key: 'blueWinsFull' });
      return true;
    } else if (bCount < 2) {
      setWinner('red');
      addLog({ key: 'redWinsFull' });
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

  // --- Bot Turn Handling ---
  useEffect(() => {
    if (gameMode !== 'bot' || winner || turn === 'red') return;

    // Simulate thinking delay
    const timer = setTimeout(() => {
      const move = getBotMove(board, 'blue', difficulty);
      if (move) {
        executeMove(move);
        addLog({
          key: 'logThinking',
          params: { color: { key: 'blue' }, text: { key: 'thinking' } },
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameMode, turn, winner, board, difficulty]);

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
    addLog({ key: 'logLocalStarted' });
  };

  const startBotGame = (level: Difficulty) => {
    resetGame();
    setGameMode('bot');
    setDifficulty(level);
    setMyPlayer('red'); // Player is always red vs bot for now
    addLog({ key: 'logLocalStarted' });
  };

  const startOnlineGame = async (room: string, role: 'host' | 'join') => {
    resetGame();
    setGameMode('online');
    setRoomId(room);

    // Assign player based on role (Host=Red, Join=Blue)
    // Note: In a real server scenario, the server would assign this.
    const playerRole = role === 'host' ? 'red' : 'blue';
    setMyPlayer(playerRole);
    addLog({
      key: 'logJoinedRoom',
      params: { room: room, role: { key: playerRole } },
    });

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
      addLog({ key: 'logResetByPlayer' });
    } else {
      addLog({ key: 'logResetByPlayer' });
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
      addLog({
        key: 'logCaptured',
        params: { color: { key: movingPiece }, count: captured.length },
      });
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
        addLog({ key: 'logOpponentReset' });
        break;
      case 'JOIN':
        addLog({ key: 'logPlayerJoined' });
        // Reset game when second player joins for a fresh start
        resetGame();
        break;
      case 'ONLINE_COUNT':
        if (msg.payload !== undefined) {
          setOnlineCount(msg.payload);
        }
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

      {/* Online Count Overlay */}
      <div className='fixed top-6 left-6 z-50 flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-full shadow-lg transition-all hover:bg-slate-900/60'>
        <div className='relative'>
          <div className='w-2 h-2 bg-emerald-500 rounded-full animate-pulse' />
          <div className='absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-40' />
        </div>
        <span className='text-[10px] font-bold text-slate-300 uppercase tracking-widest'>
          {onlineCount} {t('online')}
        </span>
      </div>

      {/* Language Switcher */}
      <div className='absolute right-6 top-6 z-50 flex bg-slate-800/50 backdrop-blur-md rounded-lg p-1 border border-slate-700/50'>
        <button
          onClick={() => setLang('zh')}
          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
            lang === 'zh'
              ? 'bg-indigo-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          中
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
            lang === 'en'
              ? 'bg-indigo-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          EN
        </button>
      </div>

      {/* Header */}
      <header className='relative z-20 pt-8 pb-4 sm:pt-10 sm:pb-8 text-center px-4 w-full mt-6'>
        <div className='flex flex-col items-center justify-center gap-4 relative'>
          <h1 className='text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-cyan-300 drop-shadow-2xl tracking-tighter'>
            {t('title')}
          </h1>
        </div>
        <p className='text-indigo-200/50 text-xs sm:text-sm font-bold tracking-[0.2em] mt-2 uppercase'>
          {gameMode === 'online'
            ? `${t('onlineMultiplayer')}: ${roomId}`
            : t('subtitle')}
        </p>
      </header>

      <main className='relative z-10 w-full max-w-6xl px-4 pb-8 flex-1 flex flex-col items-center justify-center'>
        {gameMode === 'lobby' ? (
          <Lobby
            onJoinLocal={startLocalGame}
            onJoinBot={startBotGame}
            onJoinOnline={startOnlineGame}
            onOnlineCountUpdate={setOnlineCount}
          />
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
                myPlayer={myPlayer}
                winner={winner}
                onReset={handleResetRequest}
                onOpenRules={() => setRulesOpen(true)}
              />

              {/* Log & Exit */}
              <div className='w-full bg-slate-900/60 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl flex flex-col gap-3'>
                <div className='h-24 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent'>
                  {logs.map((log, i) => {
                    const renderLog = (entry: LogEntry) => {
                      const params: Record<string, string | number> = {};
                      if (entry.params) {
                        Object.entries(entry.params).forEach(([k, v]) => {
                          if (v && typeof v === 'object' && v.key) {
                            params[k] = t(v.key).toUpperCase();
                          } else {
                            params[k] = v;
                          }
                        });
                      }
                      return t(entry.key as any, params);
                    };

                    return (
                      <div
                        key={i}
                        className='text-xs text-slate-400 font-mono border-l-2 border-slate-700 pl-2 py-0.5'
                      >
                        {renderLog(log)}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    unregisterFromRoom();
                    setGameMode('lobby');
                  }}
                  className='w-full py-2 text-xs font-bold text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors uppercase tracking-widest'
                >
                  {t('exitToMenu')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />

      <GameResult
        winner={winner}
        myPlayer={myPlayer}
        onReset={handleResetRequest}
      />

      {/* Footer */}
      <footer className='relative z-20 w-full py-8 text-center border-t border-slate-800/50 mt-auto'>
        <div className='flex flex-col items-center gap-2'>
          <div className='flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest'>
            <span>{t('footerCopyright')}</span>
            <span className='w-1 h-1 bg-slate-700 rounded-full' />
            <a
              href='https://busyhe.com'
              target='_blank'
              rel='noopener noreferrer'
              className='hover:text-indigo-400 transition-colors'
            >
              {t('footerAuthor')}
            </a>
          </div>
          <a
            href='https://github.com/busyhe/line-tactics'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-600 hover:text-slate-300 transition-colors uppercase tracking-[0.2em]'
          >
            <svg
              className='w-3 h-3'
              fill='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path
                fillRule='evenodd'
                d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
                clipRule='evenodd'
              />
            </svg>
            {t('footerSourceCode')}
          </a>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <I18nProvider>
      <Game />
    </I18nProvider>
  );
};

export default App;
