import { useState } from 'preact/hooks';
import type { Session, SettlementSnapshot } from '../types';
import { formatCurrency } from '../utils/currency';

interface SettlementViewProps {
  session: Session;
  settlement: SettlementSnapshot;
  onClose: () => void;
}

export function SettlementView({ session, settlement, onClose }: SettlementViewProps) {
  const [paidTransactions, setPaidTransactions] = useState<Set<string>>(new Set());

  const togglePaid = (transactionIndex: number) => {
    const newPaid = new Set(paidTransactions);
    if (newPaid.has(transactionIndex.toString())) {
      newPaid.delete(transactionIndex.toString());
    } else {
      newPaid.add(transactionIndex.toString());
    }
    setPaidTransactions(newPaid);
  };

  const getPlayerName = (playerId: string) => {
    return session.players[playerId]?.name || 'Unknown Player';
  };

  const copyToClipboard = () => {
    const summary = generateSettlementSummary(session, settlement);
    navigator.clipboard.writeText(summary);
    alert('Settlement summary copied to clipboard!');
  };

  const generateSettlementSummary = (session: Session, settlement: SettlementSnapshot) => {
    let summary = `${session.name} - Settlement Summary\n`;
    summary += `Generated: ${new Date(settlement.calculatedAt).toLocaleString()}\n\n`;
    
    summary += 'Player Results:\n';
    settlement.nets.forEach(net => {
      const playerName = getPlayerName(net.playerId);
      const buyIns = formatCurrency(net.buyInsCents, session.currency);
      const cashOut = formatCurrency(net.cashOutCents, session.currency);
      const netAmount = formatCurrency(Math.abs(net.netCents), session.currency);
      const result = net.netCents >= 0 ? 'profit' : 'loss';
      summary += `${playerName}: ${buyIns} buy-ins, ${cashOut} cash-out, ${netAmount} ${result}\n`;
    });
    
    summary += '\nSettlement Transactions:\n';
    settlement.transactions.forEach((tx, index) => {
      const fromName = getPlayerName(tx.fromPlayerId);
      const toName = getPlayerName(tx.toPlayerId);
      const amount = formatCurrency(tx.amountCents, session.currency);
      summary += `${index + 1}. ${fromName} pays ${toName}: ${amount}\n`;
    });
    
    if (settlement.varianceCents !== 0) {
      summary += `\nVariance: ${formatCurrency(Math.abs(settlement.varianceCents), session.currency)}\n`;
    }
    
    return summary;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settlement Results</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="space-y-4">
          {/* Player Results */}
          <div>
            <h3 className="font-semibold mb-3">Player Results</h3>
            <div className="space-y-2">
              {settlement.nets.map((net) => {
                const playerName = getPlayerName(net.playerId);
                const buyIns = formatCurrency(net.buyInsCents, session.currency);
                const cashOut = formatCurrency(net.cashOutCents, session.currency);
                const netAmount = formatCurrency(Math.abs(net.netCents), session.currency);
                const isProfit = net.netCents >= 0;

                return (
                  <div key={net.playerId} className="card">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{playerName}</h4>
                        <div className="text-sm text-secondary">
                          Buy-ins: {buyIns} • Cash-out: {cashOut}
                        </div>
                      </div>
                      <div className={`font-semibold ${isProfit ? 'text-success' : 'text-danger'}`}>
                        {isProfit ? '+' : '-'}{netAmount} {isProfit ? 'profit' : 'loss'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settlement Transactions */}
          <div>
            <h3 className="font-semibold mb-3">Settlement Transactions</h3>
            {settlement.transactions.length === 0 ? (
              <div className="card text-center">
                <p className="text-secondary">No transactions needed - all players broke even!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {settlement.transactions.map((tx, index) => {
                  const fromName = getPlayerName(tx.fromPlayerId);
                  const toName = getPlayerName(tx.toPlayerId);
                  const amount = formatCurrency(tx.amountCents, session.currency);
                  const isPaid = paidTransactions.has(index.toString());

                  return (
                    <div key={index} className="card">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">
                            {fromName} → {toName}
                          </h4>
                          <div className="text-sm text-secondary">
                            Amount: {amount}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className={`btn btn-sm ${isPaid ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => togglePaid(index)}
                          >
                            {isPaid ? '✓ Paid' : 'Mark Paid'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Variance */}
          {settlement.varianceCents !== 0 && (
            <div className="card">
              <h4 className="font-semibold mb-2">Variance</h4>
              <div className={`font-semibold ${Math.abs(settlement.varianceCents) <= session.settings.varianceToleranceCents ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(Math.abs(settlement.varianceCents), session.currency)} 
                {settlement.varianceCents > 0 ? ' over' : ' under'}
              </div>
              <div className="text-sm text-secondary">
                Tolerance: {formatCurrency(session.settings.varianceToleranceCents, session.currency)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button className="btn btn-secondary flex-1" onClick={onClose}>
              Close
            </button>
            <button className="btn btn-primary flex-1" onClick={copyToClipboard}>
              Copy Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 