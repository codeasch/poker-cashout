import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { SessionList } from './SessionList';
import { SessionView } from './SessionView';
import { ThemeToggle } from './ThemeToggle';
import { SettingsModal } from './SettingsModal';

export function App() {
  const { activeSessionId, setActiveSession, settings } = useStore();
  const [showSettings, setShowSettings] = useState(false);

  // Apply theme based on settings
  useEffect(() => {
    const applyTheme = () => {
      let theme = settings.theme;
      
      if (theme === 'auto') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      document.documentElement.setAttribute('data-theme', theme);
    };

    applyTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);
    
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Poker Cashout</h1>
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              ⚙️
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="app-main">
        {activeSessionId ? (
          <SessionView 
            sessionId={activeSessionId} 
            onBack={() => setActiveSession(null)}
          />
        ) : (
          <SessionList />
        )}
      </main>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
} 