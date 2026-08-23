import React from 'react';
import { FileText, History, Settings } from 'lucide-react';

interface NavbarProps {
  onNewDocument: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  historyCount: number;
  isFallbackMode: boolean;
  hasDocument: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewDocument,
  onOpenHistory,
  onOpenSettings,
  historyCount,
  isFallbackMode,
  hasDocument,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div 
          onClick={onNewDocument}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-sm">
            D
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-white">
              DocuMind
            </span>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              Document Assistant
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className={`h-1.5 w-1.5 rounded-full ${isFallbackMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span className="text-[11px] font-medium">
              {isFallbackMode ? 'Extractive Engine' : 'AI Analysis'}
            </span>
          </div>

          {hasDocument && (
            <button
              onClick={onNewDocument}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-750 transition-colors"
              title="Upload a new document"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>New</span>
            </button>
          )}

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-750 transition-colors"
            title="View recent documents"
          >
            <History className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-600/20 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-750 transition-colors"
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
