
import React, { useState, useEffect } from 'react';
import { UserProfile, RewardMethod, WithdrawalRecord, WithdrawalStatus } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  user: UserProfile | null;
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onClose }) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWithdrawals = async () => {
    if (user) {
      // Supabase RLS protected fetch
      const { data } = await (await supabase.from('withdrawals'))
        .select('*')
        .eq('userId', user.uid);
      
      setWithdrawals(data as WithdrawalRecord[]);
    }
  };

  useEffect(() => {
    refreshWithdrawals();
    const interval = setInterval(refreshWithdrawals, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRedeem = async (method: RewardMethod) => {
    if (!user) return;
    setIsRedeeming(true);
    setError(null);
    try {
      // Invoke Supabase Edge Function to safely process withdrawal
      const { data, error: functionError } = await (await supabase.functions()).invoke('request-withdrawal', {
        body: { method }
      });
      
      if (functionError) throw new Error(functionError);
      
      await refreshWithdrawals();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsRedeeming(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Available Coins</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white">{user.balance}</span>
          <span className="text-yellow-500 font-bold text-sm italic">C</span>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-white text-xs font-black uppercase tracking-widest px-1">Redeem for Rewards</h3>
        {error && <div className="text-red-500 text-[10px] font-black uppercase bg-red-500/10 p-2 rounded-lg text-center">{error}</div>}
        
        <div className="grid grid-cols-1 gap-4">
          {[RewardMethod.ROBUX, RewardMethod.VBUCKS].map((method) => (
            <div key={method} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg 
                  ${method === RewardMethod.ROBUX ? 'bg-indigo-600' : 'bg-blue-500'}`}>
                  {method === RewardMethod.ROBUX ? 'R$' : 'VB'}
                </div>
                <div>
                  <div className="font-black text-white uppercase tracking-tight">$10 {method === RewardMethod.ROBUX ? 'Robux' : 'V-Bucks'} Card</div>
                  <div className="text-[10px] text-zinc-500 font-bold">100 COINS</div>
                </div>
              </div>
              <button
                onClick={() => handleRedeem(method)}
                disabled={user.balance < 100 || isRedeeming}
                className="bg-green-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                REDEEM
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest px-1">My Codes</h3>
        <div className="space-y-4">
          {withdrawals.length === 0 ? (
            <div className="text-center py-10 text-zinc-600 text-[10px] font-black uppercase border border-dashed border-zinc-800 rounded-3xl">No redemptions yet</div>
          ) : (
            withdrawals.map((w) => (
              <div key={w.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 flex items-center justify-between border-b border-zinc-800">
                  <div>
                    <div className="text-xs font-black text-white uppercase">$10 {w.method} Card</div>
                    <div className="text-[9px] text-zinc-500 font-bold">{new Date(w.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className={`text-[9px] font-black uppercase px-2 py-1 rounded border
                    ${w.status === WithdrawalStatus.SENT ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5'}`}>
                    {w.status}
                  </div>
                </div>
                
                {w.status === WithdrawalStatus.SENT && w.giftCardCode ? (
                  <div className="p-4 bg-zinc-800/50 space-y-3">
                    <div className="bg-black/40 border border-zinc-700 p-3 rounded-xl font-mono text-sm text-green-400 font-bold text-center tracking-widest select-all">
                      {w.giftCardCode}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-bold italic text-center uppercase tracking-tight">
                      {w.method === RewardMethod.ROBUX ? "Redeem at roblox.com/redeem" : "Redeem at fortnite.com/vbuckscard"}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <div className="text-[10px] text-zinc-600 font-black uppercase italic animate-pulse">Verification in progress...</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <p className="text-[9px] text-zinc-600 text-center leading-relaxed italic border-t border-zinc-800/50 pt-8">
        Coins are virtual and have no cash value. Codes are fetched securely from server.
      </p>
    </div>
  );
};

export default Dashboard;
