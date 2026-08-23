import React, { useState } from 'react';
import { Copy, Check, Sparkles, FileText } from 'lucide-react';
import { SummaryLength } from '../types';

interface SummaryTabProps {
  summaryText: string;
  summaryLength: SummaryLength;
  onLengthChange: (len: SummaryLength) => void;
  isFallback: boolean;
  fallbackReason?: string;
  onCopyText: (text: string, label: string) => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  summaryText,
  summaryLength,
  onLengthChange,
  isFallback,
  onCopyText,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyText(summaryText, 'Executive summary');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paragraphs = summaryText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const wordCount = summaryText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-800/80">
        
        {/* Length Controls */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-zinc-400">
            Summary Depth:
          </span>
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
            {(['short', 'medium', 'long'] as SummaryLength[]).map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => onLengthChange(len)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  summaryLength === len
                    ? 'bg-zinc-800 text-emerald-400 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {len}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics & Copy Button */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-mono">
            {wordCount} words
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-200 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 hover:border-zinc-700 transition-colors"
            title="Copy summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-zinc-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Summary Narrative Content */}
      <div className="space-y-4">
        {paragraphs.map((para, i) => (
          <div 
            key={i} 
            className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-850 hover:border-zinc-800 transition-colors text-[14.5px] text-zinc-200 leading-relaxed font-normal"
          >
            <div className="flex items-start gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500/80 shrink-0 mt-2" />
              <p className="text-zinc-200 leading-7">
                {para}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
