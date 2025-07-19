import { useState } from 'preact/hooks';
import { useStore } from '../store';
import type { Session, Player } from '../types';
import { formatCurrency } from '../utils/currency';
import { BuyInModal } from './BuyInModal';
import { CashOutModal } from './CashOutModal';

interface PlayerRowProps {
  session: Session;
  player: Player;
}

export function PlayerRow({ session, player }: PlayerRowProps) {
  const { recordBuyIn, cashOutPlayer, rejoinPlayer, undoLastBuyInForPlayer, settings } = useStore();
  const [showBuyIn, setShowBuyIn] = useState(false);
  const [showCashOut, setShowCashOut] = useState(false);

  // Calculate player totals
  const buyIns = session.buyIns.filter(b => b.playerId === player.id && !b.deleted);
  const cashOuts = session.cashOuts.filter(c => c.playerId === player.id && !c.supersededBy);
  
  const totalBuyIns = buyIns.reduce((sum, b) => sum + b.amountCents, 0);
  const totalCashOuts = cashOuts.reduce((sum, c) => sum + c.amountCents, 0);
  const net = totalCashOuts - totalBuyIns;

  const getStatusBadge = () => {
    if (session.status === 'closed') {
      return <span className="badge badge-finished">FINISHED</span>;
    }
    return player.active ? 
      <span className="badge badge-active">ACTIVE</span> : 
      <span className="badge badge-left">LEFT</span>;
  };

  const getRejoinBadge = () => {
    if (player.rejoinCount > 0) {
      return <span className="text-secondary text-sm">(R{player.rejoinCount})</span>;
    }
    return null;
  };

  const handleRejoin = () => {
    rejoinPlayer(session.id, player.id);
  };

  const handleQuickBuyIn = (amountCents: number) => {
    recordBuyIn(session.id, player.id, amountCents);
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

      {/* Quick buy-in buttons - Always show exactly 3 from global settings */}
      {session.status === 'open' && player.active && (
        <div className="quick-buyin-buttons">
          {settings.quickBuyInOptions.slice(0, 3).map((amountCents, index) => (
            <button
              key={index}
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickBuyIn(amountCents)}
            >
              +{formatCurrency(amountCents, session.currency)}
            </button>
          ))}
        </div>
      )}

      <BuyInModal 
        isOpen={showBuyIn}
        onClose={() => setShowBuyIn(false)}
        session={session}
        player={player}
      />

      <CashOutModal 
        isOpen={showCashOut}
        onClose={() => setShowCashOut(false)}
        session={session}
        player={player}
      />
    </div>
  );
} 