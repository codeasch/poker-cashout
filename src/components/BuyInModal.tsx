import { useState } from 'preact/hooks';
import { useStore } from '../store';
import type { Session, Player } from '../types';
import { parseCurrency, formatCurrency } from '../utils/currency';

interface BuyInModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  player: Player;
}

export function BuyInModal({ isOpen, onClose, session, player }: BuyInModalProps) {
  const { recordBuyIn, settings } = useStore();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setError('');

    try {
      const amountCents = parseCurrency(amount);
      if (amountCents <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      recordBuyIn(session.id, player.id, amountCents);
      setAmount('');
      onClose();
    } catch (err) {
      setError('Invalid amount');
    }
  };

  const handleQuickBuyIn = (amountCents: number) => {
    recordBuyIn(session.id, player.id, amountCents);
    onClose();
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
          <h3 className="modal-title">Buy-in for {player.name}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount ({session.currency})</label>
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

          {/* Quick buy-in buttons - Always show exactly 3 from global settings */}
          <div className="form-group">
            <label className="form-label">Quick Options</label>
            <div className="flex gap-2 flex-wrap">
              {settings.quickBuyInOptions.slice(0, 3).map((amountCents, index) => (
                <button
                  key={index}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickBuyIn(amountCents)}
                >
                  +{formatCurrency(amountCents, session.currency)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Buy-in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 