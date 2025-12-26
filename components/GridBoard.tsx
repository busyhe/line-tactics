import React from 'react';
import { BoardState, Player, Point, BOARD_SIZE } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../utils/i18n';

interface GridBoardProps {
  board: BoardState;
  turn: Player;
  myPlayer: Player | null; // null means local mode (play both) or spectator
  selectedPiece: Point | null;
  possibleMoves: Point[];
  onPieceClick: (r: number, c: number) => void;
  onMoveClick: (r: number, c: number) => void;
  lastMove: Point | null;
  winner: Player | null;
}

const GridBoard: React.FC<GridBoardProps> = ({
  board,
  turn,
  myPlayer,
  selectedPiece,
  possibleMoves,
  onPieceClick,
  onMoveClick,
  lastMove,
  winner,
}) => {
  const { t } = useI18n();
  const isLocalMode = myPlayer === null;
  const isMyTurn = isLocalMode || turn === myPlayer;
  const canInteract = !winner && isMyTurn;

  // Flip board for blue player so their pieces appear at bottom
  const shouldFlip = myPlayer === 'blue';

  const isPossibleMove = (r: number, c: number) => {
    return possibleMoves.some((m) => m.r === r && m.c === c);
  };

  const isSelected = (r: number, c: number) => {
    return selectedPiece?.r === r && selectedPiece?.c === c;
  };

  // Calculate position as percentage (flipped if blue player)
  const getPos = (idx: number) => {
    const pos = (idx * 100) / (BOARD_SIZE - 1);
    return shouldFlip ? pos : 100 - pos;
  };

  return (
    <div
      className={`relative p-6 sm:p-8 md:p-10 bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border transition-colors duration-500 select-none w-full aspect-square max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[550px] mx-auto
      ${
        !canInteract && !winner
          ? 'border-slate-700/50 opacity-90'
          : 'border-indigo-500/30 opacity-100'
      }
    `}
    >
      {/* Waiting overlay for online play */}
      {!canInteract && !winner && !isLocalMode && (
        <div className='absolute inset-0 z-30 flex items-center justify-center pointer-events-none'>
          <div className='bg-slate-950/60 backdrop-blur-[2px] px-4 py-2 rounded-full border border-slate-700 text-slate-300 text-xs sm:text-sm font-bold flex items-center gap-2'>
            <div className='w-2 h-2 bg-slate-400 rounded-full animate-pulse' />
            {t('thinking')}
          </div>
        </div>
      )}

      {/* Board Container */}
      <div className='relative w-full h-full'>
        {/* Grid Lines Layer */}
        <div className='absolute inset-0 z-0'>
          <svg
            width='100%'
            height='100%'
            className='stroke-slate-600 stroke-2 opacity-50 overflow-visible'
          >
            <defs>
              <filter id='glow' x='-20%' y='-20%' width='140%' height='140%'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur' />
                <feMerge>
                  <feMergeNode in='coloredBlur' />
                  <feMergeNode in='SourceGraphic' />
                </feMerge>
              </filter>
            </defs>
            {/* Horizontal Lines */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={`h-${i}`}
                x1='0%'
                y1={`${getPos(i)}%`}
                x2='100%'
                y2={`${getPos(i)}%`}
                className='stroke-slate-600/60'
              />
            ))}
            {/* Vertical Lines */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={`v-${i}`}
                x1={`${getPos(i)}%`}
                y1='0%'
                x2={`${getPos(i)}%`}
                y2='100%'
                className='stroke-slate-600/60'
              />
            ))}
          </svg>
        </div>

        {/* Interactive Layer (Pieces and Move Spots) */}
        {board.map((row, r) =>
          row.map((cell, c) => {
            const possible = isPossibleMove(r, c);
            const selected = isSelected(r, c);
            const isLastMove = lastMove?.r === r && lastMove?.c === c;

            const top = `${getPos(r)}%`;
            const left = `${getPos(c)}%`;

            // Interaction handlers
            const handlePieceInteraction = () => {
              if (!canInteract) return;
              // If online, can only click my own pieces
              if (!isLocalMode && cell !== myPlayer && !possible) return;
              onPieceClick(r, c);
            };

            const handleMoveInteraction = () => {
              if (!canInteract) return;
              onMoveClick(r, c);
            };

            return (
              <div
                key={`${r}-${c}`}
                className='absolute w-0 h-0 flex items-center justify-center'
                style={{ top, left }}
              >
                {/* Hit Box / Move Target */}
                <div
                  onClick={() => {
                    if (possible) {
                      handleMoveInteraction();
                    } else if (cell !== null) {
                      handlePieceInteraction();
                    }
                  }}
                  className={`absolute w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full z-20 flex items-center justify-center group outline-none tap-highlight-transparent ${
                    possible
                      ? 'cursor-pointer'
                      : cell !== null
                      ? canInteract && (isLocalMode || cell === myPlayer)
                        ? 'cursor-pointer'
                        : 'cursor-default'
                      : 'cursor-default'
                  }`}
                >
                  {/* Hover Effect for valid moves */}
                  {possible && canInteract && (
                    <div className='w-4 h-4 bg-indigo-500/50 rounded-full group-hover:scale-150 transition-transform duration-200'></div>
                  )}
                </div>

                {/* Grid Intersection Point (Dot) */}
                <div
                  className={`absolute w-2 h-2 rounded-full z-0 transition-colors duration-300 ${
                    possible && canInteract
                      ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]'
                      : 'bg-slate-700'
                  }`}
                />

                {/* Move Indicator (Ripple) */}
                {possible && canInteract && !winner && (
                  <div className='absolute w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 border-indigo-400/60 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none' />
                )}

                {/* The Piece */}
                <AnimatePresence mode='wait'>
                  {cell && (
                    <motion.div
                      layoutId={`piece-${r}-${c}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: selected ? 1.2 : 1,
                        opacity: 1,
                        y: selected ? -8 : 0,
                        filter: selected ? 'brightness(1.2)' : 'brightness(1)',
                        zIndex: selected ? 50 : 10,
                      }}
                      exit={{
                        scale: 0,
                        opacity: 0,
                        transition: { duration: 0.2 },
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                      className={`
                        absolute w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full shadow-lg pointer-events-none
                        flex items-center justify-center
                        ${
                          cell === 'red'
                            ? 'bg-gradient-to-t from-red-800 via-red-500 to-red-400 shadow-red-900/50 ring-1 ring-red-900/20'
                            : 'bg-gradient-to-t from-blue-800 via-blue-500 to-blue-400 shadow-blue-900/50 ring-1 ring-blue-900/20'
                        }
                        ${
                          turn === cell &&
                          !winner &&
                          (isLocalMode || myPlayer === turn)
                            ? 'ring-2 ring-white/60'
                            : ''
                        }
                      `}
                    >
                      {/* Glossy Reflection */}
                      <div className='absolute top-[10%] left-[15%] w-[30%] h-[20%] bg-white/40 blur-[1px] rounded-full transform -rotate-12'></div>

                      {/* Last Move Marker */}
                      {isLastMove && (
                        <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] animate-pulse'></div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GridBoard;
