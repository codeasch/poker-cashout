import { useState } from 'preact/hooks';
import { useAppStore } from '../store';
import type { Session } from '../types';
import { PlayerRow } from './PlayerRow';
import { AddPlayerModal } from './AddPlayerModal';
import { EndGameWizard } from './EndGameWizard';
import { SettlementView } from './SettlementView';
import { formatCurrency } from '../utils/currency';

interface SessionViewProps {
  session: Session;
}

export function SessionView({ session }: SessionViewProps) {
  const { setActiveSession } = useAppStore();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showEndGame, setShowEndGame] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);

  const totalBuyIns = session.buyIns
    .filter(buyIn => !buyIn.deleted)
    .reduce((sum, buyIn) => sum + buyIn.amountCents, 0);

  const activePlayers = Object.values(session.players).filter(p => p.active);
  const leftPlayers = Object.values(session.players).filter(p => !p.active);

  const canEndGame = activePlayers.length >= 2;

  return (
    <div>
      {/* Header */}
      <div className="card-header mb-4">
        <div>
          <button 
            className="btn btn-secondary btn-sm mb-2"
            onClick={() => setActiveSession('')}
          >
            ← Back to Sessions
          </button>
          <h2 className="text-xl font-bold">{session.name}</h2>
          <p className="text-secondary text-sm">
            Total Bank: {formatCurrency(totalBuyIns, session.currency)}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {session.status === 'open' && (
            <>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddPlayer(true)}
              >
                Add Player
              </button>
              {canEndGame && (
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => setShowEndGame(true)}
                >
                  End Game
                </button>
              )}
            </>
          )}
          {session.status === 'closed' && session.settlement && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowSettlement(true)}
            >
              View Settlement
            </button>
          )}
        </div>
      </div>

      {/* Players */}
      <div className="space-y-4">
        {activePlayers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Active Players</h3>
            <div className="space-y-3">
              {activePlayers.map((player) => (
                <PlayerRow 
                  key={player.id} 
                  session={session} 
                  player={player} 
                />
              ))}
            </div>
          </div>
        )}

        {leftPlayers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Left Players</h3>
            <div className="space-y-3">
              {leftPlayers.map((player) => (
                <PlayerRow 
                  key={player.id} 
                  session={session} 
                  player={player} 
                />
              ))}
            </div>
          </div>
        )}

        {Object.values(session.players).length === 0 && (
          <div className="card text-center">
            <h3 className="text-lg font-semibold mb-2">No players yet</h3>
            <p className="text-secondary mb-4">Add players to start tracking buy-ins.</p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddPlayer(true)}
            >
              Add First Player
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button for End Game */}
      {session.status === 'open' && canEndGame && (
        <button 
          className="fab"
          onClick={() => setShowEndGame(true)}
          aria-label="End Game"
        >
          🏁
        </button>
      )}

      {/* Modals */}
      {showAddPlayer && (
        <AddPlayerModal 
          sessionId={session.id} 
          onClose={() => setShowAddPlayer(false)} 
        />
      )}

      {showEndGame && (
        <EndGameWizard 
          session={session} 
          onClose={() => setShowEndGame(false)} 
        />
      )}

      {showSettlement && session.settlement && (
        <SettlementView 
          session={session}
          settlement={session.settlement}
          onClose={() => setShowSettlement(false)}
        />
      )}
    </div>
  );
} 