import { useStore } from '../store';

export function ThemeToggle() {
  const { settings, toggleTheme } = useStore();

  return (
    <button 
      className="btn btn-secondary btn-sm"
      onClick={toggleTheme}
      title={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {settings.theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
} 