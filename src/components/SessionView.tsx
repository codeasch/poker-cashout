import { useState } from 'preact/hooks';
import { useStore } from '../store';
import { formatCurrency } from '../utils/currency';
import { PlayerRow } from './PlayerRow';
import { AddPlayerModal } from './AddPlayerModal';
import { EndGameWizard } from './EndGameWizard';
import { SettlementView } from './SettlementView';

interface SessionViewProps {
  sessionId: string;
  onBack: () => void;
}

export function SessionView({ sessionId, onBack }: SessionViewProps) {
  const { sessions, setActiveSession } = useStore();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showEndGame, setShowEndGame] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);

  const session = sessions[sessionId];
  if (!session) {
    return <div>Session not found</div>;
  }

  // Calculate totals
  const totalBuyIns = session.buyIns
    .filter(b => !b.deleted)
    .reduce((sum, b) => sum + b.amountCents, 0);

  const activePlayers = Object.values(session.players).filter(p => p.active);
  const canEndGame = session.status === 'open' && activePlayers.length >= 2;

  return (
    <div>
      {/* Header */}
      <div className="card-header mb-4">
        <div className="flex-1 min-w-0">
          <button 
            className="btn btn-secondary btn-sm mb-2"
            onClick={onBack}
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold truncate">{session.name}</h2>
          <p className="text-secondary text-sm">
            Total Bank: {formatCurrency(totalBuyIns, session.currency)}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap flex-shrink-0">
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
      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-3">Players</h3>
        {Object.values(session.players).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-secondary mb-4">No players yet. Add your first player!</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddPlayer(true)}
            >
              Add Player
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {Object.values(session.players)
                .sort((a, b) => a.order - b.order)
                .map(player => (
                  <PlayerRow key={player.id} session={session} player={player} />
                ))}
            </div>
            
            {/* Persistent Add Player Button */}
            {session.status === 'open' && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  className="btn btn-primary w-full"
                  onClick={() => setShowAddPlayer(true)}
                >
                  ➕ Add Player
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddPlayerModal 
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        sessionId={sessionId}
      />

      <EndGameWizard 
        isOpen={showEndGame}
        onClose={() => setShowEndGame(false)}
        sessionId={sessionId}
      />

      <SettlementView 
        isOpen={showSettlement}
        onClose={() => setShowSettlement(false)}
        session={session}
      />
    </div>
  );
} 