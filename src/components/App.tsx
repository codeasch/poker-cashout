import { useEffect } from 'preact/hooks';
import { useAppStore } from '../store';
import { SessionList } from './SessionList';
import { SessionView } from './SessionView';
import { ThemeToggle } from './ThemeToggle';

export function App() {
  const { theme, setTheme, activeSessionId, getActiveSession } = useAppStore();

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const activeSession = getActiveSession();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Poker Cashout</h1>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="app-main">
        {activeSession ? (
          <SessionView session={activeSession} />
        ) : (
          <SessionList />
        )}
      </main>
    </div>
  );
} 