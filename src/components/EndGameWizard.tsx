import { useState } from 'preact/hooks';
import { useAppStore } from '../store';
import type { Session } from '../types';
import { parseCurrency, formatCurrency } from '../utils/currency';
import { computeVariance } from '../utils/settlement';

interface EndGameWizardProps {
  session: Session;
  onClose: () => void;
}

export function EndGameWizard({ session, onClose }: EndGameWizardProps) {
  const { finalizeSession } = useAppStore();
  const [step, setStep] = useState(1);
  const [finalStacks, setFinalStacks] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const activePlayers = Object.values(session.players).filter(p => p.active);

  const handleStackChange = (playerId: string, value: string) => {
    setFinalStacks(prev => ({
      ...prev,
      [playerId]: value
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate all players have stack values
      const missingPlayers = activePlayers.filter(p => !finalStacks[p.id] || finalStacks[p.id] === '0');
      if (missingPlayers.length > 0) {
        setError('Please enter final stack values for all players');
        return;
      }
      setStep(2);
      setError('');
    } else if (step === 2) {
      // Finalize the session
      try {
        const finalStacksMap: Record<string, number> = {};
        Object.entries(finalStacks).forEach(([playerId, amount]) => {
          finalStacksMap[playerId] = parseCurrency(amount);
        });
        
        finalizeSession(session.id, finalStacksMap);
        onClose();
      } catch (err) {
        setError('Failed to finalize session');
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const totalBuyIns = session.buyIns
    .filter(buyIn => !buyIn.deleted)
    .reduce((sum, buyIn) => sum + buyIn.amountCents, 0);

  const totalCashOuts = session.cashOuts
    .filter(cashOut => !cashOut.supersededBy)
    .reduce((sum, cashOut) => sum + cashOut.amountCents, 0);

  const finalStacksTotal = Object.values(finalStacks)
    .reduce((sum, amount) => sum + parseCurrency(amount), 0);

  const totalCashReturned = totalCashOuts + finalStacksTotal;
  const variance = totalCashReturned - totalBuyIns;
  const isVarianceOk = Math.abs(variance) <= session.settings.varianceToleranceCents;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">End Game - Step {step} of 2</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {step === 1 && (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Enter Final Stack Values</h3>
              <p className="text-secondary text-sm">
                Enter the final chip values for each active player
              </p>
            </div>

            <div className="space-y-3">
              {activePlayers.map((player) => (
                <div key={player.id} className="form-group">
                  <label className="form-label" htmlFor={`stack-${player.id}`}>
                    {player.name} - Final Stack ({session.currency})
                  </label>
                  <input
                    id={`stack-${player.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={finalStacks[player.id] || ''}
                    onChange={(e) => handleStackChange(player.id, (e.target as HTMLInputElement).value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Review Variance</h3>
              <p className="text-secondary text-sm">
                Verify that the total cash returned matches the total buy-ins
              </p>
            </div>

            <div className="card mb-4">
              <h4 className="font-semibold mb-2">Summary</h4>
              <div className="text-sm space-y-1">
                <div>Total Buy-ins: {formatCurrency(totalBuyIns, session.currency)}</div>
                <div>Mid-game Cash-outs: {formatCurrency(totalCashOuts, session.currency)}</div>
                <div>Final Stacks: {formatCurrency(finalStacksTotal, session.currency)}</div>
                <div className="font-semibold">
                  Total Cash Returned: {formatCurrency(totalCashReturned, session.currency)}
                </div>
                <div className={`font-semibold ${isVarianceOk ? 'text-success' : 'text-danger'}`}>
                  Variance: {formatCurrency(Math.abs(variance), session.currency)} 
                  {variance > 0 ? ' (over)' : variance < 0 ? ' (under)' : ' (exact)'}
                </div>
              </div>
            </div>

            {!isVarianceOk && (
              <div className="card mb-4 bg-yellow-50 border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Variance Warning</h4>
                <p className="text-sm text-yellow-700">
                  The variance ({formatCurrency(Math.abs(variance), session.currency)}) exceeds the tolerance 
                  ({formatCurrency(session.settings.varianceToleranceCents, session.currency)}). 
                  Please double-check the final stack values.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-danger mb-3">{error}</div>
        )}

        <div className="flex gap-3">
          <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>
            Cancel
          </button>
          {step > 1 && (
            <button type="button" className="btn btn-secondary flex-1" onClick={handleBack}>
              Back
            </button>
          )}
          <button 
            type="button" 
            className="btn btn-success flex-1" 
            onClick={handleNext}
          >
            {step === 1 ? 'Next' : 'Finalize Session'}
          </button>
        </div>
      </div>
    </div>
  );
} 