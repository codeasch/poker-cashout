import { useState } from 'preact/hooks';
import { useAppStore } from '../store';
import { CreateSessionModal } from './CreateSessionModal';
import { formatCurrency } from '../utils/currency';

export function SessionList() {
  const { sessions, setActiveSession, deleteSession } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const sessionList = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt);

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      deleteSession(sessionId);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Sessions</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCreateModal(true)}
        >
          New Session
        </button>
      </div>

      {sessionList.length === 0 ? (
        <div className="card text-center">
          <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
          <p className="text-secondary mb-4">Create your first poker session to get started.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreateModal(true)}
          >
            Create Session
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessionList.map((session) => {
            const totalBuyIns = session.buyIns
              .filter(buyIn => !buyIn.deleted)
              .reduce((sum, buyIn) => sum + buyIn.amountCents, 0);
            
            const activePlayers = Object.values(session.players).filter(p => p.active).length;
            const totalPlayers = Object.values(session.players).length;

            return (
              <div key={session.id} className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{session.name}</h3>
                    <p className="text-secondary text-sm">
                      {new Date(session.createdAt).toLocaleDateString()} • 
                      {session.status === 'open' ? ' Active' : ' Closed'} • 
                      {totalPlayers} player{totalPlayers !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {session.status === 'open' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveSession(session.id)}
                      >
                        Continue
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveSession(session.id)}
                    >
                      View
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary">Total Buy-ins:</span>
                    <div className="font-semibold">{formatCurrency(totalBuyIns, session.currency)}</div>
                  </div>
                  <div>
                    <span className="text-secondary">Active Players:</span>
                    <div className="font-semibold">{activePlayers}/{totalPlayers}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateSessionModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
} 