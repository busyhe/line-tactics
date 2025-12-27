import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../types';
import { useI18n } from '../utils/i18n';

interface GameResultProps {
  winner: Player | null;
  myPlayer: Player | null; // null means local (both)
  onReset: () => void;
}

const GameResult: React.FC<GameResultProps> = ({
  winner,
  myPlayer,
  onReset,
}) => {
  const { t } = useI18n();

  if (!winner) return null;

  const isLocal = myPlayer === null;
  const isVictory = isLocal || winner === myPlayer;

  // Theme configuration
  const theme = isVictory
    ? {
        bg: 'from-indigo-600/90 via-indigo-900/95 to-slate-900/98',
        text: 'text-indigo-200',
        title:
          'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200',
        label: t('victory'),
        glow: 'bg-indigo-500/30',
        button:
          'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/50',
      }
    : {
        bg: 'from-rose-900/90 via-slate-900/95 to-black/98',
        text: 'text-rose-200',
        title:
          'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-100 to-rose-400',
        label: t('defeat'),
        glow: 'bg-rose-500/20',
        button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/50',
      };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-gradient-to-b ${theme.bg}`}
      >
        {/* Background Glow */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] ${theme.glow}`}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 100,
            delay: 0.2,
          }}
          className='relative z-10 flex flex-col items-center text-center max-w-md w-full'
        >
          {/* Winner Icon */}
          <motion.div
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className={`w-24 h-24 rounded-3xl mb-8 flex items-center justify-center border-4 border-white/20 shadow-2xl relative overflow-hidden ${
              winner === 'red'
                ? 'bg-gradient-to-br from-red-400 to-red-600'
                : 'bg-gradient-to-br from-blue-400 to-blue-600'
            }`}
          >
            <span className='text-4xl font-black text-white drop-shadow-lg'>
              {winner === 'red' ? 'R' : 'B'}
            </span>
            <motion.div
              animate={{ x: ['100%', '-100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12'
            />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ letterSpacing: '0.5em', opacity: 0 }}
            animate={{ letterSpacing: '0.1em', opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className={`text-6xl sm:text-7xl font-black mb-2 uppercase italic tracking-wider drop-shadow-2xl ${theme.title}`}
          >
            {theme.label}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className={`text-sm sm:text-base font-bold uppercase tracking-[0.3em] mb-12 ${theme.text} opacity-60`}
          >
            {isLocal
              ? t(winner === 'red' ? 'redWins' : 'blueWins').toUpperCase()
              : winner === 'red'
              ? t('redWins').toUpperCase()
              : t('blueWins').toUpperCase()}
          </motion.p>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className={`px-12 py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-lg ${theme.button}`}
          >
            {t('playAgain')}
          </motion.button>
        </motion.div>

        {/* Decorative Elements for Victory */}
        {isVictory && (
          <div className='absolute inset-0 pointer-events-none overflow-hidden'>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * 100 + '%',
                  y: '110%',
                  scale: Math.random() * 0.5 + 0.5,
                  opacity: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: '-10%',
                  rotate: 360,
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: 'linear',
                }}
                className='absolute w-2 h-2 bg-indigo-400/30 rounded-full'
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default GameResult;
