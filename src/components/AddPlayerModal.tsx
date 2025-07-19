import { useState } from 'preact/hooks';
import { useStore } from '../store';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export function AddPlayerModal({ isOpen, onClose, sessionId }: AddPlayerModalProps) {
  const { addPlayer } = useStore();
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  if (!isOpen) return null;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (playerName.trim()) {
      addPlayer(sessionId, playerName.trim(), selectedColor);
      setPlayerName('');
      setSelectedColor('#3B82F6');
      onClose();
    }
  };

  const handleCancel = () => {
    setPlayerName('');
    setSelectedColor('#3B82F6');
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
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                style={{ backgroundColor: selectedColor }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'color';
                  input.value = selectedColor;
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    setSelectedColor(target.value);
                  };
                  input.click();
                }}
              />
              <div className="flex-1">
                <input
                  type="color"
                  className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.currentTarget.value)}
                />
              </div>
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