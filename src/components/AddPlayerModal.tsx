import { useState } from 'preact/hooks';
import { useStore } from '../store';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

const PLAYER_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#EC4899', '#84CC16', '#6366F1'
];

export function AddPlayerModal({ isOpen, onClose, sessionId }: AddPlayerModalProps) {
  const { addPlayer } = useStore();
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (playerName.trim()) {
      addPlayer(sessionId, playerName.trim(), selectedColor);
      setPlayerName('');
      setSelectedColor(PLAYER_COLORS[0]);
      onClose();
    }
  };

  const handleCancel = () => {
    setPlayerName('');
    setSelectedColor(PLAYER_COLORS[0]);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Player</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Player Name</label>
            <input
              type="text"
              className="form-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.currentTarget.value)}
              placeholder="Enter player name"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Player Color</label>
            <div className="flex gap-2 flex-wrap">
              {PLAYER_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className="w-8 h-8 rounded-full border-2"
                  style={{ 
                    backgroundColor: color,
                    borderColor: selectedColor === color ? '#000' : 'transparent'
                  }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Player
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 