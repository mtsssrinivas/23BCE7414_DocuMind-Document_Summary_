import React from 'react';
import { 
  AlertTriangle, 
  HelpCircle, 
  CheckSquare, 
  FileSearch,
  Sparkles
} from 'lucide-react';
import { ImprovementSuggestion } from '../types';

interface SuggestionsTabProps {
  suggestions: ImprovementSuggestion[];
}

export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({ suggestions }) => {
  const getCategoryDetails = (category: ImprovementSuggestion['category']) => {
    switch (category) {
      case 'missing_info':
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
          badge: 'Missing Info',
          badgeStyle: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
        };
      case 'clarification':
        return {
          icon: <CheckSquare className="h-3.5 w-3.5 text-blue-400" />,
          badge: 'Clarification',
          badgeStyle: 'bg-blue-950/40 text-blue-400 border-blue-800/60',
        };
      case 'review_topic':
        return {
          icon: <FileSearch className="h-3.5 w-3.5 text-emerald-400" />,
          badge: 'Review Topic',
          badgeStyle: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
        };
      case 'follow_up_question':
        return {
          icon: <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />,
          badge: 'Follow-up Question',
          badgeStyle: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
      default:
        return {
          icon: <Sparkles className="h-3.5 w-3.5 text-zinc-400" />,
          badge: 'Note',
          badgeStyle: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500 text-xs">
        No improvement suggestions found for this document.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-zinc-400">
          Document Suggestions & Quality Insights
        </span>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 gap-2.5">
        {suggestions.map((suggestion, index) => {
          const style = getCategoryDetails(suggestion.category);

          return (
            <div
              key={index}
              className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-850 hover:border-zinc-750 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {style.icon}
                  <h4 className="text-xs font-semibold text-zinc-200">
                    {suggestion.title}
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${style.badgeStyle}`}>
                  {style.badge}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed pl-5">
                {suggestion.description}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
};
