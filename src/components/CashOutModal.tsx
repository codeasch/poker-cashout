import { useState } from 'preact/hooks';
import { useStore } from '../store';
import type { Session, Player } from '../types';
import { parseCurrency, formatCurrency } from '../utils/currency';

interface CashOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  player: Player;
}

export function CashOutModal({ isOpen, onClose, session, player }: CashOutModalProps) {
  const { cashOutPlayer } = useStore();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Calculate player's total buy-ins for reference
  const totalBuyIns = session.buyIns
    .filter(b => b.playerId === player.id && !b.deleted)
    .reduce((sum, b) => sum + b.amountCents, 0);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setError('');

    try {
      const amountCents = parseCurrency(amount);
      if (amountCents < 0) {
        setError('Amount cannot be negative');
        return;
      }

      cashOutPlayer(session.id, player.id, amountCents, 'leave');
      setAmount('');
      onClose();
    } catch (err) {
      setError('Invalid amount');
    }
  };

  const handleCancel = () => {
    setAmount('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Cash Out {player.name}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Final Stack Value ({session.currency})</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.currentTarget.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              autoFocus
            />
            {error && <div className="text-danger text-sm mt-1">{error}</div>}
          </div>

          <div className="form-group">
            <div className="text-sm text-secondary">
              <p>Total Buy-ins: {formatCurrency(totalBuyIns, session.currency)}</p>
              <p>Projected Net: {amount ? formatCurrency(parseCurrency(amount) - totalBuyIns, session.currency) : 'N/A'}</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning">
              Cash Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 