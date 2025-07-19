import { useStore } from '../store';
import type { Session } from '../types';
import { formatCurrency } from '../utils/currency';

interface SettlementViewProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
}

export function SettlementView({ isOpen, onClose, session }: SettlementViewProps) {
  const { exportData } = useStore();

  if (!isOpen || !session.settlement) return null;

  const { nets, transactions, varianceCents } = session.settlement;

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poker-settlement-${session.name}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    const summary = `
Poker Settlement Summary - ${session.name}
${'='.repeat(50)}

Player Results:
${nets.map(net => {
  const player = session.players[net.playerId];
  return `${player.name}: ${formatCurrency(net.buyInsCents, session.currency)} buy-ins, ${formatCurrency(net.cashOutCents, session.currency)} cash-out, ${formatCurrency(net.netCents, session.currency)} net`;
}).join('\n')}

${'='.repeat(50)}

Settlement Transactions:
${transactions.map(tx => {
  const fromPlayer = session.players[tx.fromPlayerId];
  const toPlayer = session.players[tx.toPlayerId];
  return `${fromPlayer.name} pays ${toPlayer.name} ${formatCurrency(tx.amountCents, session.currency)}`;
}).join('\n')}

${'='.repeat(50)}
Variance: ${formatCurrency(varianceCents, session.currency)}
    `.trim();

    navigator.clipboard.writeText(summary);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Settlement - {session.name}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="space-y-4">
          {/* Player Results */}
          <div>
            <h4 className="font-semibold mb-3">Player Results</h4>
            <div className="space-y-2">
              {nets.map(net => {
                const player = session.players[net.playerId];
                return (
                  <div key={player.id} className="flex justify-between items-center p-3 bg-secondary rounded">
                    <div>
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-sm text-secondary">
                        Buy-ins: {formatCurrency(net.buyInsCents, session.currency)} • 
                        Cash-out: {formatCurrency(net.cashOutCents, session.currency)}
                      </div>
                    </div>
                    <div className={`font-semibold ${net.netCents >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(Math.abs(net.netCents), session.currency)} {net.netCents >= 0 ? 'profit' : 'loss'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settlement Transactions */}
          <div>
            <h4 className="font-semibold mb-3">Settlement Transactions</h4>
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-secondary text-center py-4">No transactions needed - all players broke even!</p>
              ) : (
                transactions.map((tx, index) => {
                  const fromPlayer = session.players[tx.fromPlayerId];
                  const toPlayer = session.players[tx.toPlayerId];
                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-secondary rounded">
                      <div>
                        <span className="font-semibold">{fromPlayer.name}</span>
                        <span className="mx-2">→</span>
                        <span className="font-semibold">{toPlayer.name}</span>
                      </div>
                      <div className="font-semibold text-primary">
                        {formatCurrency(tx.amountCents, session.currency)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Variance */}
          {Math.abs(varianceCents) > 0 && (
            <div className="card">
              <h5 className="font-semibold mb-2">Variance</h5>
              <div className={`text-sm ${Math.abs(varianceCents) <= session.settings.varianceToleranceCents ? 'text-success' : 'text-warning'}`}>
                {formatCurrency(varianceCents, session.currency)}
                {Math.abs(varianceCents) > session.settings.varianceToleranceCents && ' (Outside tolerance)'}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button className="btn btn-secondary" onClick={handleCopyToClipboard}>
              Copy Summary
            </button>
            <button className="btn btn-primary" onClick={handleExport}>
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 