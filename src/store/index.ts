import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  AppState, 
  Session, 
  Player, 
  BuyIn, 
  CashOut, 
  ReentryEvent,
  SessionSettings,
  PlayerId,
  SessionId
} from '../types';
import { 
  generateSessionId, 
  generatePlayerId, 
  generateBuyInId, 
  generateCashOutId 
} from '../utils/id';
import { calculateSettlement } from '../utils/settlement';
import { validateAmount } from '../utils/currency';

const SCHEMA_VERSION = 1;

const defaultSessionSettings: SessionSettings = {
  varianceToleranceCents: 100, // $1.00 tolerance
  quickBuyInOptions: [2000, 4000, 10000] // $20, $40, $100
};

interface AppStore extends AppState {
  // Session management
  createSession: (payload: { name: string; currency: string; settings?: Partial<SessionSettings> }) => SessionId;
  deleteSession: (sessionId: SessionId) => void;
  setActiveSession: (sessionId: SessionId) => void;
  
  // Player management
  addPlayer: (sessionId: SessionId, name: string, color?: string) => PlayerId;
  updatePlayer: (sessionId: SessionId, playerId: PlayerId, updates: Partial<Player>) => void;
  removePlayer: (sessionId: SessionId, playerId: PlayerId) => void;
  
  // Buy-in management
  recordBuyIn: (sessionId: SessionId, playerId: PlayerId, amountCents: number) => void;
  undoLastBuyIn: (sessionId: SessionId) => void;
  undoLastBuyInForPlayer: (sessionId: SessionId, playerId: PlayerId) => void;
  
  // Cash-out management
  cashOutPlayer: (sessionId: SessionId, playerId: PlayerId, amountCents: number, reason: 'leave' | 'final') => void;
  editCashOut: (sessionId: SessionId, cashOutId: string, newAmountCents: number) => void;
  rejoinPlayer: (sessionId: SessionId, playerId: PlayerId) => void;
  
  // Session finalization
  finalizeSession: (sessionId: SessionId, finalStacksMap: Record<PlayerId, number>) => void;
  
  // Import/Export
  exportSession: (sessionId: SessionId) => string;
  importSessions: (json: string) => void;
  
  // Theme
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Utility
  getSession: (sessionId: SessionId) => Session | undefined;
  getActiveSession: () => Session | undefined;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeSessionId: undefined,
      theme: 'dark' as const,
      version: SCHEMA_VERSION,

      createSession: (payload: { name: string; currency: string; settings?: Partial<SessionSettings> }) => {
        const sessionId = generateSessionId();
        const session: Session = {
          id: sessionId,
          name: payload.name,
          currency: payload.currency,
          createdAt: Date.now(),
          players: {},
          buyIns: [],
          cashOuts: [],
          reentries: [],
          settings: { ...defaultSessionSettings, ...payload.settings },
          status: 'open',
          version: SCHEMA_VERSION
        };

        set((state) => ({
          sessions: { ...state.sessions, [sessionId]: session },
          activeSessionId: sessionId
        }));

        return sessionId;
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const newSessions = { ...state.sessions };
          delete newSessions[sessionId];
          return {
            sessions: newSessions,
            activeSessionId: state.activeSessionId === sessionId ? undefined : state.activeSessionId
          };
        });
      },

      setActiveSession: (sessionId) => {
        set({ activeSessionId: sessionId });
      },

      addPlayer: (sessionId, name, color) => {
        const playerId = generatePlayerId();
        const player: Player = {
          id: playerId,
          name,
          color,
          createdAt: Date.now(),
          active: true,
          order: Object.keys(get().sessions[sessionId]?.players || {}).length,
          rejoinCount: 0
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              players: { ...state.sessions[sessionId].players, [playerId]: player }
            }
          }
        }));

        return playerId;
      },

      updatePlayer: (sessionId, playerId, updates) => {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              players: {
                ...state.sessions[sessionId].players,
                [playerId]: { ...state.sessions[sessionId].players[playerId], ...updates }
              }
            }
          }
        }));
      },

      removePlayer: (sessionId, playerId) => {
        const session = get().sessions[sessionId];
        if (!session) return;

        // Only allow removal if player has no financial activity
        const hasBuyIns = session.buyIns.some(buyIn => buyIn.playerId === playerId && !buyIn.deleted);
        const hasCashOuts = session.cashOuts.some(cashOut => cashOut.playerId === playerId && !cashOut.supersededBy);

        if (hasBuyIns || hasCashOuts) {
          throw new Error('Cannot remove player with financial activity. Use cash out instead.');
        }

        set((state) => {
          const newPlayers = { ...state.sessions[sessionId].players };
          delete newPlayers[playerId];
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...state.sessions[sessionId],
                players: newPlayers
              }
            }
          };
        });
      },

      recordBuyIn: (sessionId, playerId, amountCents) => {
        if (!validateAmount(amountCents)) {
          throw new Error('Invalid buy-in amount');
        }

        const buyIn: BuyIn = {
          id: generateBuyInId(),
          sessionId,
          playerId,
          amountCents,
          ts: Date.now()
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              buyIns: [...state.sessions[sessionId].buyIns, buyIn]
            }
          }
        }));
      },

      undoLastBuyIn: (sessionId) => {
        set((state) => {
          const session = state.sessions[sessionId];
          const lastBuyIn = session.buyIns[session.buyIns.length - 1];
          if (!lastBuyIn) return state;

          const updatedBuyIns = session.buyIns.map((buyIn, index) => 
            index === session.buyIns.length - 1 ? { ...buyIn, deleted: true } : buyIn
          );

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                buyIns: updatedBuyIns
              }
            }
          };
        });
      },

      undoLastBuyInForPlayer: (sessionId, playerId) => {
        set((state) => {
          const session = state.sessions[sessionId];
          const playerBuyIns = session.buyIns
            .filter(buyIn => buyIn.playerId === playerId && !buyIn.deleted)
            .sort((a, b) => b.ts - a.ts);

          if (playerBuyIns.length === 0) return state;

          const lastBuyIn = playerBuyIns[0];
          const updatedBuyIns = session.buyIns.map(buyIn => 
            buyIn.id === lastBuyIn.id ? { ...buyIn, deleted: true } : buyIn
          );

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                buyIns: updatedBuyIns
              }
            }
          };
        });
      },

      cashOutPlayer: (sessionId, playerId, amountCents, reason) => {
        const cashOut: CashOut = {
          id: generateCashOutId(),
          sessionId,
          playerId,
          amountCents,
          ts: Date.now(),
          reason
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              cashOuts: [...state.sessions[sessionId].cashOuts, cashOut],
              players: {
                ...state.sessions[sessionId].players,
                [playerId]: {
                  ...state.sessions[sessionId].players[playerId],
                  active: false
                }
              }
            }
          }
        }));
      },

      editCashOut: (sessionId, cashOutId, newAmountCents) => {
        const newCashOut: CashOut = {
          id: generateCashOutId(),
          sessionId,
          playerId: get().sessions[sessionId].cashOuts.find(c => c.id === cashOutId)?.playerId || '',
          amountCents: newAmountCents,
          ts: Date.now(),
          reason: 'leave'
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              cashOuts: [
                ...state.sessions[sessionId].cashOuts.map(c => 
                  c.id === cashOutId ? { ...c, supersededBy: newCashOut.id } : c
                ),
                newCashOut
              ]
            }
          }
        }));
      },

      rejoinPlayer: (sessionId, playerId) => {
        const reentry: ReentryEvent = {
          id: generateBuyInId(),
          sessionId,
          playerId,
          ts: Date.now()
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              reentries: [...state.sessions[sessionId].reentries, reentry],
              players: {
                ...state.sessions[sessionId].players,
                [playerId]: {
                  ...state.sessions[sessionId].players[playerId],
                  active: true,
                  rejoinCount: state.sessions[sessionId].players[playerId].rejoinCount + 1
                }
              }
            }
          }
        }));
      },

      finalizeSession: (sessionId, finalStacksMap) => {
        const session = get().sessions[sessionId];
        if (!session) return;

        // Record final cashouts for active players
        const finalCashOuts: CashOut[] = Object.entries(finalStacksMap).map(([playerId, amountCents]) => ({
          id: generateCashOutId(),
          sessionId,
          playerId,
          amountCents,
          ts: Date.now(),
          reason: 'final'
        }));

        const settlement = calculateSettlement({
          ...session,
          cashOuts: [...session.cashOuts, ...finalCashOuts]
        });

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              cashOuts: [...state.sessions[sessionId].cashOuts, ...finalCashOuts],
              status: 'closed',
              closedAt: Date.now(),
              settlement
            }
          }
        }));
      },

      exportSession: (sessionId) => {
        const session = get().sessions[sessionId];
        return JSON.stringify(session, null, 2);
      },

      importSessions: (json) => {
        try {
          const importedSessions = JSON.parse(json);
          set((state) => ({
            sessions: { ...state.sessions, ...importedSessions }
          }));
        } catch (error) {
          throw new Error('Invalid import data');
        }
      },

      setTheme: (theme) => {
        set({ theme });
      },

      getSession: (sessionId) => {
        return get().sessions[sessionId];
      },

      getActiveSession: () => {
        const { activeSessionId, sessions } = get();
        return activeSessionId ? sessions[activeSessionId] : undefined;
      }
    }),
    {
      name: 'poker-cashout-storage',
      version: SCHEMA_VERSION,
      migrate: (persistedState: any, version: number) => {
        // Handle future schema migrations here
        return persistedState;
      }
    }
  )
); 