import React from 'react';
import { Player } from '../types';

interface InfoPanelProps {
  turn: Player;
  redCount: number;
  blueCount: number;
  winner: Player | null;
  onReset: () => void;
  onOpenRules: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  turn,
  redCount,
  blueCount,
  winner,
  onReset,
  onOpenRules
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Score Card */}
      <div className="relative overflow-hidden bg-slate-800 rounded-2xl border border-slate-700 shadow-xl">
        {/* Active Turn Highlight Background */}
        <div className={`absolute inset-0 transition-colors duration-500 ${
            winner ? 'bg-slate-800' :
            turn === 'red' ? 'bg-gradient-to-r from-red-900/20 to-transparent' : 'bg-gradient-to-l from-blue-900/20 to-transparent'
        }`}></div>

        <div className="relative p-6 flex justify-between items-center z-10">
          
          {/* Red Player */}
          <div className={`flex flex-col items-center transition-all duration-300 ${turn === 'red' && !winner ? 'scale-110' : 'opacity-70'}`}>
            <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-lg mb-2 flex items-center justify-center border-2 ${turn === 'red' ? 'border-white' : 'border-transparent'}`}>
                    <span className="text-red-950 font-black text-lg">R</span>
                </div>
                {turn === 'red' && !winner && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-white text-red-600 font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                        YOUR TURN
                    </div>
                )}
            </div>
            <span className="text-3xl font-black text-white drop-shadow-md">{redCount}</span>
          </div>

          {/* Center Status */}
          <div className="flex flex-col items-center justify-center h-full px-4">
             {winner ? (
                 <div className="text-center animate-bounce">
                     <span className={`font-black text-2xl drop-shadow-md tracking-wider ${winner === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                        {winner === 'red' ? 'RED' : 'BLUE'}
                     </span>
                     <div className="text-xs text-white font-bold uppercase bg-slate-700 px-2 py-1 rounded mt-1">Wins</div>
                 </div>
             ) : (
                 <div className="text-slate-600 font-black text-xl italic opacity-50">VS</div>
             )}
          </div>

          {/* Blue Player */}
          <div className={`flex flex-col items-center transition-all duration-300 ${turn === 'blue' && !winner ? 'scale-110' : 'opacity-70'}`}>
            <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shadow-lg mb-2 flex items-center justify-center border-2 ${turn === 'blue' ? 'border-white' : 'border-transparent'}`}>
                     <span className="text-blue-950 font-black text-lg">B</span>
                </div>
                {turn === 'blue' && !winner && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-white text-blue-600 font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                        YOUR TURN
                    </div>
                )}
            </div>
            <span className="text-3xl font-black text-white drop-shadow-md">{blueCount}</span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onReset}
          className="group py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-500 shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
        <button
          onClick={onOpenRules}
          className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Rules
        </button>
      </div>
    </div>
  );
};

export default InfoPanel;