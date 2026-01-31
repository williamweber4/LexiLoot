
import React, { useState, useEffect } from 'react';
import { AD_WAIT_SECONDS } from '../constants';

interface AdOverlayProps {
  onComplete: (payload: { adUnitId: string; eventId: string }) => void;
  onFail: () => void;
}

const AdOverlay: React.FC<AdOverlayProps> = ({ onComplete, onFail }) => {
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(AD_WAIT_SECONDS);
  const [canClose, setCanClose] = useState(false);

  // Simulate AdMob SDK loading state
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!loading) {
      setCanClose(true);
    }
  }, [timeLeft, loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Requesting Ad...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
        <div className="absolute top-0 left-0 h-1 bg-green-500 transition-all duration-1000" 
             style={{ width: `${((AD_WAIT_SECONDS - timeLeft) / AD_WAIT_SECONDS) * 100}%` }} />
        
        <div className="mb-6 flex justify-center">
           <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
           </div>
        </div>

        <h2 className="text-2xl font-black mb-2 text-white uppercase tracking-tight">Earn Coins</h2>
        <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
          Unlock your next round. Rewards are based on performance and distributed to the <span className="text-white font-bold">top 10%</span> of players.
        </p>
        
        {!canClose ? (
          <div className="bg-zinc-800 rounded-2xl py-4 px-6 text-zinc-300 font-mono text-sm">
            SECURE AD PLAYING: {timeLeft}s
          </div>
        ) : (
          <button
            onClick={() => onComplete({ 
              adUnitId: 'ca-app-pub-3940256099942544/5224354917', 
              eventId: `evt_${Math.random().toString(36).substring(7)}` 
            })}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-2xl transition-all scale-105 uppercase tracking-widest shadow-xl shadow-green-900/40"
          >
            PLAY
          </button>
        )}

        <button 
          onClick={onFail}
          className="mt-8 text-zinc-500 text-xs font-bold hover:text-white transition-colors uppercase tracking-widest"
        >
          Cancel Round
        </button>
      </div>
    </div>
  );
};

export default AdOverlay;
