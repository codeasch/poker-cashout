// Currency utility functions for formatting and calculations

export function formatCurrency(amountCents: number, currency: string = '$'): string {
  const dollars = amountCents / 100;
  return `${currency}${dollars.toFixed(2)}`;
}

export function parseCurrency(amount: string): number {
  // Remove currency symbols and convert to cents
  const cleanAmount = amount.replace(/[$,]/g, '');
  const dollars = parseFloat(cleanAmount);
  if (isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function validateAmount(amountCents: number): boolean {
  return amountCents > 0;
}

export function calculateVariance(totalBuyInsCents: number, totalCashOutsCents: number): number {
  return totalCashOutsCents - totalBuyInsCents;
}

export function isWithinTolerance(varianceCents: number, toleranceCents: number): boolean {
  return Math.abs(varianceCents) <= toleranceCents;
} 