# Poker Cashout & Settlement Tool – Implementation Specification

**Goal:** Build a mobile‑first static web app (deployable via GitHub Pages) to manage live home poker game economics: player buy‑ins (variable, multiple), mid‑session cashouts/leaves, final stack entry, and automatic simplified settlement instructions (who pays whom, minimizing number and size of transactions).

---

## 1. Core Concepts & Definitions

* **Session / Game:** A single continuous poker event with a start time and an eventual end.
* **Player State:** Active, Left (cashed out mid‑game), or Finished (still present at end when game ends).
* **Buy‑In:** Money a player contributes to enter or re‑enter (multiple allowed). Stored as timestamped entries.
* **Stack Entry:** The counted chip value converted to currency when a player leaves (mid‑game cashout) *or* at end game for remaining players.
* **Net Result (Profit/Loss):** `FinalCashReturned - TotalBuyIns` (can be negative or positive).
* **Settlement Graph:** Directed list of payments from losers (negative net) to winners (positive net) minimizing number of transactions while clearing all balances.

---

## 2. Functional Requirements

### 2.1 Session Management

* Create new session: specify optional name, currency symbol, default buy‑in increment suggestions (e.g., 20 / 40 / 100), and rake settings (optional future).
* Persist sessions locally (LocalStorage/IndexedDB). Ability to resume an open session, view history of closed sessions, duplicate a session setup.
* Auto‑generate unique session ID (UUID v4).

### 2.2 Player Management

* Add player: name (required), optional initials, color tag / avatar.
* Edit player name while active (propagates everywhere).
* Remove player **only** if they have no financial activity yet; otherwise they must “leave & cash out”.
* Re‑entering after leaving creates new active presence but keeps historical record (flag rejoined count).

### 2.3 Buy‑Ins

* For any active player: quick buttons with common amounts + custom amount field.
* Each buy‑in logs: playerId, amount, timestamp, cumulative total for that player.
* Display player row with: Name, Total Buy‑Ins, Current (estimated) Stack (optional manual tracking future), Status.
* Undo last buy‑in (global and per‑player) with confirmation (soft‑delete marking so history is preserved internally until session end or purge).

### 2.4 Mid‑Game Cashouts / Leaving

* When a player leaves: enter their final stack value (chips counted to currency). Compute their net immediately and mark status = Left.
* Prevent further buy‑ins for Left players unless “Rejoin” is selected (new buy‑ins allowed, tracked sequentially; net calculation merges all periods into one final net at session end).
* Allow editing a mistaken cashout before session end (with audit note). Maintain original + revised values internally (for history).

### 2.5 Ending the Game

* For all players still Active, prompt for final stack values.
* Validation: Sum(final stack values of finishing players + mid‑game cashouts already recorded) should equal **Total Chips in Play** = Sum(all buy‑ins) ± allowed variance threshold (configurable, default tolerance <= 1 unit). If mismatch beyond tolerance: show discrepancy warning & require confirm override.
* Lock session after settlement (read‑only snapshot stored).

### 2.6 Settlement Calculation

* Compute each player’s net: `Net = CashOutTotal - BuyInTotal`.
* Partition into **Creditors (Net > 0)** and **Debtors (Net < 0)**.
* Apply **Min Cash Flow Algorithm** (variant of debt simplification):

  1. Create arrays of (playerId, amount) for positives and negatives (store negatives as absolute value for ease).
  2. While both arrays non‑empty:

     * Find max creditor (largest positive) and max debtor (largest owed amount).
     * Payment = `min(creditor.amount, debtor.amount)`.
     * Record transaction: debtor -> creditor : Payment.
     * Subtract Payment from both; remove any exhausted entry.
  3. Optionally apply small optimizations: merge micro‑payments < tolerance into nearest larger transaction, preserve rounding consistency.
* Output list of transactions with totals. Guarantee: number of edges <= (#creditors + #debtors − 1).
* Provide alternative mode (optional future): exact pairwise “who took from whom” (not minimized) for audit.

### 2.7 Rounding & Currency Handling

* Internal representation: store amounts in integer **cents** (avoid floating errors).
* Display: format with user’s chosen currency symbol and 2 decimals (or custom precision if using chips not convertible yet).
* Keep running checksum: sum of all nets = 0 (or within ± tolerance cent). If non‑zero, highlight rounding drift.

### 2.8 History & Export

* Session summary view: table of players (Buy‑Ins, Cash Out, Net), settlement transactions, timestamps, variance.
* Export options: Copy to clipboard (text / markdown), JSON download (include version metadata), optional CSV.
* Allow user to mark a session as “archived” or delete (with confirmation & irreversible note).

### 2.9 Offline‑First / Persistence

* Everything client‑side (no backend). Use `localStorage` for quick state + `IndexedDB` (or just one) for history log > \~5 sessions.
* Provide simple import/export JSON to move data between devices.

### 2.10 UX / UI (Mobile‑First)

* Sticky header: Session name, total bank (sum buy‑ins), variance indicator.
* Player list as scrollable cards or rows with large buttons for +Buy‑In.
* Quick Actions per player: + (buy‑in), Cash Out, Rejoin (if left), Edit.
* Color coding: Positive (green), Negative (red), Neutral (gray). Status badges: Active (blue), Left (orange), Finished (purple).
* End Game FAB (floating action button) visible when >= 2 players.
* Stepper modal for End Game: (1) Enter remaining stacks (2) Review variance (3) Settlement result.
* Settlement list should minimize cognitive load: Show each debtor row with exactly one payment line where possible: “Alice pay Bob \$37.50”. Provide “Mark as Paid” toggles (not persisted after lock unless chosen).

### 2.11 Accessibility & Usability

* Large tap targets (≥48px), font scaling support.
* Dark / light mode toggle, store preference.
* No horizontal scrolling.

### 2.12 Error Handling & Validation

* Disallow zero / negative buy‑ins or stacks (except zero stack allowed at exit).
* Confirm destructive actions (undo buy‑in, delete session) with modal.
* If rejoining, visually indicate (badge e.g., “(R2)”). Net merges all periods seamlessly.

---

## 3. Non‑Functional Requirements

* **Deployment:** Static site: `index.html`, JS bundle, CSS. Works on GitHub Pages root or `/poker-settlement/` subpath.
* **Performance:** Initial load < 150KB gzipped. No heavy frameworks required; consider Preact or Vanilla + small state lib (Zustand‑like) or just custom store.
* **State Management:** Central store object: `{ sessions: { [sessionId]: Session }, activeSessionId }` persisted via serialize/deserialize.
* **Reliability:** Autosave on every mutating action (debounced 300ms). Provide manual “Save Now” option.
* **Versioning:** Embed schemaVersion in stored JSON. Add migration layer for future changes.

---

## 4. Data Model (TypeScript Interfaces)

```ts
interface Session {
  id: string;
  name: string;
  currency: string; // e.g. "$"
  createdAt: number; // epoch ms
  closedAt?: number;
  players: { [playerId: string]: Player };
  buyIns: BuyIn[]; // chronological
  cashOuts: CashOut[]; // mid-game or final
  reentries: ReentryEvent[]; // optional
  settings: SessionSettings;
  status: 'open' | 'closed';
  settlement?: SettlementSnapshot;
  version: number; // schema
}
interface Player { id: string; name: string; color?: string; createdAt: number; active: boolean; order: number; rejoinCount: number; }
interface BuyIn { id: string; sessionId: string; playerId: string; amountCents: number; ts: number; deleted?: boolean; }
interface CashOut { id: string; sessionId: string; playerId: string; amountCents: number; ts: number; reason: 'leave' | 'final'; supersededBy?: string; }
interface SessionSettings { varianceToleranceCents: number; quickBuyInOptions: number[]; }
interface SettlementSnapshot { nets: PlayerNet[]; transactions: SettlementTx[]; varianceCents: number; calculatedAt: number; algorithm: string; }
interface PlayerNet { playerId: string; buyInsCents: number; cashOutCents: number; netCents: number; }
interface SettlementTx { fromPlayerId: string; toPlayerId: string; amountCents: number; paid?: boolean; }
```

---

## 5. Algorithms

### 5.1 Compute Player Totals

```
for each player:
  totalBuyIns = sum(buyIns where !deleted and playerId)
  totalCashOut = sum(cashOuts (latest if superseded) for playerId)
  if session.status == 'open' and player active: totalCashOut pending until final
  net = totalCashOut - totalBuyIns
```

### 5.2 Variance Check

```
totalBuyIns = sum(all active buyIns)
totalCashReturned = sum(latest cashOut per player)
variance = totalCashReturned - totalBuyIns
abs(variance) <= tolerance ? OK : warn
```

### 5.3 Min Cash Flow Settlement (Greedy)

```
positives = list of (playerId, amount = net) where net > 0
negatives = list of (playerId, amount = -net) where net < 0
sort descending by amount
while positives && negatives:
  p = positives[0]; n = negatives[0]
  pay = min(p.amount, n.amount)
  record n.player -> p.player : pay
  p.amount -= pay; n.amount -= pay
  if p.amount == 0 remove p; resort top 2 if necessary
  if n.amount == 0 remove n
(optional) compress: if many tiny transactions < threshold, merge with nearest larger via re-run combining small nets first)
```

*Complexity:* O(k log k) with heap for k players having non‑zero nets. Adequate for <= 20 players.

### 5.4 Optional Optimization (Future)

* Implement linear programming for absolute minimal number of transactions (though greedy already minimal for paying off largest counterpart each step). For n creditors + m debtors minimal edges is at least max(n,m)-1; greedy achieves near‑optimal and simple.

### 5.5 Rounding Strategy

* Input & calculations in cents. Display amounts = (cents / 100). If variance arises from manual chip rounding, distribute 1-cent adjustments to largest winners/losers until zero.

---

## 6. UI Flow (High-Level)

1. **Home Screen:** List sessions + “New Session”.
2. **Create Session Modal:** Name, currency, quick buy‑in presets, tolerance.
3. **Session Screen:**

   * Header metrics.
   * Player list (active first, then left, then finalized) with actions.
   * Add Player button.
   * Settlement FAB (End Game).
4. **Add Buy‑In Drawer:** Quick amounts + custom numeric keypad.
5. **Cash Out Modal:** Enter amount, confirm; show total buy‑ins for reference & projected net.
6. **End Game Stepper:** Remaining active players -> input final stacks -> review variance -> show settlement results -> “Lock Session”.
7. **Settlement View:** Read‑only list of transactions with share/export.
8. **History Detail:** Access from Home; show timeline of events (buy‑ins, cashouts) for audit.

---

## 7. Component Breakdown

* `AppStore` (state persistence & actions)
* `SessionList`, `SessionCard`
* `SessionView`
* `PlayerRow` (actions)
* `BuyInModal`, `CashOutModal`, `EndGameWizard`
* `SettlementView` (transaction list)
* `ExportPanel`
* `ThemeToggle`
* `HistoryTimeline`

---

## 8. Actions (State Mutations)

* `createSession(payload)`
* `addPlayer(sessionId, name)`
* `recordBuyIn(sessionId, playerId, amountCents)`
* `undoLastBuyIn(sessionId)` / `undoLastBuyInForPlayer(sessionId, playerId)`
* `cashOutPlayer(sessionId, playerId, amountCents, reason)`
* `editCashOut(cashOutId, newAmountCents)` (marks original superseded)
* `rejoinPlayer(sessionId, playerId)` (increment rejoinCount, set active true)
* `finalizeSession(sessionId, finalStacksMap)` -> compute nets, settlement, lock
* `exportSession(sessionId)` returns JSON
* `importSessions(json)` merges

---

## 9. Pseudocode Example (Finalize)

```ts
function finalizeSession(session: Session, finalStacks: Record<PlayerId, number>) {
  for player in session.players where player.active:
    record cashOut { playerId: player.id, amountCents: finalStacks[player.id], reason: 'final' }
  nets = computePlayerNets(session)
  variance = computeVariance(session)
  txs = minimizeCashFlow(nets)
  session.settlement = { nets, transactions: txs, varianceCents: variance, calculatedAt: now(), algorithm: 'greedy-max-flow-v1' }
  session.status = 'closed';
  save(session)
}
```

---

## 10. Testing Strategy

* **Unit Tests:** Algorithms (nets, variance, settlement). Edge cases: single winner, all equal, many micro buy‑ins, rejoin scenarios.
* **Integration Tests:** Full session lifecycle.
* **Manual Scenarios:** 2, 3, 5, 10 player simulations with random buy‑ins; verify sum of nets = 0.

---

## 11. Security & Privacy

* No backend = minimal exposure. Warn user about local device risk for data loss; encourage export.
* (Optional) Provide passwordless encryption for exported JSON (simple AES with user passphrase) – future enhancement.

---

## 12. Roadmap / Future Enhancements

* Cloud sync (Supabase / Firebase) optional.
* Multi‑currency or point mode (chips not tied to \$ yet, settle in points).
* Rake / time charge deduction support.
* Live estimated stacks (manual adjustments / chip tracking).
* QR share of settlement summary.
* PWA installable offline app manifest.

---

## 13. Delivery Checklist

1. Initialize repo (MIT License, README).
2. Implement data model & store (with persistence + migrations).
3. Build core UI pages & navigation.
4. Implement player & buy‑in flows.
5. Implement cashout & rejoin flows.
6. Implement end game flow & settlement algorithm.
7. Add export/import + history views.
8. Styling (mobile first, dark mode).
9. Testing (unit + integration scripts).
10. Optimize bundle & deploy to GitHub Pages.
11. Write usage documentation & screenshots.

---

## 14. AI Execution Notes

* Follow spec strictly; ask for clarification only if data model ambiguity arises.
* Keep code modular with pure functions for calculations (easy testability).
* Provide TypeScript definitions; if using plain JS, include JSDoc types.
* Commit early & often; include meaningful messages.
* After initial MVP, run data simulations script to validate settlement accuracy.

---

**End of Specification**
