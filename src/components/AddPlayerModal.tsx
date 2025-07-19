import { useState } from 'preact/hooks';
import { useAppStore } from '../store';

interface AddPlayerModalProps {
  sessionId: string;
  onClose: () => void;
}

export function AddPlayerModal({ sessionId, onClose }: AddPlayerModalProps) {
  const { addPlayer } = useAppStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [error, setError] = useState('');

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Player name is required');
      return;
    }

    try {
      addPlayer(sessionId, name.trim(), color || undefined);
      onClose();
    } catch (err) {
      setError('Failed to add player');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Player</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="player-name">
              Player Name
            </label>
            <input
              id="player-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="Enter player name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Player Color (Optional)</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === colorOption ? 'border-gray-900' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => setColor(colorOption)}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="text-danger mb-3">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Add Player
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 