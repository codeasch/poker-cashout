import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Session, 
  Player, 
  BuyIn, 
  CashOut, 
  SessionSettings, 
  SettlementSnapshot,
  UserSettings,
  AppState 
} from '../types';
import { generateId } from '../utils/id';
import { calculateSettlement } from '../utils/settlement';

const DEFAULT_SETTINGS: UserSettings = {
  currency: '$',
  quickBuyInOptions: [2000, 4000, 10000], // $20, $40, $100 in cents
  defaultVarianceTolerance: 100, // $1.00 in cents
  theme: 'auto',
  showConfirmations: true,
  autoSave: true,
  language: 'en'
};

const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  varianceToleranceCents: 100,
  quickBuyInOptions: [2000, 4000, 10000]
};

export const useStore = create<AppState & {
  // Session actions
  createSession: (name: string, currency?: string) => void;
  setActiveSession: (sessionId: string | null) => void;
  deleteSession: (sessionId: string) => void;
  
  // Player actions
  addPlayer: (sessionId: string, name: string, color?: string) => void;
  removePlayer: (sessionId: string, playerId: string) => void;
  
  // Buy-in actions
  recordBuyIn: (sessionId: string, playerId: string, amountCents: number) => void;
  undoLastBuyIn: (sessionId: string) => void;
  undoLastBuyInForPlayer: (sessionId: string, playerId: string) => void;
  
  // Cash-out actions
  cashOutPlayer: (sessionId: string, playerId: string, amountCents: number, reason: 'leave' | 'final') => void;
  rejoinPlayer: (sessionId: string, playerId: string) => void;
  
  // Session finalization
  finalizeSession: (sessionId: string, finalStacks: Record<string, number>) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
  
  // Import/Export
  exportData: () => string;
  importData: (jsonData: string) => void;
  
  // Theme
  toggleTheme: () => void;
}>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeSessionId: null,
      settings: DEFAULT_SETTINGS,

      createSession: (name: string, currency?: string) => {
        const sessionId = generateId();
        const settings = get().settings;
        
        const newSession: Session = {
          id: sessionId,
          name,
          currency: currency || settings.currency,
          createdAt: Date.now(),
          players: {},
          buyIns: [],
          cashOuts: [],
          reentries: [],
          settings: {
            ...DEFAULT_SESSION_SETTINGS,
            quickBuyInOptions: settings.quickBuyInOptions,
            varianceToleranceCents: settings.defaultVarianceTolerance
          },
          status: 'open',
          version: 1
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: newSession
          },
          activeSessionId: sessionId
        }));
      },

      setActiveSession: (sessionId: string | null) => {
        set({ activeSessionId: sessionId });
      },

      deleteSession: (sessionId: string) => {
        set((state) => {
          const { [sessionId]: deleted, ...remainingSessions } = state.sessions;
          return {
            sessions: remainingSessions,
            activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
          };
        });
      },

      addPlayer: (sessionId: string, name: string, color?: string) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const playerId = generateId();
          const playerCount = Object.keys(session.players).length;
          
          const newPlayer: Player = {
            id: playerId,
            name,
            color,
            createdAt: Date.now(),
            active: true,
            order: playerCount,
            rejoinCount: 0
          };

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                players: {
                  ...session.players,
                  [playerId]: newPlayer
                }
              }
            }
          };
        });
      },

      removePlayer: (sessionId: string, playerId: string) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const { [playerId]: removed, ...remainingPlayers } = session.players;
          
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                players: remainingPlayers
              }
            }
          };
        });
      },

      recordBuyIn: (sessionId: string, playerId: string, amountCents: number) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const buyIn: BuyIn = {
            id: generateId(),
            sessionId,
            playerId,
            amountCents,
            ts: Date.now()
          };

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                buyIns: [...session.buyIns, buyIn]
              }
            }
          };
        });
      },

      undoLastBuyIn: (sessionId: string) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session || session.buyIns.length === 0) return state;

          const updatedBuyIns = [...session.buyIns];
          updatedBuyIns[updatedBuyIns.length - 1] = {
            ...updatedBuyIns[updatedBuyIns.length - 1],
            deleted: true
          };

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

      undoLastBuyInForPlayer: (sessionId: string, playerId: string) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const playerBuyIns = session.buyIns
            .filter(b => b.playerId === playerId && !b.deleted)
            .sort((a, b) => b.ts - a.ts);

          if (playerBuyIns.length === 0) return state;

          const lastBuyIn = playerBuyIns[0];
          const updatedBuyIns = session.buyIns.map(b => 
            b.id === lastBuyIn.id ? { ...b, deleted: true } : b
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

      cashOutPlayer: (sessionId: string, playerId: string, amountCents: number, reason: 'leave' | 'final') => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const cashOut: CashOut = {
            id: generateId(),
            sessionId,
            playerId,
            amountCents,
            ts: Date.now(),
            reason
          };

          // Update player status
          const updatedPlayers = {
            ...session.players,
            [playerId]: {
              ...session.players[playerId],
              active: false
            }
          };

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                cashOuts: [...session.cashOuts, cashOut],
                players: updatedPlayers
              }
            }
          };
        });
      },

      rejoinPlayer: (sessionId: string, playerId: string) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const player = session.players[playerId];
          if (!player) return state;

          const reentry = {
            id: generateId(),
            sessionId,
            playerId,
            ts: Date.now()
          };

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                reentries: [...session.reentries, reentry],
                players: {
                  ...session.players,
                  [playerId]: {
                    ...player,
                    active: true,
                    rejoinCount: player.rejoinCount + 1
                  }
                }
              }
            }
          };
        });
      },

      finalizeSession: (sessionId: string, finalStacks: Record<string, number>) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          // Record final cash-outs for active players
          const finalCashOuts: CashOut[] = Object.entries(finalStacks).map(([playerId, amountCents]) => ({
            id: generateId(),
            sessionId,
            playerId,
            amountCents,
            ts: Date.now(),
            reason: 'final' as const
          }));

          // Compute settlement
          const allCashOuts = [...session.cashOuts, ...finalCashOuts];
          const sessionWithFinalCashOuts = {
            ...session,
            cashOuts: allCashOuts
          };
          const settlement = calculateSettlement(sessionWithFinalCashOuts);

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                cashOuts: allCashOuts,
                status: 'closed',
                closedAt: Date.now(),
                settlement
              }
            }
          };
        });
      },

      updateSettings: (newSettings: Partial<UserSettings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings
          }
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },

      exportData: () => {
        const state = get();
        return JSON.stringify({
          sessions: state.sessions,
          settings: state.settings,
          version: 1,
          exportedAt: new Date().toISOString()
        });
      },

      importData: (jsonData: string) => {
        try {
          const data = JSON.parse(jsonData);
          set({
            sessions: data.sessions || {},
            settings: data.settings || DEFAULT_SETTINGS,
            activeSessionId: null
          });
        } catch (error) {
          console.error('Failed to import data:', error);
        }
      },

      toggleTheme: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'light' ? 'dark' : 'light'
          }
        }));
      }
    }),
    {
      name: 'poker-cashout-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate from old format
          return {
            sessions: persistedState.sessions || {},
            activeSessionId: persistedState.activeSessionId || null,
            settings: {
              ...DEFAULT_SETTINGS,
              theme: persistedState.theme || 'auto'
            }
          };
        }
        return persistedState;
      }
    }
  )
); 