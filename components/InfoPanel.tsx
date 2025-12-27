import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../types';
import { useI18n } from '../utils/i18n';

interface InfoPanelProps {
  turn: Player;
  redCount: number;
  blueCount: number;
  myPlayer: Player | null;
  isOpponentOnline: boolean;
  activeEmojis: { red: string | null; blue: string | null };
  onSendEmoji: (emoji: string) => void;
  winner: Player | null;
  onReset: () => void;
  onOpenRules: () => void;
}

const EMOJIS = [
  '😃',
  '😂',
  '👍',
  '👎',
  '🎯',
  '🔥',
  '🤝',
  '😲',
  '💡',
  '💀',
  '🏆',
  '🤔',
  '😭',
  '😡',
  '�',
  '🤖',
  '🍀',
  '🫡',
  '🤡',
  '❤️',
  '👑',
  '🧠',
  '⚡',
  '⚔️',
  '🤯',
  '🤐',
  '💯',
  '⏳',
  '🎲',
  '💪',
  '😎',
  '🙄',
  '😅',
  '👌',
  '🎉',
  '😈',
  '🧊',
];

const InfoPanel: React.FC<InfoPanelProps> = ({
  turn,
  redCount,
  blueCount,
  myPlayer,
  isOpponentOnline,
  activeEmojis,
  onSendEmoji,
  winner,
  onReset,
  onOpenRules,
}) => {
  const { t } = useI18n();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleEmojiClick = (emoji: string) => {
    if (cooldown > 0) return;
    onSendEmoji(emoji);
    setCooldown(3); // 3 seconds cooldown
  };

  const EmojiBubble = ({
    emoji,
    direction = 'up',
  }: {
    emoji: string | null;
    direction?: 'up' | 'left';
  }) => {
    const isLeft = direction === 'left';
    return (
      <AnimatePresence>
        {emoji && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.5,
              x: isLeft ? 10 : 0,
              y: isLeft ? 0 : 10,
              rotate: isLeft ? 0 : 0,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: isLeft ? -70 : 20,
              y: isLeft ? -40 : -40,
              rotate: isLeft ? 45 : 45,
            }}
            exit={{
              opacity: 0,
              scale: 0.5,
              x: isLeft ? -60 : 0,
              y: isLeft ? 0 : -60,
              rotate: isLeft ? 0 : 0,
            }}
            className='absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none'
          >
            <div className='bg-slate-800 border-2 border-indigo-500/50 rounded-2xl p-2 shadow-2xl backdrop-blur-sm relative'>
              <span className='block text-2xl leading-none -rotate-45'>
                {emoji}
              </span>
              <div
                className={`absolute w-3 h-3 bg-slate-800 border-indigo-500/50 rotate-45 ${
                  isLeft
                    ? 'top-1/2 -right-1.5 -translate-y-1/2 border-t-2 border-r-2'
                    : 'bottom-[-6px] left-1/2 -translate-x-1/2 border-r-2 border-b-2'
                }`}
              ></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const StatusIndicator = ({ isOnline }: { isOnline: boolean }) => (
    <div className='flex items-center gap-1 mt-1'>
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          isOnline
            ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]'
            : 'bg-slate-500'
        }`}
      />
      <span
        className={`text-[8px] font-black uppercase tracking-widest ${
          isOnline ? 'text-green-400' : 'text-slate-400'
        }`}
      >
        {t(isOnline ? 'statusOnline' : 'statusOffline')}
      </span>
    </div>
  );

  return (
    <div className='flex flex-col gap-4 w-full'>
      {/* Score Card */}
      <div className='relative bg-slate-800 rounded-2xl border border-slate-700 shadow-xl'>
        {/* Active Turn Highlight Background */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            winner
              ? 'bg-slate-800'
              : turn === 'red'
              ? 'bg-gradient-to-r from-red-900/20 to-transparent'
              : 'bg-gradient-to-l from-blue-900/20 to-transparent'
          }`}
        ></div>

        <div className='relative p-6 flex justify-between items-center z-10'>
          {/* Red Player */}
          <div
            className={`flex flex-col items-center transition-all duration-300 ${
              turn === 'red' && !winner ? 'scale-110' : 'opacity-70'
            }`}
          >
            <div className='relative'>
              <EmojiBubble emoji={activeEmojis.red} />
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-lg mb-2 flex items-center justify-center border-2 ${
                  turn === 'red' ? 'border-white' : 'border-transparent'
                }`}
              >
                <span className='text-red-950 font-black text-lg'>R</span>
              </div>
              {turn === 'red' && !winner && (
                <div className='absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-white text-red-600 font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap'>
                  {t('turnIndicator', { color: '' })
                    .replace("'s Turn", '')
                    .replace('方回合', '')}
                </div>
              )}
              {myPlayer === 'red' && (
                <div className='absolute -top-1 -right-1 text-[8px] bg-indigo-500 text-white font-black px-1.5 py-0.5 rounded-full shadow-lg border border-indigo-400 animate-in fade-in zoom-in duration-300'>
                  {t('me')}
                </div>
              )}
            </div>
            <span className='text-3xl font-black text-white drop-shadow-md'>
              {redCount}
            </span>
            {myPlayer === 'blue' && (
              <StatusIndicator isOnline={isOpponentOnline} />
            )}
          </div>

          {/* Center Status */}
          <div className='flex flex-col items-center justify-center h-full px-4'>
            {winner ? (
              <div className='text-center animate-bounce'>
                <span
                  className={`font-black text-2xl drop-shadow-md tracking-wider ${
                    winner === 'red' ? 'text-red-400' : 'text-blue-400'
                  }`}
                >
                  {t(winner).toUpperCase()}
                </span>
                <div className='text-xs text-white font-bold uppercase bg-slate-700 px-2 py-1 rounded mt-1'>
                  {t('winnerTitle')}
                </div>
              </div>
            ) : (
              <div className='text-slate-600 font-black text-xl italic opacity-50'>
                VS
              </div>
            )}
          </div>

          {/* Blue Player */}
          <div
            className={`flex flex-col items-center transition-all duration-300 ${
              turn === 'blue' && !winner ? 'scale-110' : 'opacity-70'
            }`}
          >
            <div className='relative'>
              <EmojiBubble emoji={activeEmojis.blue} direction='left' />
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shadow-lg mb-2 flex items-center justify-center border-2 ${
                  turn === 'blue' ? 'border-white' : 'border-transparent'
                }`}
              >
                <span className='text-blue-950 font-black text-lg'>B</span>
              </div>
              {turn === 'blue' && !winner && (
                <div className='absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-white text-blue-600 font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap'>
                  {t('turnIndicator', { color: '' })
                    .replace("'s Turn", '')
                    .replace('方回合', '')}
                </div>
              )}
              {myPlayer === 'blue' && (
                <div className='absolute -top-1 -right-1 text-[8px] bg-indigo-500 text-white font-black px-1.5 py-0.5 rounded-full shadow-lg border border-indigo-400 animate-in fade-in zoom-in duration-300'>
                  {t('me')}
                </div>
              )}
            </div>
            <span className='text-3xl font-black text-white drop-shadow-md'>
              {blueCount}
            </span>
            {myPlayer === 'red' && (
              <StatusIndicator isOnline={isOpponentOnline} />
            )}
          </div>
        </div>
      </div>

      {/* Emoji Bar (only in online mode for myPlayer) */}
      {myPlayer && (
        <div className='flex items-center justify-between bg-slate-900/40 backdrop-blur-sm rounded-xl p-2 border border-slate-700/50'>
          <div className='flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth'>
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                disabled={cooldown > 0}
                className={`text-xl p-1 hover:scale-125 transition-transform disabled:opacity-30 disabled:grayscale disabled:hover:scale-100 ${
                  cooldown > 0 ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {cooldown > 0 && (
            <div className='px-2 py-1 bg-slate-800 rounded text-[10px] font-bold text-indigo-400 tabular-nums'>
              {cooldown}s
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className='grid grid-cols-2 gap-3'>
        <button
          onClick={onReset}
          className='group py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-500 shadow-lg flex items-center justify-center gap-2'
        >
          <svg
            className='w-4 h-4 group-hover:-rotate-180 transition-transform duration-500'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
            />
          </svg>
          {t('resetGame')}
        </button>
        <button
          onClick={onOpenRules}
          className='py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          {t('rules')}
        </button>
      </div>
    </div>
  );
};

export default InfoPanel;
