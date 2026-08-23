import React, { useState } from 'react';
import { Copy, Check, Target } from 'lucide-react';

interface KeyPointsTabProps {
  keyPoints: string[];
  onCopyText: (text: string, label: string) => void;
}

export const KeyPointsTab: React.FC<KeyPointsTabProps> = ({ keyPoints, onCopyText }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyPoint = (point: string, idx: number) => {
    onCopyText(point, `Key Point #${idx + 1}`);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n');
    onCopyText(allText, 'All Key Points');
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (!keyPoints || keyPoints.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500 text-xs">
        No key points extracted.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-400">
            {keyPoints.length} Key Takeaways
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyAll}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 transition-colors"
        >
          {copiedAll ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied All</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy All</span>
            </>
          )}
        </button>
      </div>

      {/* Cards List */}
      <div className="space-y-2.5">
        {keyPoints.map((point, index) => (
          <div
            key={index}
            className="group flex items-start justify-between gap-3 p-3.5 rounded-lg bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-800 text-[11px] font-semibold text-zinc-400 mt-0.5">
                {index + 1}
              </span>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {point}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCopyPoint(point, index)}
              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-all shrink-0"
              title="Copy point"
            >
              {copiedIndex === index ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
