
export enum LetterStatus {
  CORRECT = 'correct',
  PRESENT = 'present',
  ABSENT = 'absent',
  EMPTY = 'empty'
}

export interface GuessResult {
  letter: string;
  status: LetterStatus;
}

export interface GameState {
  gameId: string;
  roundId: string;
  guesses: string[];
  feedback: GuessResult[][];
  status: 'IN_PROGRESS' | 'WON' | 'LOST' | 'PENDING_AD';
  startTime: number;
  endTime?: number;
  wordLength: number;
  roundToken?: string;
}

// Fix: Added missing AdEvent interface to support ad verification tracking in the backend
export interface AdEvent {
  adUnitId: string;
  eventId: string;
  userId: string;
  roundId: string;
  verified: boolean;
  timestamp: number;
}

// Fix: Added missing RewardPool interface to support simulation of performance-based coin pools
export interface RewardPool {
  roundId: string;
  totalCoins: number;
  distributed: boolean;
}

// Supabase Table: coin_ledger
export interface LedgerEntry {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  createdAt: number;
}

// Supabase Table: withdrawals
export enum WithdrawalStatus {
  PENDING = 'pending',
  SENT = 'sent',
  REJECTED = 'rejected'
}

export enum RewardMethod {
  ROBUX = 'robux',
  VBUCKS = 'vbucks'
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  method: RewardMethod;
  coinsSpent: number;
  valueUsd: number;
  status: WithdrawalStatus;
  giftCardCode?: string;
  createdAt: number;
}

// Supabase Table: gift_card_inventory
export interface GiftCardInventory {
  id: string;
  method: RewardMethod;
  valueUsd: number;
  code: string;
  used: boolean;
}

export interface UserProfile {
  uid: string;
  username: string;
  balance: number; // Derived from ledger
  kycStatus: 'NONE' | 'PENDING' | 'VERIFIED';
  totalGames: number;
  totalWins: number;
  antiFraudFlags: string[];
}
