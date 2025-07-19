// Utility functions for ID generation and management

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateBuyInId(): string {
  return `buyin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateCashOutId(): string {
  return `cashout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 