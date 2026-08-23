import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  History, 
  ArrowRight, 
  Search, 
  Clock
} from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onDeleteItem,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter(
    item =>
      item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 shadow-xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Document History</h3>
              <span className="text-xs text-zinc-500">
                ({history.length})
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-zinc-850 bg-zinc-950/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-8 pr-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-14 text-zinc-500 space-y-1">
                <p className="text-xs">No documents found</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-850 hover:border-zinc-700 p-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div 
                      onClick={() => {
                        onSelectHistoryItem(item);
                        onClose();
                      }}
                      className="cursor-pointer flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{formatTimestamp(item.timestamp)}</span>
                        <span>•</span>
                        <span className="capitalize text-emerald-400 font-medium">
                          {item.summary_length}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                        {item.filename}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-800 transition-all shrink-0"
                      title="Delete item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p 
                    onClick={() => {
                      onSelectHistoryItem(item);
                      onClose();
                    }}
                    className="text-[11px] text-zinc-400 line-clamp-2 cursor-pointer mt-1"
                  >
                    {item.summary}
                  </p>

                  <div 
                    onClick={() => {
                      onSelectHistoryItem(item);
                      onClose();
                    }}
                    className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-900 cursor-pointer text-[10px] text-zinc-500"
                  >
                    <span>{item.metadata.word_count} words</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                      <span>View</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="p-3 border-t border-zinc-800 bg-zinc-950/40">
              <button
                type="button"
                onClick={onClearAll}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear All History</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
