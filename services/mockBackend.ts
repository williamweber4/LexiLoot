
import { GameState, UserProfile, LetterStatus, GuessResult, AdEvent, RewardPool, WithdrawalRecord, RewardMethod, WithdrawalStatus, LedgerEntry, GiftCardInventory } from '../types';
import { INITIAL_WORD_LENGTH, MAX_GUESSES } from '../constants';

class MockBackend {
  private users: Record<string, UserProfile> = {};
  private games: Record<string, { word: string; state: GameState }> = {};
  private adEvents: Record<string, AdEvent> = {};
  private rewardPools: Record<string, RewardPool> = {};
  
  private coinLedger: LedgerEntry[] = [];
  private withdrawals: WithdrawalRecord[] = [];
  private inventory: GiftCardInventory[] = [
    { id: 'inv_1', method: RewardMethod.ROBUX, valueUsd: 10, code: 'RBX-9922-KLPQ-1102', used: false },
    { id: 'inv_2', method: RewardMethod.ROBUX, valueUsd: 10, code: 'RBX-7711-XMPA-8832', used: false },
    { id: 'inv_3', method: RewardMethod.VBUCKS, valueUsd: 10, code: 'VBK-4455-TTYY-0091', used: false },
    { id: 'inv_4', method: RewardMethod.VBUCKS, valueUsd: 10, code: 'VBK-2233-ZZQQ-5541', used: false },
  ];

  constructor() {
    this.loadState();
  }

  private loadState() {
    const saved = localStorage.getItem('lexiloot_supabase_mock');
    if (saved) {
      const data = JSON.parse(saved);
      this.users = data.users || {};
      this.games = data.games || {};
      this.adEvents = data.adEvents || {};
      this.rewardPools = data.rewardPools || {};
      this.coinLedger = data.coinLedger || [];
      this.withdrawals = data.withdrawals || [];
      this.inventory = data.inventory || this.inventory;
    }
  }

  private saveState() {
    localStorage.setItem('lexiloot_supabase_mock', JSON.stringify({
      users: this.users,
      games: this.games,
      adEvents: this.adEvents,
      rewardPools: this.rewardPools,
      coinLedger: this.coinLedger,
      withdrawals: this.withdrawals,
      inventory: this.inventory
    }));
  }

  private calculateBalance(uid: string): number {
    return this.coinLedger
      .filter(entry => entry.userId === uid)
      .reduce((acc, curr) => acc + curr.delta, 0);
  }

  async getRawLedger() {
    return this.coinLedger;
  }

  async initializeUser(uid: string): Promise<UserProfile> {
    if (!this.users[uid]) {
      this.users[uid] = {
        uid,
        username: `Player_${uid.slice(0, 5)}`,
        balance: 0,
        kycStatus: 'NONE',
        totalGames: 0,
        totalWins: 0,
        antiFraudFlags: []
      };
      this.addLedgerEntry(uid, 150, 'WELCOME_BONUS');
      this.saveState();
    }
    const balance = this.calculateBalance(uid);
    return { ...this.users[uid], balance };
  }

  private addLedgerEntry(uid: string, delta: number, reason: string) {
    this.coinLedger.push({
      id: `lg_${Math.random().toString(36).substring(7)}`,
      userId: uid,
      delta,
      reason,
      createdAt: Date.now()
    });
  }

  async requestWithdrawal(uid: string, method: RewardMethod): Promise<WithdrawalRecord> {
    const currentBalance = this.calculateBalance(uid);
    const COST = 100;

    if (currentBalance < COST) throw new Error("Insufficient coin balance");

    this.addLedgerEntry(uid, -COST, `REWARD_REDEMPTION_${method.toUpperCase()}`);

    const withdrawal: WithdrawalRecord = {
      id: `wd_${Math.random().toString(36).substring(7)}`,
      userId: uid,
      method,
      coinsSpent: COST,
      valueUsd: 10,
      status: WithdrawalStatus.PENDING,
      createdAt: Date.now()
    };

    this.withdrawals.unshift(withdrawal);
    this.saveState();
    setTimeout(() => this.fulfillWithdrawal(withdrawal.id), 5000);
    return withdrawal;
  }

  private async fulfillWithdrawal(withdrawalId: string) {
    const withdrawal = this.withdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal || withdrawal.status !== WithdrawalStatus.PENDING) return;
    const card = this.inventory.find(i => i.method === withdrawal.method && !i.used);
    if (card) {
      card.used = true;
      withdrawal.status = WithdrawalStatus.SENT;
      withdrawal.giftCardCode = card.code;
      this.saveState();
    }
  }

  async getWithdrawals(uid: string): Promise<WithdrawalRecord[]> {
    return this.withdrawals.filter(w => w.userId === uid);
  }

  async initiateGameRequest(uid: string): Promise<GameState> {
    const gameId = Math.random().toString(36).substring(7);
    const roundId = new Date().toISOString().slice(0, 10);
    const wordList = ['PROUD', 'SHARP', 'BLOCK', 'CHASE', 'FIELD', 'GUARD', 'LEVEL', 'SMART', 'TRUST', 'VALUE'];
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    const newState: GameState = { gameId, roundId, guesses: [], feedback: [], status: 'PENDING_AD', startTime: Date.now(), wordLength: INITIAL_WORD_LENGTH };
    this.games[gameId] = { word, state: newState };
    this.saveState();
    return { ...newState };
  }

  async verifyAdAndAuthorize(gameId: string, adPayload: { adUnitId: string; eventId: string; userId: string }): Promise<GameState> {
    const game = this.games[gameId];
    if (this.adEvents[adPayload.eventId]) throw new Error("Ad already claimed");
    this.adEvents[adPayload.eventId] = { ...adPayload, roundId: game.state.roundId, verified: true, timestamp: Date.now() };
    game.state.status = 'IN_PROGRESS';
    game.state.roundToken = `token_${Math.random().toString(36).substring(7)}`;
    this.saveState();
    return { ...game.state };
  }

  async submitGuess(gameId: string, guess: string, token: string, uid: string): Promise<GameState> {
    const game = this.games[gameId];
    if (!game || game.state.roundToken !== token) throw new Error("Unauthorized");
    const target = game.word.toUpperCase();
    const g = guess.toUpperCase();
    const result: GuessResult[] = g.split('').map((l, i) => {
      if (l === target[i]) return { letter: l, status: LetterStatus.CORRECT };
      if (target.includes(l)) return { letter: l, status: LetterStatus.PRESENT };
      return { letter: l, status: LetterStatus.ABSENT };
    });
    game.state.guesses.push(g);
    game.state.feedback.push(result);
    if (g === target) {
      game.state.status = 'WON';
      this.addLedgerEntry(uid, 10, 'ROUND_WIN_BONUS');
    } else if (game.state.guesses.length >= MAX_GUESSES) {
      game.state.status = 'LOST';
    }
    this.saveState();
    return { ...game.state };
  }

  getPoolSize(roundId: string) { return 12500; }
}

export const server = new MockBackend();