import type { PlayerNet, SettlementTx, Session } from '../types';

// Settlement calculation algorithms as specified in the plan

export function computePlayerNets(session: Session): PlayerNet[] {
  const nets: PlayerNet[] = [];
  
  for (const player of Object.values(session.players)) {
    const buyInsCents = session.buyIns
      .filter(buyIn => buyIn.playerId === player.id && !buyIn.deleted)
      .reduce((sum, buyIn) => sum + buyIn.amountCents, 0);
    
    const cashOutsCents = session.cashOuts
      .filter(cashOut => cashOut.playerId === player.id && !cashOut.supersededBy)
      .reduce((sum, cashOut) => sum + cashOut.amountCents, 0);
    
    const netCents = cashOutsCents - buyInsCents;
    
    nets.push({
      playerId: player.id,
      buyInsCents,
      cashOutCents: cashOutsCents,
      netCents
    });
  }
  
  return nets;
}

export function computeVariance(session: Session): number {
  const totalBuyInsCents = session.buyIns
    .filter(buyIn => !buyIn.deleted)
    .reduce((sum, buyIn) => sum + buyIn.amountCents, 0);
  
  const totalCashOutsCents = session.cashOuts
    .filter(cashOut => !cashOut.supersededBy)
    .reduce((sum, cashOut) => sum + cashOut.amountCents, 0);
  
  return totalCashOutsCents - totalBuyInsCents;
}

export function minimizeCashFlow(nets: PlayerNet[]): SettlementTx[] {
  const transactions: SettlementTx[] = [];
  
  // Separate creditors (positive net) and debtors (negative net)
  const creditors = nets
    .filter(net => net.netCents > 0)
    .map(net => ({ playerId: net.playerId, amount: net.netCents }))
    .sort((a, b) => b.amount - a.amount); // Sort descending
  
  const debtors = nets
    .filter(net => net.netCents < 0)
    .map(net => ({ playerId: net.playerId, amount: Math.abs(net.netCents) }))
    .sort((a, b) => b.amount - a.amount); // Sort descending
  
  // Greedy algorithm: match largest creditor with largest debtor
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    
    const payment = Math.min(creditor.amount, debtor.amount);
    
    if (payment > 0) {
      transactions.push({
        fromPlayerId: debtor.playerId,
        toPlayerId: creditor.playerId,
        amountCents: payment,
        paid: false
      });
    }
    
    // Update amounts
    creditor.amount -= payment;
    debtor.amount -= payment;
    
    // Remove exhausted entries
    if (creditor.amount === 0) {
      creditors.shift();
    }
    if (debtor.amount === 0) {
      debtors.shift();
    }
  }
  
  return transactions;
}

export function calculateSettlement(session: Session) {
  const nets = computePlayerNets(session);
  const variance = computeVariance(session);
  const transactions = minimizeCashFlow(nets);
  
  return {
    nets,
    transactions,
    varianceCents: variance,
    calculatedAt: Date.now(),
    algorithm: 'greedy-max-flow-v1'
  };
}

export function validateSettlement(nets: PlayerNet[], toleranceCents: number = 100): boolean {
  const totalNet = nets.reduce((sum, net) => sum + net.netCents, 0);
  return Math.abs(totalNet) <= toleranceCents;
} 