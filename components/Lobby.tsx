import React, { useState, useEffect } from 'react';
import { useI18n } from '../utils/i18n';
import { Difficulty } from '../types';

interface RoomInfo {
  roomId: string;
  hasRed: boolean;
  hasBlue: boolean;
  createdAt: number;
}

interface LobbyProps {
  onJoinLocal: () => void;
  onJoinBot: (difficulty: Difficulty) => void;
  onJoinOnline: (roomId: string, role: 'host' | 'join') => void;
}

const Lobby: React.FC<LobbyProps> = ({
  onJoinLocal,
  onJoinBot,
  onJoinOnline,
}) => {
  const { t } = useI18n();
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState<
    'menu' | 'online-setup' | 'difficulty-selection'
  >('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [selectedColor, setSelectedColor] = useState<'red' | 'blue' | null>(
    null
  );
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Base URL for API (same origin as WebSocket but HTTP)
  const wsUrl = import.meta.env.VITE_WS_URL;
  let apiBaseUrl = '';

  if (wsUrl) {
    apiBaseUrl = wsUrl
      .replace('wss://', 'https://')
      .replace('ws://', 'http://')
      .replace('/websocket', '');
  } else {
    apiBaseUrl = `${window.location.protocol}//${window.location.host}`;
  }

  // Fetch available rooms (silent refresh after first load)
  const isFirstLoad = React.useRef(true);

  const fetchRooms = async () => {
    if (!apiBaseUrl) return;

    // Only show loading spinner on first load
    if (isFirstLoad.current) {
      setLoading(true);
    }

    try {
      const res = await fetch(`${apiBaseUrl}/rooms`);
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (e) {
      console.error('Failed to fetch rooms:', e);
    } finally {
      if (isFirstLoad.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
    }
  };

  useEffect(() => {
    if (mode === 'online-setup') {
      isFirstLoad.current = true;
      fetchRooms();
      // Refresh every 3 seconds
      const interval = setInterval(fetchRooms, 3000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const handleOnlineStart = () => {
    if (!roomId.trim() || !selectedColor) return;
    const role = selectedColor === 'red' ? 'host' : 'join';
    onJoinOnline(roomId, role);
  };

  const handleQuickJoin = (room: RoomInfo) => {
    // Check if room is actually full (safety check)
    if (room.hasRed && room.hasBlue) return;

    // Auto-select available color and join directly
    const color = !room.hasRed ? 'red' : 'blue';
    const role = color === 'red' ? 'host' : 'join';
    onJoinOnline(room.roomId, role);
  };

  return (
    <div className='w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300'>
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-300 mb-2'>
          {t('newGame')}
        </h2>
        <p className='text-slate-400 text-sm'>{t('selectMode')}</p>
      </div>

      {mode === 'menu' ? (
        <div className='space-y-4'>
          <button
            onClick={onJoinLocal}
            className='w-full group relative overflow-hidden p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 text-left'
          >
            <div className='relative z-10 flex items-center gap-4'>
              <div className='p-3 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <div>
                <h3 className='font-bold text-lg text-white group-hover:text-indigo-300 transition-colors'>
                  {t('localMultiplayer')}
                </h3>
                <p className='text-xs text-slate-400'>{t('playOnDevice')}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode('difficulty-selection')}
            className='w-full group relative overflow-hidden p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 text-left'
          >
            <div className='relative z-10 flex items-center gap-4'>
              <div className='p-3 bg-emerald-500/20 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
                  />
                </svg>
              </div>
              <div>
                <h3 className='font-bold text-lg text-white group-hover:text-emerald-300 transition-colors'>
                  {t('vsBot')}
                </h3>
                <p className='text-xs text-slate-400'>{t('playWithAI')}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode('online-setup')}
            className='w-full group relative overflow-hidden p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 text-left'
          >
            <div className='relative z-10 flex items-center gap-4'>
              <div className='p-3 bg-cyan-500/20 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <div>
                <h3 className='font-bold text-lg text-white group-hover:text-cyan-300 transition-colors'>
                  {t('onlineMultiplayer')}
                </h3>
                <p className='text-xs text-slate-400'>{t('syncDevices')}</p>
              </div>
            </div>
          </button>
        </div>
      ) : mode === 'difficulty-selection' ? (
        <div className='space-y-6'>
          <div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
            <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center'>
              {t('selectDifficulty')}
            </label>
            <div className='space-y-3'>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`w-full py-4 px-6 rounded-xl font-bold transition-all border ${
                    difficulty === d
                      ? d === 'easy'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                        : d === 'medium'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/20'
                        : 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-700'
                  }`}
                >
                  {t(d)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onJoinBot(difficulty)}
            className='w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl transition-all shadow-xl hover:shadow-emerald-500/30 uppercase tracking-widest'
          >
            {t('newGame')}
          </button>

          <button
            onClick={() => setMode('menu')}
            className='w-full py-2 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors'
          >
            {t('cancel')}
          </button>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Room ID Input */}
          <div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
            <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2'>
              {t('roomId')}
            </label>
            <input
              type='text'
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder={t('enterRoomName')}
              className='w-full bg-slate-900 text-center font-mono text-xl py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700'
              maxLength={8}
            />
          </div>

          {/* Color Selection */}
          <div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
            <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3'>
              {t('selectColor')}
            </label>
            <div className='grid grid-cols-2 gap-3'>
              <button
                onClick={() => setSelectedColor('red')}
                className={`py-3 px-4 font-bold rounded-xl transition-all ${
                  selectedColor === 'red'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-400'
                    : 'bg-slate-700 text-red-400 hover:bg-red-600/20 border border-red-500/30'
                }`}
              >
                🔴 {t('red')}
              </button>
              <button
                onClick={() => setSelectedColor('blue')}
                className={`py-3 px-4 font-bold rounded-xl transition-all ${
                  selectedColor === 'blue'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                    : 'bg-slate-700 text-blue-400 hover:bg-blue-600/20 border border-blue-500/30'
                }`}
              >
                🔵 {t('blue')}
              </button>
            </div>

            {/* Selected Color Display */}
            {selectedColor && (
              <div
                className={`mt-3 p-2 rounded-lg text-center text-sm font-medium ${
                  selectedColor === 'red'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {t('playAs', { color: t(selectedColor).toUpperCase() })}
              </div>
            )}
          </div>

          {/* Join Button */}
          <button
            onClick={handleOnlineStart}
            disabled={!roomId || !selectedColor}
            className='w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/30'
          >
            {roomId && selectedColor
              ? t('joinAs', { color: t(selectedColor).toUpperCase() })
              : t('selectRoomColor')}
          </button>

          {/* Available Rooms */}
          {rooms.length > 0 && (
            <div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
              <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3'>
                {t('availableRooms')} ({rooms.length})
              </label>
              <div className='space-y-2 max-h-40 overflow-y-auto'>
                {rooms.map((room) => (
                  <button
                    key={room.roomId}
                    onClick={() => handleQuickJoin(room)}
                    disabled={room.hasRed && room.hasBlue}
                    className={`w-full p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-slate-600 transition-all text-left flex items-center justify-between ${
                      room.hasRed && room.hasBlue
                        ? 'opacity-40 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    <span className='font-mono font-bold text-cyan-300'>
                      {room.roomId}
                    </span>
                    <div className='flex gap-2 text-xs'>
                      <span
                        className={
                          room.hasRed ? 'text-red-400' : 'text-slate-500'
                        }
                      >
                        🔴 {room.hasRed ? t('joined') : t('open')}
                      </span>
                      <span
                        className={
                          room.hasBlue ? 'text-blue-400' : 'text-slate-500'
                        }
                      >
                        🔵 {room.hasBlue ? t('joined') : t('open')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className='text-center text-slate-500 text-sm'>
              {t('loadingRooms')}
            </div>
          )}

          <button
            onClick={() => {
              setMode('menu');
              setSelectedColor(null);
            }}
            className='w-full py-2 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors'
          >
            {t('cancel')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Lobby;
