import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-600">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">How to Play</h2>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>

          <div className="space-y-4 text-slate-300">
            <section>
              <h3 className="text-indigo-400 font-bold text-lg mb-2">Objective</h3>
              <p>Eliminate opponent pieces. You win when the opponent has only <strong>1 piece left</strong>.</p>
            </section>

            <section>
              <h3 className="text-indigo-400 font-bold text-lg mb-2">Movement</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Players take turns moving <strong>one piece</strong>.</li>
                <li>A piece can move <strong>one step</strong> horizontally or vertically to an adjacent empty spot.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-red-400 font-bold text-lg mb-2">Capturing (The "Two-Against-One")</h3>
              <p className="mb-2">An enemy piece is removed if you move your piece to form a connected line of <strong>three</strong> pieces in the pattern:</p>
              <div className="bg-slate-900 p-3 rounded-lg font-mono text-center text-sm border border-slate-700">
                [YOU] - [YOU] - [ENEMY]<br/>
                <span className="text-xs text-slate-500">or</span><br/>
                [ENEMY] - [YOU] - [YOU]
              </div>
              <p className="mt-2 text-sm italic">Note: You must be the one moving to trigger the capture.</p>
            </section>

            <section>
              <h3 className="text-yellow-400 font-bold text-lg mb-2">Special Rules</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-100">Safe Approach:</strong> If two enemy pieces are already adjacent, and you move next to them (creating [ENEMY]-[ENEMY]-[YOU]), your piece is <strong>NOT</strong> captured. Captures only happen when the aggressor forms the pair.
                </li>
                <li>
                  <strong className="text-slate-100">Full Line Immunity:</strong> If a row or column is completely full (4 pieces), <strong>NO</strong> captures can occur on that line, even if the capture pattern exists.
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
            >
              Got it, let's play!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
