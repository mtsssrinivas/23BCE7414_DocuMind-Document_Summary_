import React from 'react';
import { 
  FileText, 
  Layers, 
  HardDrive, 
  Clock, 
  Cpu, 
  RotateCcw, 
  Upload, 
  Download, 
  Printer, 
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { DocumentMetadata, SummaryResponse } from '../types';

interface DocumentMetadataCardProps {
  metadata: DocumentMetadata;
  summary: SummaryResponse;
  onUploadAnother: () => void;
  onReanalyze: () => void;
  onExportMarkdown: () => void;
  onExportText: () => void;
  onPrintReport: () => void;
}

export const DocumentMetadataCard: React.FC<DocumentMetadataCardProps> = ({
  metadata,
  summary,
  onUploadAnother,
  onReanalyze,
  onExportMarkdown,
  onExportText,
  onPrintReport,
}) => {
  const isPdf = metadata.file_type.toLowerCase().includes('pdf') || metadata.filename.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-4">
      
      {/* Main File Details Card */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-sm">
        
        {/* Document Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-zinc-800">
          <div className={`p-2.5 rounded-lg shrink-0 ${
            isPdf 
              ? 'bg-red-500/10 text-red-400' 
              : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Document
            </span>
            <h2 className="text-sm font-semibold text-zinc-100 truncate" title={metadata.filename}>
              {metadata.filename}
            </h2>
            <p className="text-xs text-zinc-400">
              {metadata.file_type}
            </p>
          </div>
        </div>

        {/* Intelligence Statistics Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          
          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
            <span className="text-[11px] text-zinc-500 block mb-0.5">File Size</span>
            <p className="text-xs font-medium text-zinc-200">
              {metadata.file_size_formatted}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
            <span className="text-[11px] text-zinc-500 block mb-0.5">Pages</span>
            <p className="text-xs font-medium text-zinc-200">
              {metadata.page_count ? `${metadata.page_count} ${metadata.page_count === 1 ? 'Page' : 'Pages'}` : '1 Page'}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
            <span className="text-[11px] text-zinc-500 block mb-0.5">Word Count</span>
            <p className="text-xs font-medium text-zinc-200">
              {metadata.word_count.toLocaleString()} words
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
            <span className="text-[11px] text-zinc-500 block mb-0.5">Reading Time</span>
            <p className="text-xs font-medium text-zinc-200">
              ~{metadata.estimated_reading_time_min} min
            </p>
          </div>

        </div>

        {/* Engine Status Callout */}
        <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-850 flex items-center justify-between text-xs mb-4">
          <div>
            <span className="text-zinc-300 font-medium text-xs block">
              {summary.provider_used === 'fallback_extractive' ? 'Extractive Fallback' : 'AI Analysis'}
            </span>
            <span className="text-[10px] text-zinc-500">
              {summary.is_fallback ? 'Deterministic NLP' : 'Cloud LLM'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Ready</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onUploadAnother}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs text-zinc-900 bg-emerald-400 hover:bg-emerald-300 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Another Document</span>
          </button>

          <button
            type="button"
            onClick={onReanalyze}
            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 rounded-lg border border-zinc-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
            <span>Re-analyze</span>
          </button>
        </div>

      </div>

      {/* Export / Download Hub */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 shadow-sm">
        <span className="text-xs font-semibold text-zinc-400 block mb-2.5">
          Export Report
        </span>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onExportMarkdown}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Download as Markdown"
          >
            <span className="text-xs font-semibold text-emerald-400">.MD</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Markdown</span>
          </button>

          <button
            type="button"
            onClick={onExportText}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Download as Plain Text"
          >
            <span className="text-xs font-semibold text-emerald-400">.TXT</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Text</span>
          </button>

          <button
            type="button"
            onClick={onPrintReport}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Print or Save as PDF"
          >
            <Printer className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] text-zinc-500 mt-0.5">Print PDF</span>
          </button>
        </div>
      </div>

    </div>
  );
};
