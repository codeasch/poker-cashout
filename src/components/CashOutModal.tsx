import { useState } from 'preact/hooks';
import { useAppStore } from '../store';
import type { Session, Player } from '../types';
import { parseCurrency, formatCurrency } from '../utils/currency';

interface CashOutModalProps {
  session: Session;
  player: Player;
  onClose: () => void;
}

export function CashOutModal({ session, player, onClose }: CashOutModalProps) {
  const { cashOutPlayer } = useAppStore();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const buyIns = session.buyIns.filter(buyIn => buyIn.playerId === player.id && !buyIn.deleted);
  const totalBuyIns = buyIns.reduce((sum, buyIn) => sum + buyIn.amountCents, 0);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    const amountCents = parseCurrency(amount);
    if (amountCents < 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      cashOutPlayer(session.id, player.id, amountCents, 'leave');
      onClose();
    } catch (err) {
      setError('Failed to record cash-out');
    }
  };

  const projectedNet = parseCurrency(amount) - totalBuyIns;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Cash Out - {player.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card mb-4">
            <h4 className="font-semibold mb-2">Summary</h4>
            <div className="text-sm space-y-1">
              <div>Total Buy-ins: {formatCurrency(totalBuyIns, session.currency)}</div>
              <div>Cash-out Amount: {amount ? formatCurrency(parseCurrency(amount), session.currency) : '0.00'}</div>
              <div className={`font-semibold ${projectedNet >= 0 ? 'text-success' : 'text-danger'}`}>
                Projected Net: {formatCurrency(Math.abs(projectedNet), session.currency)} {projectedNet >= 0 ? 'profit' : 'loss'}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cashout-amount">
              Final Stack Value ({session.currency})
            </label>
            <input
              id="cashout-amount"
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount((e.target as HTMLInputElement).value)}
              placeholder="0.00"
              required
            />
            <div className="text-sm text-secondary mt-1">
              Enter the total value of chips the player is cashing out
            </div>
          </div>

          {error && (
            <div className="text-danger mb-3">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning flex-1">
              Record Cash-out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 