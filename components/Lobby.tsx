import React, { useState, useEffect } from 'react';

interface RoomInfo {
  roomId: string;
  hasRed: boolean;
  hasBlue: boolean;
  createdAt: number;
}

interface LobbyProps {
  onJoinLocal: () => void;
  onJoinOnline: (roomId: string, role: 'host' | 'join') => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoinLocal, onJoinOnline }) => {
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState<'menu' | 'online-setup'>('menu');
  const [selectedColor, setSelectedColor] = useState<'red' | 'blue' | null>(
    null
  );
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Base URL for API (same origin as WebSocket but HTTP)
  const apiBaseUrl =
    import.meta.env.VITE_WS_URL?.replace('wss://', 'https://').replace(
      '/websocket',
      ''
    ) || '';

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
      setRooms(data);
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
      isFirstLoad.current = true; // Reset on mode change
      fetchRooms();
      // Refresh every 5 seconds
      const interval = setInterval(fetchRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const handleOnlineStart = () => {
    if (!roomId.trim() || !selectedColor) return;
    const role = selectedColor === 'red' ? 'host' : 'join';
    onJoinOnline(roomId, role);
  };

  const handleQuickJoin = (room: RoomInfo) => {
    // Auto-select available color and join directly
    const color = !room.hasRed ? 'red' : 'blue';
    const role = color === 'red' ? 'host' : 'join';
    onJoinOnline(room.roomId, role);
  };

  return (
    <div className='w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300'>
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-300 mb-2'>
          New Game
        </h2>
        <p className='text-slate-400 text-sm'>Select a game mode to begin</p>
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
                  Local Multiplayer
                </h3>
                <p className='text-xs text-slate-400'>Play on this device</p>
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
                  Online Multiplayer
                </h3>
                <p className='text-xs text-slate-400'>
                  Sync across devices/tabs
                </p>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Room ID Input */}
          <div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
            <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2'>
              Room ID
            </label>
            <input
              type='text'
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder='ENTER ROOM NAME'
              className='w-full bg-slate-900 text-center font-mono text-xl py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700'
              maxLength={8}
            />
          </div>

          {/* Color Selection */}
          <div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
            <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3'>
              Select Your Color
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
                🔴 Red
              </button>
              <button
                onClick={() => setSelectedColor('blue')}
                className={`py-3 px-4 font-bold rounded-xl transition-all ${
                  selectedColor === 'blue'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                    : 'bg-slate-700 text-blue-400 hover:bg-blue-600/20 border border-blue-500/30'
                }`}
              >
                🔵 Blue
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
                You will play as{' '}
                <span className='font-bold uppercase'>{selectedColor}</span>
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
              ? `Join as ${selectedColor.toUpperCase()}`
              : 'Select Room & Color'}
          </button>

          {/* Available Rooms */}
          {rooms.length > 0 && (
            <div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
              <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3'>
                Available Rooms ({rooms.length})
              </label>
              <div className='space-y-2 max-h-40 overflow-y-auto'>
                {rooms.map((room) => (
                  <button
                    key={room.roomId}
                    onClick={() => handleQuickJoin(room)}
                    className='w-full p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-slate-600 transition-all text-left flex items-center justify-between'
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
                        🔴 {room.hasRed ? 'Joined' : 'Open'}
                      </span>
                      <span
                        className={
                          room.hasBlue ? 'text-blue-400' : 'text-slate-500'
                        }
                      >
                        🔵 {room.hasBlue ? 'Joined' : 'Open'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className='text-center text-slate-500 text-sm'>
              Loading rooms...
            </div>
          )}

          <button
            onClick={() => {
              setMode('menu');
              setSelectedColor(null);
            }}
            className='w-full py-2 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors'
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default Lobby;
