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
    const summary = `🏆 POKER SETTLEMENT - ${session.name}

${winners.length > 0 ? `💰 POSITIVE:
${winners.map((net, index) => {
  const player = session.players[net.playerId];
  return `${index + 1}. ${player.name}: +${formatCurrency(net.netCents, session.currency)}`;
}).join('\n')}` : ''}

${losers.length > 0 ? `💸 NEGATIVE:
${losers.map((net, index) => {
  const player = session.players[net.playerId];
  return `${index + 1}. ${player.name}: ${formatCurrency(net.netCents, session.currency)}`;
}).join('\n')}` : ''}

${breakEven.length > 0 ? `⚖️ BREAK EVEN:
${breakEven.map((net) => {
  const player = session.players[net.playerId];
  return `• ${player.name}`;
}).join('\n')}` : ''}

${transactions.length > 0 ? `💸 PAYMENTS:
${transactions.map((tx, index) => {
  const fromPlayer = session.players[tx.fromPlayerId];
  const toPlayer = session.players[tx.toPlayerId];
  return `${index + 1}. ${fromPlayer.name} → ${toPlayer.name}: ${formatCurrency(tx.amountCents, session.currency)}`;
}).join('\n')}` : '🎉 Perfect! No payments needed.'}

${Math.abs(varianceCents) > 0 ? `\n⚠️ Variance: ${formatCurrency(varianceCents, session.currency)}` : ''}`.trim();

    navigator.clipboard.writeText(summary);
  };

  // Separate winners and losers for better presentation
  const winners = nets.filter(net => net.netCents > 0).sort((a, b) => b.netCents - a.netCents);
  const losers = nets.filter(net => net.netCents < 0).sort((a, b) => a.netCents - b.netCents);
  const breakEven = nets.filter(net => net.netCents === 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Final Settlement - {session.name}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="space-y-6 pb-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-success">
                {formatCurrency(winners.reduce((sum, net) => sum + net.netCents, 0), session.currency)}
              </div>
              <div className="text-sm text-secondary">Total Winnings</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-danger">
                {formatCurrency(Math.abs(losers.reduce((sum, net) => sum + net.netCents, 0)), session.currency)}
              </div>
              <div className="text-sm text-secondary">Total Losses</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary">
                {transactions.length}
              </div>
              <div className="text-sm text-secondary">Transactions</div>
            </div>
          </div>

          {/* Player Results */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-success">💰</span>
              Final Standings
            </h4>
            
            {/* Winners */}
            {winners.length > 0 && (
              <div className="mb-4">
                <h5 className="font-semibold text-success mb-2">Winners</h5>
                <div className="space-y-2">
                  {winners.map((net, index) => {
                    const player = session.players[net.playerId];
                    return (
                      <div key={player.id} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-sm text-secondary">
                              {formatCurrency(net.buyInsCents, session.currency)} buy-ins • {formatCurrency(net.cashOutCents, session.currency)} cash-out
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-success text-lg">
                            +{formatCurrency(net.netCents, session.currency)}
                          </div>
                          <div className="text-sm text-secondary">profit</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Losers */}
            {losers.length > 0 && (
              <div className="mb-4">
                <h5 className="font-semibold text-danger mb-2">Losers</h5>
                <div className="space-y-2">
                  {losers.map((net, index) => {
                    const player = session.players[net.playerId];
                    return (
                      <div key={player.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-danger text-white flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-sm text-secondary">
                              {formatCurrency(net.buyInsCents, session.currency)} buy-ins • {formatCurrency(net.cashOutCents, session.currency)} cash-out
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-danger text-lg">
                            {formatCurrency(net.netCents, session.currency)}
                          </div>
                          <div className="text-sm text-secondary">loss</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Break Even */}
            {breakEven.length > 0 && (
              <div>
                <h5 className="font-semibold text-secondary mb-2">Break Even</h5>
                <div className="space-y-2">
                  {breakEven.map((net) => {
                    const player = session.players[net.playerId];
                    return (
                      <div key={player.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold">
                            =
                          </div>
                          <div>
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-sm text-secondary">
                              {formatCurrency(net.buyInsCents, session.currency)} buy-ins • {formatCurrency(net.cashOutCents, session.currency)} cash-out
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-secondary text-lg">
                            {formatCurrency(0, session.currency)}
                          </div>
                          <div className="text-sm text-secondary">even</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Settlement Transactions */}
          {transactions.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-primary">💸</span>
                Who Pays Who
              </h4>
              <div className="space-y-3">
                {transactions.map((tx, index) => {
                  const fromPlayer = session.players[tx.fromPlayerId];
                  const toPlayer = session.players[tx.toPlayerId];
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-danger text-white flex items-center justify-center text-sm font-bold">
                            {fromPlayer.name.charAt(0)}
                          </div>
                          <span className="font-semibold">{fromPlayer.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl text-primary">→</span>
                          <span className="text-sm text-secondary">pays</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-success text-white flex items-center justify-center text-sm font-bold">
                            {toPlayer.name.charAt(0)}
                          </div>
                          <span className="font-semibold">{toPlayer.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary text-xl">
                          {formatCurrency(tx.amountCents, session.currency)}
                        </div>
                        <div className="text-sm text-secondary">Transaction #{index + 1}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Transactions Needed */}
          {transactions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="text-lg font-semibold mb-2">Perfect Settlement!</h4>
              <p className="text-secondary">No transactions needed - all players broke even!</p>
            </div>
          )}

          {/* Variance Warning */}
          {Math.abs(varianceCents) > 0 && (
            <div className={`card ${Math.abs(varianceCents) <= session.settings.varianceToleranceCents ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'}`}>
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                {Math.abs(varianceCents) <= session.settings.varianceToleranceCents ? '✅' : '⚠️'}
                Variance Check
              </h5>
              <div className={`text-sm ${Math.abs(varianceCents) <= session.settings.varianceToleranceCents ? 'text-success' : 'text-warning'}`}>
                <div className="font-semibold">
                  {formatCurrency(varianceCents, session.currency)}
                </div>
                <div className="text-secondary">
                  {Math.abs(varianceCents) <= session.settings.varianceToleranceCents 
                    ? 'Within acceptable tolerance' 
                    : 'Outside tolerance - check for counting errors'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-8 border-t border-gray-200 dark:border-gray-700">
            <button className="btn btn-secondary" onClick={handleCopyToClipboard}>
              📋 Copy Summary
            </button>
            <button className="btn btn-primary" onClick={handleExport}>
              💾 Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 