import React, { useState } from 'react';
import { 
  FileText, 
  Target, 
  Layers, 
  Sparkles, 
  ArrowLeft 
} from 'lucide-react';
import { DocumentMetadata, SummaryResponse, SummaryLength } from '../types';
import { DocumentMetadataCard } from './DocumentMetadataCard';
import { SummaryTab } from './SummaryTab';
import { KeyPointsTab } from './KeyPointsTab';
import { MainIdeasTab } from './MainIdeasTab';
import { SuggestionsTab } from './SuggestionsTab';
import { ExtractedTextTab } from './ExtractedTextTab';

interface ResultsDashboardProps {
  summary: SummaryResponse;
  extractedText: string;
  metadata: DocumentMetadata;
  summaryLength: SummaryLength;
  onLengthChange: (len: SummaryLength) => void;
  onUploadAnother: () => void;
  onReanalyze: () => void;
  onExportMarkdown: () => void;
  onExportText: () => void;
  onPrintReport: () => void;
  onCopyText: (text: string, label: string) => void;
}

type TabType = 'summary' | 'key_points' | 'main_ideas' | 'suggestions' | 'extracted_text';

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  summary,
  extractedText,
  metadata,
  summaryLength,
  onLengthChange,
  onUploadAnother,
  onReanalyze,
  onExportMarkdown,
  onExportText,
  onPrintReport,
  onCopyText,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  const tabs: { id: TabType; label: string; count?: number }[] = [
    {
      id: 'summary',
      label: 'Summary',
    },
    {
      id: 'key_points',
      label: 'Key Points',
      count: summary.key_points?.length || 0,
    },
    {
      id: 'main_ideas',
      label: 'Topics',
      count: summary.main_ideas?.length || 0,
    },
    {
      id: 'suggestions',
      label: 'Suggestions',
      count: summary.improvement_suggestions?.length || 0,
    },
    {
      id: 'extracted_text',
      label: 'Raw Text',
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 animate-fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onUploadAnother}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Upload Another</span>
        </button>
        <span className="text-xs text-zinc-500 font-mono">
          {metadata.filename}
        </span>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Metadata Card (4 cols) */}
        <div className="lg:col-span-4 w-full">
          <DocumentMetadataCard
            metadata={metadata}
            summary={summary}
            onUploadAnother={onUploadAnother}
            onReanalyze={onReanalyze}
            onExportMarkdown={onExportMarkdown}
            onExportText={onExportText}
            onPrintReport={onPrintReport}
          />
        </div>

        {/* RIGHT COLUMN: Tabbed Results (8 cols) */}
        <div className="lg:col-span-8 w-full rounded-xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 shadow-sm space-y-4">
          
          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-zinc-800">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-emerald-400 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isActive 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab View Body */}
          <div className="min-h-[350px]">
            {activeTab === 'summary' && (
              <SummaryTab
                summaryText={summary.summary}
                summaryLength={summaryLength}
                onLengthChange={onLengthChange}
                isFallback={summary.is_fallback}
                fallbackReason={summary.fallback_reason}
                onCopyText={onCopyText}
              />
            )}

            {activeTab === 'key_points' && (
              <KeyPointsTab
                keyPoints={summary.key_points}
                onCopyText={onCopyText}
              />
            )}

            {activeTab === 'main_ideas' && (
              <MainIdeasTab
                mainIdeas={summary.main_ideas}
              />
            )}

            {activeTab === 'suggestions' && (
              <SuggestionsTab
                suggestions={summary.improvement_suggestions}
              />
            )}

            {activeTab === 'extracted_text' && (
              <ExtractedTextTab
                extractedText={extractedText}
                onCopyText={onCopyText}
              />
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
