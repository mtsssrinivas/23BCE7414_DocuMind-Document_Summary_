import React from 'react';
import { FileText, Zap, Shield } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="pt-8 pb-4 text-center">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium mb-3">
        <span>Document Summarizer & Analyzer</span>
      </div>

      <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-100 max-w-2xl mx-auto">
        Understand your documents faster
      </h1>

      <p className="mt-2.5 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto font-normal">
        Upload a PDF or scanned document to extract text, generate structured summaries, and highlight key points.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-emerald-400" />
          <span>PDF & OCR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-emerald-400" />
          <span>Short / Med / Long</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span>Extractive Fallback</span>
        </div>
      </div>
    </div>
  );
};
