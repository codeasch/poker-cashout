import { useState } from 'preact/hooks';
import { useAppStore } from '../store';
import type { Session, Player } from '../types';
import { BuyInModal } from './BuyInModal';
import { CashOutModal } from './CashOutModal';
import { formatCurrency } from '../utils/currency';

interface PlayerRowProps {
  session: Session;
  player: Player;
}

export function PlayerRow({ session, player }: PlayerRowProps) {
  const { recordBuyIn, cashOutPlayer, rejoinPlayer, undoLastBuyInForPlayer } = useAppStore();
  const [showBuyIn, setShowBuyIn] = useState(false);
  const [showCashOut, setShowCashOut] = useState(false);

  const buyIns = session.buyIns.filter(buyIn => buyIn.playerId === player.id && !buyIn.deleted);
  const cashOuts = session.cashOuts.filter(cashOut => cashOut.playerId === player.id && !cashOut.supersededBy);
  
  const totalBuyIns = buyIns.reduce((sum, buyIn) => sum + buyIn.amountCents, 0);
  const totalCashOuts = cashOuts.reduce((sum, cashOut) => sum + cashOut.amountCents, 0);
  const net = totalCashOuts - totalBuyIns;

  const getStatusBadge = () => {
    if (player.active) {
      return <span className="badge badge-active">Active</span>;
    } else {
      return <span className="badge badge-left">Left</span>;
    }
  };

  const getRejoinBadge = () => {
    if (player.rejoinCount > 0) {
      return <span className="text-secondary text-sm">(R{player.rejoinCount})</span>;
    }
    return null;
  };

  const handleQuickBuyIn = (amountCents: number) => {
    try {
      recordBuyIn(session.id, player.id, amountCents);
    } catch (error) {
      alert('Failed to record buy-in');
    }
  };

  const handleRejoin = () => {
    try {
      rejoinPlayer(session.id, player.id);
    } catch (error) {
      alert('Failed to rejoin player');
    }
  };

  return (
    <div className="card">
      <div className="player-row">
        <div className="player-info">
          {player.color && (
            <div 
              className="player-color" 
              style={{ backgroundColor: player.color }}
            />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{player.name}</h4>
              {getRejoinBadge()}
              {getStatusBadge()}
            </div>
            <div className="text-sm text-secondary">
              Buy-ins: {formatCurrency(totalBuyIns, session.currency)} • 
              Cash-out: {formatCurrency(totalCashOuts, session.currency)} • 
              Net: <span className={net >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(Math.abs(net), session.currency)} {net >= 0 ? 'profit' : 'loss'}
              </span>
            </div>
          </div>
        </div>

        <div className="player-actions">
          {session.status === 'open' && player.active && (
            <>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowBuyIn(true)}
              >
                + Buy-in
              </button>
              <button 
                className="btn btn-warning btn-sm"
                onClick={() => setShowCashOut(true)}
              >
                Cash Out
              </button>
            </>
          )}
          {session.status === 'open' && !player.active && (
            <button 
              className="btn btn-success btn-sm"
              onClick={handleRejoin}
            >
              Rejoin
            </button>
          )}
          {buyIns.length > 0 && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => undoLastBuyInForPlayer(session.id, player.id)}
              title="Undo last buy-in"
            >
              ↩
            </button>
          )}
        </div>
      </div>

      {/* Quick buy-in buttons */}
      {session.status === 'open' && player.active && (
        <div className="quick-buyin-buttons">
          {session.settings.quickBuyInOptions.map((amountCents) => (
            <button
              key={amountCents}
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickBuyIn(amountCents)}
            >
              +{formatCurrency(amountCents, session.currency)}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {showBuyIn && (
        <BuyInModal
          session={session}
          player={player}
          onClose={() => setShowBuyIn(false)}
        />
      )}

      {showCashOut && (
        <CashOutModal
          session={session}
          player={player}
          onClose={() => setShowCashOut(false)}
        />
      )}
    </div>
  );
} 