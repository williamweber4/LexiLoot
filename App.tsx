
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { GameState, UserProfile } from './types';
import WordleGrid from './components/WordleGrid';
import Keyboard from './components/Keyboard';
import AdOverlay from './components/AdOverlay';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState("");
  const [activeTab, setActiveTab] = useState<'GAME' | 'WALLET' | 'RANK'>('GAME');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const fetchUserSession = async () => {
    try {
      // 1. Supabase Anonymous Auth
      const { data: authData } = await supabase.signInAnonymously();
      
      if (authData?.user) {
        // 2. Fetch User Profile from Profiles table
        const { data: profile } = await (await supabase.from('profiles'))
          .select('*')
          .eq('uid', authData.user.id);
        
        setUser(profile as UserProfile);
      }
    } catch (e) {
      console.error("Supabase Auth Error:", e);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    fetchUserSession();
  }, []);

  useEffect(() => {
    if (!isInitializing && (activeTab === 'WALLET' || activeTab === 'GAME')) {
      fetchUserSession();
    }
  }, [activeTab]);

  const startNewGameRequest = async () => {
    setIsProcessing(true);
    try {
      // Game initiation still requires a round context (Client side setup)
      const { server } = await import('./services/mockBackend');
      const game = await server.initiateGameRequest(user!.uid);
      setCurrentGame(game);
      setCurrentGuess("");
    } catch (e) {
      setError("Failed to initialize round");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdComplete = async (adPayload: { adUnitId: string; eventId: string }) => {
    if (!currentGame) return;
    setIsProcessing(true);
    try {
      // Invoke Supabase Edge Function to verify ad and issue round token
      const { data, error: functionError } = await (await supabase.functions()).invoke('verify-ad', {
        body: { gameId: currentGame.gameId, adPayload }
      });
      
      if (functionError) throw new Error(functionError);
      setCurrentGame(data as GameState);
    } catch (e: any) {
      setError(e.message);
      setCurrentGame(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const onChar = (char: string) => {
    if (currentGame?.status === 'IN_PROGRESS' && currentGuess.length < currentGame.wordLength) {
      setCurrentGuess(prev => prev + char);
    }
  };

  const onDelete = () => {
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const onEnter = async () => {
    if (!currentGame || currentGame.status !== 'IN_PROGRESS' || !currentGame.roundToken) return;
    if (currentGuess.length !== currentGame.wordLength) return;

    setIsProcessing(true);
    try {
      // Invoke Edge Function to process guess
      const { data, error: functionError } = await (await supabase.functions()).invoke('submit-guess', {
        body: { gameId: currentGame.gameId, guess: currentGuess, token: currentGame.roundToken }
      });

      if (functionError) throw new Error(functionError);
      
      setCurrentGame(data as GameState);
      setCurrentGuess("");
      
      if (data.status === 'WON' || data.status === 'LOST') {
        fetchUserSession();
      }
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(null), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#121213] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col bg-[#121213]">
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center bg-[#121213] sticky top-0 z-40">
        <button onClick={() => setActiveTab('GAME')} className="text-xl font-black tracking-tighter text-white italic">
          LEXI<span className="text-green-500">LOOT</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-zinc-800 px-3 py-1 rounded-full text-[10px] font-black text-yellow-500 border border-yellow-500/30 uppercase">
            {user?.balance || 0} C
          </div>
          <button onClick={() => setActiveTab('WALLET')} className={`p-1 rounded-lg transition-colors ${activeTab === 'WALLET' ? 'text-green-500 bg-green-500/10' : 'text-zinc-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'GAME' ? (
          <div className="flex flex-col h-full py-4">
            {!currentGame || currentGame.status === 'PENDING_AD' ? (
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center mt-20">
                <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-900/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Round Entry</h2>
                <p className="text-zinc-400 mb-8 leading-relaxed text-sm">
                  Watch a secure ad to start your performance-based round.
                </p>
                <button
                  onClick={startNewGameRequest}
                  disabled={isProcessing}
                  className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-zinc-200 transition-all uppercase tracking-widest disabled:opacity-50"
                >
                  {isProcessing ? 'Authorizing...' : 'Play Round'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col flex-1 items-center gap-8">
                <WordleGrid 
                  guesses={currentGame.guesses} 
                  feedback={currentGame.feedback} 
                  currentGuess={currentGuess} 
                  wordLength={currentGame.wordLength}
                  shake={!!error}
                />
                
                {error && <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-xs font-black animate-bounce uppercase">{error}</div>}

                {currentGame.status === 'WON' && (
                  <div className="bg-zinc-900 border border-green-500/50 p-6 rounded-2xl w-full max-w-sm text-center mx-4">
                    <h3 className="text-xl font-black text-green-500 mb-2 uppercase italic">WINNER</h3>
                    <button onClick={startNewGameRequest} className="w-full bg-green-600 py-3 rounded-xl font-black uppercase text-sm">Next Entry</button>
                  </div>
                )}

                {currentGame.status === 'LOST' && (
                  <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-2xl w-full max-w-sm text-center mx-4">
                    <h3 className="text-xl font-black text-red-500 mb-2 uppercase italic">ROUND OVER</h3>
                    <button onClick={startNewGameRequest} className="w-full bg-zinc-700 py-3 rounded-xl font-black uppercase text-sm tracking-widest">Retry</button>
                  </div>
                )}

                <div className="mt-auto">
                  <Keyboard 
                    onChar={onChar} 
                    onEnter={onEnter} 
                    onDelete={onDelete} 
                    guessFeedback={currentGame.feedback} 
                  />
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'WALLET' ? (
          <Dashboard user={user} onClose={() => setActiveTab('GAME')} />
        ) : (
          <div className="p-8 text-center text-zinc-500 font-bold uppercase italic mt-20">Rankings coming soon...</div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#121213]/95 backdrop-blur-xl border-t border-zinc-800 flex justify-around p-4 shadow-2xl">
        <button onClick={() => setActiveTab('GAME')} className={`flex flex-col items-center gap-1 ${activeTab === 'GAME' ? 'text-green-500' : 'text-zinc-500'}`}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
          <span className="text-[10px] font-black uppercase italic">Play</span>
        </button>
        <button onClick={() => setActiveTab('RANK')} className={`flex flex-col items-center gap-1 ${activeTab === 'RANK' ? 'text-green-500' : 'text-zinc-500'}`}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[10px] font-black uppercase italic">Rank</span>
        </button>
      </nav>

      {currentGame?.status === 'PENDING_AD' && (
        <AdOverlay onComplete={handleAdComplete} onFail={() => setCurrentGame(null)} />
      )}
    </div>
  );
};

export default App;