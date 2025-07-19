import { useState } from 'preact/hooks';
import { useStore } from '../store';
import { formatCurrency } from '../utils/currency';

interface EndGameWizardProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export function EndGameWizard({ isOpen, onClose, sessionId }: EndGameWizardProps) {
  const { sessions, finalizeSession } = useStore();
  const [step, setStep] = useState(1);
  const [finalStacks, setFinalStacks] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const session = sessions[sessionId];
  if (!session || !isOpen) return null;

  const activePlayers = Object.values(session.players).filter(p => p.active);

  const handleStackChange = (playerId: string, value: string) => {
    setFinalStacks(prev => ({
      ...prev,
      [playerId]: value
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate all active players have stack values
      const missingStacks = activePlayers.filter(p => !finalStacks[p.id] || finalStacks[p.id] === '');
      if (missingStacks.length > 0) {
        setError('Please enter final stack values for all active players');
        return;
      }
      setStep(2);
      setError('');
    } else if (step === 2) {
      // Finalize the session
      try {
        const stacksInCents: Record<string, number> = {};
        for (const [playerId, value] of Object.entries(finalStacks)) {
          stacksInCents[playerId] = Math.round(parseFloat(value) * 100);
        }
        
        finalizeSession(sessionId, stacksInCents);
        onClose();
      } catch (err) {
        setError('Failed to finalize session');
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError('');
    }
  };

  const handleCancel = () => {
    setStep(1);
    setFinalStacks({});
    setError('');
    onClose();
  };

  // Calculate variance
  const totalBuyIns = session.buyIns
    .filter(b => !b.deleted)
    .reduce((sum, b) => sum + b.amountCents, 0);

  const totalCashOuts = session.cashOuts
    .filter(c => !c.supersededBy)
    .reduce((sum, c) => sum + c.amountCents, 0);

  const finalStacksTotal = Object.values(finalStacks)
    .filter(v => v && v !== '')
    .reduce((sum, v) => sum + Math.round(parseFloat(v) * 100), 0);

  const variance = (totalCashOuts + finalStacksTotal) - totalBuyIns;
  const isVarianceAcceptable = Math.abs(variance) <= session.settings.varianceToleranceCents;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">End Game - Step {step} of 2</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">Enter Final Stack Values</label>
              <p className="text-sm text-secondary mb-3">
                Enter the final chip values for each active player
              </p>
              
              <div className="space-y-3">
                {activePlayers.map(player => (
                  <div key={player.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="form-label text-sm">{player.name}</label>
                      <input
                        type="number"
                        className="form-input"
                        value={finalStacks[player.id] || ''}
                        onChange={(e) => handleStackChange(player.id, e.currentTarget.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="text-danger mb-3">{error}</div>}

            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleNext}>
                Review & Finalize
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="form-group">
              <h4 className="font-semibold mb-3">Review Final Values</h4>
              
              <div className="space-y-2 mb-4">
                {activePlayers.map(player => (
                  <div key={player.id} className="flex justify-between">
                    <span>{player.name}</span>
                    <span className="font-semibold">
                      {formatCurrency(Math.round(parseFloat(finalStacks[player.id] || '0') * 100), session.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="card">
                <h5 className="font-semibold mb-2">Summary</h5>
                <div className="space-y-1 text-sm">
                  <div>Total Buy-ins: {formatCurrency(totalBuyIns, session.currency)}</div>
                  <div>Mid-game Cash-outs: {formatCurrency(totalCashOuts, session.currency)}</div>
                  <div>Final Stacks: {formatCurrency(finalStacksTotal, session.currency)}</div>
                  <div className={`font-semibold ${isVarianceAcceptable ? 'text-success' : 'text-danger'}`}>
                    Variance: {formatCurrency(variance, session.currency)}
                    {!isVarianceAcceptable && ' (Outside tolerance)'}
                  </div>
                </div>
              </div>

              {!isVarianceAcceptable && (
                <div className="text-warning text-sm mt-2">
                  ⚠️ The variance is outside the acceptable tolerance. This might indicate counting errors.
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={handleBack}>
                Back
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleNext}
                disabled={!isVarianceAcceptable}
              >
                Finalize Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 