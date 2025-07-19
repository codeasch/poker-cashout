import { useState } from 'preact/hooks';
import { useAppStore } from '../store';
import type { Session, Player } from '../types';
import { parseCurrency, formatCurrency } from '../utils/currency';

interface BuyInModalProps {
  session: Session;
  player: Player;
  onClose: () => void;
}

export function BuyInModal({ session, player, onClose }: BuyInModalProps) {
  const { recordBuyIn } = useAppStore();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    const amountCents = parseCurrency(amount);
    if (amountCents <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      recordBuyIn(session.id, player.id, amountCents);
      onClose();
    } catch (err) {
      setError('Failed to record buy-in');
    }
  };

  const handleQuickAmount = (amountCents: number) => {
    setAmount(formatCurrency(amountCents, session.currency).replace(session.currency, ''));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Buy-in for {player.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="buyin-amount">
              Amount ({session.currency})
            </label>
            <input
              id="buyin-amount"
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount((e.target as HTMLInputElement).value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quick Amounts</label>
            <div className="flex gap-2 flex-wrap">
              {session.settings.quickBuyInOptions.map((amountCents) => (
                <button
                  key={amountCents}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickAmount(amountCents)}
                >
                  {formatCurrency(amountCents, session.currency)}
                </button>
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
              Record Buy-in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 