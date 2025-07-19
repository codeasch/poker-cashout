// Core data model interfaces as specified in the plan

export interface Session {
  id: string;
  name: string;
  currency: string; // e.g. "$"
  createdAt: number; // epoch ms
  closedAt?: number;
  players: { [playerId: string]: Player };
  buyIns: BuyIn[]; // chronological
  cashOuts: CashOut[]; // mid-game or final
  reentries: ReentryEvent[]; // optional
  settings: SessionSettings;
  status: 'open' | 'closed';
  settlement?: SettlementSnapshot;
  version: number; // schema
}

export interface Player { 
  id: string; 
  name: string; 
  color?: string; 
  createdAt: number; 
  active: boolean; 
  order: number; 
  rejoinCount: number; 
}

export interface BuyIn { 
  id: string; 
  sessionId: string; 
  playerId: string; 
  amountCents: number; 
  ts: number; 
  deleted?: boolean; 
}

export interface CashOut { 
  id: string; 
  sessionId: string; 
  playerId: string; 
  amountCents: number; 
  ts: number; 
  reason: 'leave' | 'final'; 
  supersededBy?: string; 
}

export interface ReentryEvent {
  id: string;
  sessionId: string;
  playerId: string;
  ts: number;
}

export interface SessionSettings { 
  varianceToleranceCents: number; 
  quickBuyInOptions: number[]; 
}

export interface SettlementSnapshot { 
  nets: PlayerNet[]; 
  transactions: SettlementTx[]; 
  varianceCents: number; 
  calculatedAt: number; 
  algorithm: string; 
}

export interface PlayerNet { 
  playerId: string; 
  buyInsCents: number; 
  cashOutCents: number; 
  netCents: number; 
}

export interface SettlementTx { 
  fromPlayerId: string; 
  toPlayerId: string; 
  amountCents: number; 
  paid?: boolean; 
}

export interface UserSettings {
  currency: string;
  quickBuyInOptions: number[]; // in cents
  defaultVarianceTolerance: number; // in cents
  theme: 'light' | 'dark' | 'auto';
  showConfirmations: boolean;
  autoSave: boolean;
  language: string;
}

export interface AppState {
  sessions: { [sessionId: string]: Session };
  activeSessionId: string | null;
  settings: UserSettings;
}

export type PlayerId = string;
export type SessionId = string; 