import React, { useState } from 'react';
import { Copy, Check, Search } from 'lucide-react';

interface ExtractedTextTabProps {
  extractedText: string;
  onCopyText: (text: string, label: string) => void;
}

export const ExtractedTextTab: React.FC<ExtractedTextTabProps> = ({
  extractedText,
  onCopyText,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyText(extractedText, 'Extracted text');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const charCount = extractedText.length;

  return (
    <div className="space-y-3.5">
      
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search text..."
            className="w-full pl-8 pr-3 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Word count & Copy */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-mono">
            {wordCount} words • {charCount} chars
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Raw Text</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Raw Text Scroll Box */}
      <div className="rounded-lg bg-zinc-950 p-4 border border-zinc-850 max-h-[420px] overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap selection:bg-zinc-800 selection:text-white">
        {searchTerm ? (
          extractedText.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) =>
            part.toLowerCase() === searchTerm.toLowerCase() ? (
              <mark key={i} className="bg-emerald-500/30 text-emerald-300 rounded px-0.5">
                {part}
              </mark>
            ) : (
              part
            )
          )
        ) : (
          extractedText
        )}
      </div>

    </div>
  );
};
