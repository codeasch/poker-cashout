import { useState } from 'preact/hooks';
import { useStore } from '../store';
import { formatCurrency } from '../utils/currency';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings(settings);
  };

  const updateQuickBuyIn = (index: number, value: string) => {
    const amount = parseFloat(value);
    if (amount > 0) {
      const amountCents = Math.round(amount * 100);
      const newQuickBuyIns = [...localSettings.quickBuyInOptions];
      newQuickBuyIns[index] = amountCents;
      setLocalSettings(prev => ({
        ...prev,
        quickBuyInOptions: newQuickBuyIns
      }));
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setLocalSettings(prev => ({ ...prev, currency }));
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    setLocalSettings(prev => ({ ...prev, theme }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Settings</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="space-y-4">
          {/* Currency */}
          <div className="form-group">
            <label className="form-label">Currency Symbol</label>
            <div className="flex gap-2">
              {['$', '€', '£', '¥', '₹'].map(symbol => (
                <button
                  key={symbol}
                  className={`btn ${localSettings.currency === symbol ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleCurrencyChange(symbol)}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="form-group">
            <label className="form-label">Theme</label>
            <div className="flex gap-2">
              {[
                { value: 'light' as const, label: 'Light' },
                { value: 'dark' as const, label: 'Dark' },
                { value: 'auto' as const, label: 'Auto' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`btn ${localSettings.theme === value ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleThemeChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Buy-in Options - Always 3 buttons */}
          <div className="form-group">
            <label className="form-label">Quick Buy-in Amounts</label>
            <p className="text-sm text-secondary mb-3">
              Set the values for the 3 quick buy-in buttons
            </p>
            
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-3">
                  <label className="form-label text-sm w-20">Button {index + 1}:</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm">{localSettings.currency}</span>
                    <input
                      type="number"
                      className="form-input flex-1"
                      value={localSettings.quickBuyInOptions[index] / 100}
                      onChange={(e) => updateQuickBuyIn(index, e.currentTarget.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="text-sm text-secondary">
                    = {formatCurrency(localSettings.quickBuyInOptions[index], localSettings.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variance Tolerance */}
          <div className="form-group">
            <label className="form-label">Default Variance Tolerance</label>
            <input
              type="number"
              className="form-input"
              value={localSettings.defaultVarianceTolerance / 100}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                defaultVarianceTolerance: Math.round(parseFloat(e.currentTarget.value) * 100)
              }))}
              step="0.01"
              min="0"
            />
            <small className="text-secondary">
              Maximum allowed difference between total buy-ins and cash-outs (in {localSettings.currency})
            </small>
          </div>

          {/* Other Settings */}
          <div className="form-group">
            <label className="form-label">Other Options</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.showConfirmations}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    showConfirmations: e.currentTarget.checked
                  }))}
                />
                Show confirmation dialogs
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.autoSave}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    autoSave: e.currentTarget.checked
                  }))}
                />
                Auto-save changes
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button className="btn btn-secondary" onClick={handleReset}>
              Reset to Defaults
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 