
import { RewardMethod, WithdrawalRecord, UserProfile, LedgerEntry } from '../types';
import { server } from '../services/mockBackend';

/**
 * MOCKED SUPABASE CLIENT
 * In a real app, you would use:
 * import { createClient } from '@supabase/supabase-js'
 * const supabase = createClient(URL, KEY)
 */

class SupabaseService {
  private userId: string | null = null;

  async signInAnonymously() {
    // Check persistence
    const savedId = localStorage.getItem('supabase_anonymous_id');
    if (savedId) {
      this.userId = savedId;
    } else {
      this.userId = `anon_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('supabase_anonymous_id', this.userId);
    }
    
    // Ensure profile exists in "Supabase"
    await server.initializeUser(this.userId);
    return { data: { user: { id: this.userId } }, error: null };
  }

  get user() {
    return this.userId ? { id: this.userId } : null;
  }

  // Simulated Database Queries with RLS
  async from(table: string) {
    const uid = this.userId;
    return {
      select: (query: string = '*') => ({
        eq: async (column: string, value: any) => {
          if (!uid) throw new Error("Unauthorized");
          
          switch(table) {
            case 'profiles':
              const profile = await server.initializeUser(uid);
              return { data: profile, error: null };
            case 'coin_ledger':
              const ledger = (await server.getRawLedger()).filter(l => l.userId === uid);
              return { data: ledger, error: null };
            case 'withdrawals':
              const withdrawals = await server.getWithdrawals(uid);
              return { data: withdrawals, error: null };
            default:
              return { data: [], error: null };
          }
        }
      })
    };
  }

  // Simulated Edge Functions (The ONLY way to write data)
  async functions() {
    return {
      invoke: async (functionName: string, { body }: { body: any }) => {
        if (!this.userId) throw new Error("Unauthorized");
        
        switch(functionName) {
          case 'request-withdrawal':
            try {
              const res = await server.requestWithdrawal(this.userId, body.method);
              return { data: res, error: null };
            } catch (e: any) {
              return { data: null, error: e.message };
            }
          case 'submit-guess':
            try {
              const res = await server.submitGuess(body.gameId, body.guess, body.token, this.userId);
              return { data: res, error: null };
            } catch (e: any) {
              return { data: null, error: e.message };
            }
          case 'verify-ad':
            try {
              const res = await server.verifyAdAndAuthorize(body.gameId, { ...body.adPayload, userId: this.userId });
              return { data: res, error: null };
            } catch (e: any) {
              return { data: null, error: e.message };
            }
          default:
            return { data: null, error: 'Function not found' };
        }
      }
    };
  }
}

export const supabase = new SupabaseService();
