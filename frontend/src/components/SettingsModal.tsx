import React, { useState } from 'react';
import { X, Key, Check } from 'lucide-react';
import { UserSettings } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [customApiKey, setCustomApiKey] = useState(settings.customApiKey || '');
  const [preferredProvider, setPreferredProvider] = useState<UserSettings['preferredProvider']>(
    settings.preferredProvider || 'auto'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      customApiKey: customApiKey.trim(),
      preferredProvider,
      defaultLength: settings.defaultLength || 'medium',
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl z-10 animate-fade-in space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">API Settings</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Provider Mode Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 block">
              Intelligence Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreferredProvider('auto')}
                className={`p-2.5 rounded-lg text-left border transition-colors ${
                  preferredProvider === 'auto'
                    ? 'bg-zinc-800 border-emerald-500/50 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-semibold block">AI / Gemini</span>
                <span className="text-[10px] text-zinc-500">LLM with auto fallback</span>
              </button>

              <button
                type="button"
                onClick={() => setPreferredProvider('fallback')}
                className={`p-2.5 rounded-lg text-left border transition-colors ${
                  preferredProvider === 'fallback'
                    ? 'bg-zinc-800 border-emerald-500/50 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-semibold block">Extractive Fallback</span>
                <span className="text-[10px] text-zinc-500">Deterministic NLP offline</span>
              </button>
            </div>
          </div>

          {/* Custom API Key Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 block">
              Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="AIzaSy... (Leave blank for fallback mode)"
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-mono"
            />
            <p className="text-[11px] text-zinc-500">
              Keys are stored solely in your local browser session.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-750 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium text-zinc-900 bg-emerald-400 hover:bg-emerald-300 transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
