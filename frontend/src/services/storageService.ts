import { HistoryItem } from '../types';

const STORAGE_KEY = 'documind_history';
const SETTINGS_KEY = 'documind_settings';

export interface UserSettings {
  customApiKey?: string;
  preferredProvider: 'auto' | 'gemini' | 'openai' | 'fallback';
  defaultLength: 'short' | 'medium' | 'long';
}

export const storageService = {
  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveItem(item: HistoryItem): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter(h => h.id !== item.id);
      const updated = [item, ...filtered].slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  },

  deleteItem(id: string): HistoryItem[] {
    try {
      const history = this.getHistory().filter(h => h.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      return history;
    } catch {
      return [];
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        customApiKey: '',
        preferredProvider: 'auto',
        defaultLength: 'medium',
      };
    } catch {
      return {
        customApiKey: '',
        preferredProvider: 'auto',
        defaultLength: 'medium',
      };
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }
};
