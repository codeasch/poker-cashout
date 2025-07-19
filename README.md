# Poker Cashout & Settlement Tool

A mobile-first static web application for managing live home poker game economics. Track player buy-ins, mid-session cashouts, and automatically calculate simplified settlement instructions.

[Live Link](https://codeasch.github.io/poker-cashout)


## Features

- **Session Management**: Create and manage multiple poker sessions
- **Player Tracking**: Add players with custom colors and track their buy-ins
- **Buy-in Recording**: Quick buy-in buttons and custom amounts
- **Mid-game Cashouts**: Record when players leave with their final stack values
- **Automatic Settlement**: Calculate who pays whom with minimal transactions
- **Variance Checking**: Ensure total cash returned matches total buy-ins
- **Mobile-First Design**: Optimized for mobile devices with large touch targets
- **Dark/Light Theme**: Toggle between themes
- **Offline Support**: Works completely offline with local storage

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd poker-cashout
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## Usage

### Creating a Session

1. Click "New Session" on the home screen
2. Enter a session name (e.g., "Friday Night Poker")
3. Select your currency symbol
4. Click "Create Session"

### Adding Players

1. In your session, click "Add Player"
2. Enter the player's name
3. Optionally select a color for the player
4. Click "Add Player"

### Recording Buy-ins

For each player, you can:
- Use the quick buy-in buttons (e.g., $20, $40, $100)
- Click "+ Buy-in" for custom amounts
- Undo the last buy-in with the "↩" button

### Mid-game Cashouts

When a player leaves:
1. Click "Cash Out" on their player card
2. Enter their final stack value
3. The player will be marked as "Left" and can rejoin later

### Ending the Game

1. Click "End Game" when ready to finish
2. Enter final stack values for all remaining active players
3. Review the variance (should be within tolerance)
4. Click "Finalize Session" to lock the session

### Settlement

After finalizing:
- View the settlement results showing who owes what
- Mark transactions as paid
- Copy the settlement summary to clipboard
- All transactions are optimized to minimize the number of payments

## Data Model

The application uses a comprehensive data model to track:

- **Sessions**: Game events with settings and status
- **Players**: Participants with buy-ins, cashouts, and status
- **Buy-ins**: Timestamped entries with amounts
- **Cash-outs**: Mid-game or final stack values
- **Settlements**: Calculated payment instructions

## Algorithms

### Settlement Calculation

The app uses a greedy algorithm to minimize cash flow:

1. Calculate each player's net (cash-out - buy-ins)
2. Separate creditors (positive net) and debtors (negative net)
3. Match largest creditor with largest debtor
4. Record payment and update amounts
5. Repeat until all balances are settled

### Variance Checking

- Total cash returned = Mid-game cashouts + Final stacks
- Variance = Total cash returned - Total buy-ins
- Warn if variance exceeds tolerance (default $1.00)

## Development

### Project Structure

```
src/
├── components/          # React components
├── store/              # Zustand state management
├── types/              # TypeScript interfaces
├── utils/              # Utility functions
└── styles/             # CSS styles
```

### Key Technologies

- **Preact**: Lightweight React alternative
- **Zustand**: State management with persistence
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **CSS Variables**: Theme support

### State Management

The app uses Zustand with persistence to localStorage:

- Sessions and their data
- Active session selection
- Theme preference
- Automatic saving on every action

## Deployment

The app is designed to be deployed as a static site:

1. Build the project: `npm run build`
2. Deploy the `dist` folder to any static hosting service
3. Works on GitHub Pages, Netlify, Vercel, etc.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] Cloud sync support
- [ ] Multi-currency support
- [ ] Rake/time charge tracking
- [ ] QR code settlement sharing
- [ ] PWA installation support
- [ ] Advanced statistics and history
