import React from 'react';
import { Tag, Layers } from 'lucide-react';

interface MainIdeasTabProps {
  mainIdeas: string[];
}

export const MainIdeasTab: React.FC<MainIdeasTabProps> = ({ mainIdeas }) => {
  if (!mainIdeas || mainIdeas.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500 text-xs">
        No topics extracted.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
        <Layers className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-zinc-400">
          Core Concepts & Topics
        </span>
      </div>

      {/* Pill Tags Grid */}
      <div className="flex flex-wrap gap-2">
        {mainIdeas.map((idea, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:border-zinc-700 transition-colors"
          >
            <Tag className="h-3 w-3 text-emerald-400" />
            <span>{idea}</span>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-850 text-xs text-zinc-400">
        These represent the primary recurring topics and entities identified across the document.
      </div>

    </div>
  );
};
