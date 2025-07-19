import { useState } from 'preact/hooks';
import { useStore } from '../store';
import { CreateSessionModal } from './CreateSessionModal';

export function SessionList() {
  const { sessions, setActiveSession, createSession, deleteSession } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateSession = (name: string, currency?: string) => {
    createSession(name, currency);
    setShowCreateModal(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      deleteSession(sessionId);
    }
  };

  const sessionList = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <div className="card-header mb-4">
        <h2 className="text-xl font-bold">Sessions</h2>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => setShowCreateModal(true)}
        >
          New Session
        </button>
      </div>

      {sessionList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-secondary mb-4">No sessions yet. Create your first poker session!</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Session
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionList.map(session => (
            <div key={session.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{session.name}</h3>
                  <div className="text-sm text-secondary">
                    Created: {new Date(session.createdAt).toLocaleDateString()}
                    {session.closedAt && (
                      <span className="ml-2">• Closed: {new Date(session.closedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="text-sm text-secondary">
                    Players: {Object.keys(session.players).length} • 
                    Status: <span className={session.status === 'open' ? 'text-success' : 'text-secondary'}>
                      {session.status === 'open' ? 'Active' : 'Closed'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {session.status === 'open' && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveSession(session.id)}
                    >
                      Open
                    </button>
                  )}
                  {session.status === 'closed' && session.settlement && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveSession(session.id)}
                    >
                      View Settlement
                    </button>
                  )}
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateSessionModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateSession}
      />
    </div>
  );
} 