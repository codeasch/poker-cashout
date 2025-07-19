import { useState } from 'preact/hooks';
import { useStore } from '../store';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, currency?: string) => void;
}

export function CreateSessionModal({ isOpen, onClose, onCreate }: CreateSessionModalProps) {
  const { settings } = useStore();
  const [sessionName, setSessionName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(settings.currency);

  if (!isOpen) return null;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (sessionName.trim()) {
      onCreate(sessionName.trim(), selectedCurrency);
      setSessionName('');
      setSelectedCurrency(settings.currency);
    }
  };

  const handleCancel = () => {
    setSessionName('');
    setSelectedCurrency(settings.currency);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Create New Session</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Session Name</label>
            <input
              type="text"
              className="form-input"
              value={sessionName}
              onChange={(e) => setSessionName(e.currentTarget.value)}
              placeholder="e.g., Friday Night Poker"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Currency</label>
            <div className="flex gap-2">
              {['$', '€', '£', '¥', '₹'].map(symbol => (
                <button
                  key={symbol}
                  type="button"
                  className={`btn ${selectedCurrency === symbol ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCurrency(symbol)}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 