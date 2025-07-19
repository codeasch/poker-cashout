import { useState } from 'preact/hooks';
import { useAppStore } from '../store';

interface CreateSessionModalProps {
  onClose: () => void;
}

export function CreateSessionModal({ onClose }: CreateSessionModalProps) {
  const { createSession } = useAppStore();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('$');
  const [error, setError] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Session name is required');
      return;
    }

    try {
      createSession({
        name: name.trim(),
        currency,
        settings: {
          varianceToleranceCents: 100,
          quickBuyInOptions: [2000, 4000, 10000] // $20, $40, $100
        }
      });
      onClose();
    } catch (err) {
      setError('Failed to create session');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Session</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="session-name">
              Session Name
            </label>
            <input
              id="session-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="Friday Night Poker"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="currency">
              Currency Symbol
            </label>
            <select
              id="currency"
              className="form-input"
              value={currency}
              onChange={(e) => setCurrency((e.target as HTMLSelectElement).value)}
            >
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
              <option value="₹">₹ (INR)</option>
            </select>
          </div>

          {error && (
            <div className="text-danger mb-3">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 