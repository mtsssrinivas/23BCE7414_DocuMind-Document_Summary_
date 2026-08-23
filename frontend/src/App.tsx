import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { UploadDropzone } from './components/UploadDropzone';
import { ProcessingPipeline } from './components/ProcessingPipeline';
import { ResultsDashboard } from './components/ResultsDashboard';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/Toast';

import { 
  extractDocumentFile, 
  generateDocumentSummary, 
  fetchSampleDocuments, 
  fetchHealthCheck 
} from './services/api';
import { storageService, UserSettings } from './services/storageService';
import { exportService } from './services/exportService';
import { performClientOcr } from './services/clientOcrService';
import { extractTextFromPdfClient } from './services/clientPdfService';
import { generateClientSummary } from './services/clientSummarizerService';

import { 
  DocumentMetadata, 
  SummaryResponse, 
  SummaryLength, 
  HistoryItem, 
  SampleDocument, 
  ProcessingStep, 
  ToastMessage 
} from './types';

const INITIAL_PIPELINE_STEPS: ProcessingStep[] = [
  { id: 1, title: 'Document Upload', description: 'File received and verified', status: 'waiting' },
  { id: 2, title: 'Text Extraction & OCR', description: 'Parsing document layout and characters', status: 'waiting' },
  { id: 3, title: 'Structural Analysis', description: 'Evaluating key topics and density', status: 'waiting' },
  { id: 4, title: 'Summary Generation', description: 'Generating structured summary and takeaways', status: 'waiting' },
];

const DEFAULT_SAMPLES: SampleDocument[] = [
  {
    id: "technical-assessment",
    title: "Technical Assessment Specification",
    category: "Specification",
    filename: "Technical_Assessment_Project_SE.pdf",
    text: `Subject: Technical Assessment Project - Software Engineering Position

Dear Candidate,

Thank you for your interest in the Software Engineer position. We've reviewed your application and would like to proceed with our technical assessment phase. We believe in evaluating candidates through practical, real-world scenarios.

Here is your project challenge:
Project: Document Summary Assistant is an application that takes any document (PDF/Image) and generates smart summaries.

Required Features:
1. Document Upload:
- Allow users to upload PDF files and image files.
- Support drag-and-drop or file picker interface for easy uploads.
- Validate maximum file sizes (up to 10MB) and supported document formats.

2. Text Extraction:
- PDF Parsing: Extract text from PDFs while maintaining formatting and structural integrity.
- OCR: For image files, extract text using OCR technology such as Tesseract.

3. Summary Generation:
- Automatically generate smart summaries of the document content.
- Provide options for summary length (short, medium, long).
- Highlight key points and main ideas, ensuring the summary captures essential information.`
  },
  {
    id: "ai-research",
    title: "Transformer Architecture & Large Language Models",
    category: "AI Research",
    filename: "Attention_Is_All_You_Need_Overview.pdf",
    text: `Title: Attention Mechanisms and Modern Transformer Architectures in AI

Abstract:
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The Transformer model architecture eschews recurrence and instead relies entirely on self-attention mechanisms to draw global dependencies between input and output representations.

1. Introduction
Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time generates a sequence of hidden states. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths.`
  },
  {
    id: "business-contract",
    title: "Software License & Master Services Agreement",
    category: "Agreement",
    filename: "Master_Services_Agreement_2026.pdf",
    text: `MASTER SERVICES AND SOFTWARE LICENSE AGREEMENT

This Master Services Agreement is entered into as of January 15, 2026, by and between DocuMind Technologies Inc. and the Client.

1. Scope of Services & Deliverables
Provider agrees to deliver cloud-based Document Intelligence, OCR text extraction, and automated summarization APIs in accordance with the specifications. All services shall be performed in a professional manner conforming to industry best practices.

2. Service Level Agreement
Provider warrants 99.95% monthly uptime for production API endpoints.`
  }
];

export const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineStepIndex, setPipelineStepIndex] = useState<number>(0);
  const [pipelineStatusMessage, setPipelineStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<UserSettings>(storageService.getSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [sampleDocuments, setSampleDocuments] = useState<SampleDocument[]>(DEFAULT_SAMPLES);
  const [serverHealth, setServerHealth] = useState<{ gemini_configured: boolean; openai_configured: boolean } | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    setHistory(storageService.getHistory());

    fetchHealthCheck()
      .then((health) => setServerHealth(health))
      .catch(() => {});

    fetchSampleDocuments()
      .then((samples) => {
        if (samples && samples.length > 0) setSampleDocuments(samples);
      })
      .catch(() => {});
  }, []);

  const processUploadedDocument = async (file: File, targetLength: SummaryLength = summaryLength) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setPipelineStepIndex(0);
    setPipelineStatusMessage('Reading document...');

    try {
      await new Promise((r) => setTimeout(r, 200));
      setPipelineStepIndex(1);
      setPipelineStatusMessage('Extracting text...');

      let docText = '';
      let pageCount = 1;

      const isImage = file.type.startsWith('image/') || 
        file.name.toLowerCase().endsWith('.png') || 
        file.name.toLowerCase().endsWith('.jpg') || 
        file.name.toLowerCase().endsWith('.jpeg') ||
        file.name.toLowerCase().endsWith('.webp');

      if (isImage) {
        setPipelineStatusMessage('Running OCR...');
        try {
          docText = await performClientOcr(file, (_p, status) => {
            setPipelineStatusMessage(status);
          });
        } catch {
          try {
            const res = await extractDocumentFile(file);
            docText = res.text;
          } catch {
            throw new Error('Could not extract text from image. Please ensure the image is clear and contains readable text.');
          }
        }
      } else {
        // PDF Document: Try backend first, fallback to in-browser pdfjs-dist
        setPipelineStatusMessage('Parsing PDF content...');
        try {
          const res = await extractDocumentFile(file);
          docText = res.text;
          pageCount = res.metadata?.page_count || 1;
        } catch (serverExtractErr) {
          try {
            const clientPdf = await extractTextFromPdfClient(file);
            docText = clientPdf.text;
            pageCount = clientPdf.pageCount;
          } catch (clientPdfErr: any) {
            throw new Error(clientPdfErr.message || 'Failed to extract text from PDF.');
          }
        }
      }

      if (!docText || docText.trim().length < 5) {
        throw new Error('No readable text could be extracted from this document.');
      }

      const words = docText.split(/\s+/).filter(Boolean);
      const docMeta: DocumentMetadata = {
        filename: file.name,
        file_type: isImage ? 'Scanned Image (OCR)' : 'PDF Document',
        file_size_bytes: file.size,
        file_size_formatted: `${(file.size / 1024).toFixed(1)} KB`,
        page_count: pageCount,
        word_count: words.length,
        character_count: docText.length,
        estimated_reading_time_min: +(words.length / 225).toFixed(1),
      };

      setExtractedText(docText);
      setMetadata(docMeta);

      setPipelineStepIndex(2);
      setPipelineStatusMessage('Analyzing document structure...');
      await new Promise((r) => setTimeout(r, 250));

      setPipelineStepIndex(3);
      setPipelineStatusMessage('Generating summary...');

      let summaryRes: SummaryResponse;
      try {
        summaryRes = await generateDocumentSummary(
          docText,
          targetLength,
          docMeta,
          settings.customApiKey,
          settings.preferredProvider
        );
      } catch (summarizeErr) {
        summaryRes = generateClientSummary(docText, targetLength, docMeta);
      }

      setSummary(summaryRes);

      const historyItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
        filename: docMeta.filename,
        file_type: docMeta.file_type,
        summary: summaryRes.summary,
        summary_length: targetLength,
        key_points: summaryRes.key_points,
        main_ideas: summaryRes.main_ideas,
        improvement_suggestions: summaryRes.improvement_suggestions,
        extracted_text: docText,
        metadata: docMeta,
        provider_used: summaryRes.provider_used,
        is_fallback: summaryRes.is_fallback,
      };

      storageService.saveItem(historyItem);
      setHistory(storageService.getHistory());

      addToast('Document analyzed successfully', 'success');
    } catch (err: any) {
      console.error('Processing error:', err);
      setErrorMessage(err.message || 'Failed to process document. Please try again.');
      addToast(err.message || 'Failed to process document', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSampleSelected = async (sample: SampleDocument) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSelectedFile(null);
    setPipelineStepIndex(0);
    setPipelineStatusMessage(`Loading "${sample.title}"...`);

    try {
      await new Promise((r) => setTimeout(r, 200));
      setPipelineStepIndex(1);
      setPipelineStatusMessage('Loading sample document...');

      const docText = sample.text;
      const wordCount = docText.split(/\s+/).filter(Boolean).length;
      const docMeta: DocumentMetadata = {
        filename: sample.filename,
        file_type: 'Sample Document (PDF Format)',
        file_size_bytes: docText.length * 2,
        file_size_formatted: `${(docText.length / 500).toFixed(1)} KB`,
        page_count: 2,
        word_count: wordCount,
        character_count: docText.length,
        estimated_reading_time_min: +(wordCount / 225).toFixed(1),
      };

      setExtractedText(docText);
      setMetadata(docMeta);

      setPipelineStepIndex(2);
      setPipelineStatusMessage('Analyzing structure...');
      await new Promise((r) => setTimeout(r, 200));

      setPipelineStepIndex(3);
      setPipelineStatusMessage('Generating summary...');

      let summaryRes: SummaryResponse;
      try {
        summaryRes = await generateDocumentSummary(
          docText,
          summaryLength,
          docMeta,
          settings.customApiKey,
          settings.preferredProvider
        );
      } catch {
        summaryRes = generateClientSummary(docText, summaryLength, docMeta);
      }

      setSummary(summaryRes);

      const historyItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
        filename: sample.filename,
        file_type: docMeta.file_type,
        summary: summaryRes.summary,
        summary_length: summaryLength,
        key_points: summaryRes.key_points,
        main_ideas: summaryRes.main_ideas,
        improvement_suggestions: summaryRes.improvement_suggestions,
        extracted_text: docText,
        metadata: docMeta,
        provider_used: summaryRes.provider_used,
        is_fallback: summaryRes.is_fallback,
      };

      storageService.saveItem(historyItem);
      setHistory(storageService.getHistory());

      addToast(`"${sample.title}" analyzed successfully`, 'success');
    } catch (err: any) {
      console.error('Sample processing error:', err);
      setErrorMessage(err.message || 'Failed to process sample document.');
      addToast('Failed to analyze sample document', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummaryLengthChange = async (newLength: SummaryLength) => {
    setSummaryLength(newLength);
    if (!extractedText || !metadata) return;

    try {
      addToast(`Updating to ${newLength} summary...`, 'info');
      let summaryRes: SummaryResponse;
      try {
        summaryRes = await generateDocumentSummary(
          extractedText,
          newLength,
          metadata,
          settings.customApiKey,
          settings.preferredProvider
        );
      } catch {
        summaryRes = generateClientSummary(extractedText, newLength, metadata);
      }
      setSummary(summaryRes);
      addToast(`Updated to ${newLength} summary`, 'success');
    } catch (err: any) {
      console.error('Re-summarization error:', err);
      addToast('Failed to update summary length', 'error');
    }
  };

  const handleReanalyze = () => {
    if (selectedFile) {
      processUploadedDocument(selectedFile, summaryLength);
    } else if (extractedText && metadata) {
      handleSummaryLengthChange(summaryLength);
    }
  };

  const handleNewDocument = () => {
    setSelectedFile(null);
    setExtractedText(null);
    setMetadata(null);
    setSummary(null);
    setErrorMessage(null);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setSelectedFile(null);
    setExtractedText(item.extracted_text);
    setMetadata(item.metadata);
    setSummary({
      success: true,
      summary: item.summary,
      key_points: item.key_points,
      main_ideas: item.main_ideas,
      improvement_suggestions: item.improvement_suggestions,
      summary_length: item.summary_length,
      provider_used: (item.provider_used as any) || 'fallback_extractive',
      is_fallback: item.is_fallback,
      metadata: item.metadata,
    });
    setSummaryLength(item.summary_length);
    addToast(`Restored "${item.filename}" from history`, 'info');
  };

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    addToast('Settings saved', 'success');
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} copied to clipboard`, 'success');
    } catch {
      addToast('Failed to copy to clipboard', 'error');
    }
  };

  const isFallbackActive = summary?.is_fallback || 
    (!serverHealth?.gemini_configured && !serverHealth?.openai_configured && !settings.customApiKey);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <Navbar
        onNewDocument={handleNewDocument}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={history.length}
        isFallbackMode={Boolean(isFallbackActive)}
        hasDocument={Boolean(summary && metadata)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {isProcessing && (
          <ProcessingPipeline
            steps={INITIAL_PIPELINE_STEPS}
            currentStepIndex={pipelineStepIndex}
            filename={selectedFile?.name || metadata?.filename || 'Document'}
            statusMessage={pipelineStatusMessage}
          />
        )}

        {!isProcessing && (!summary || !metadata) && (
          <div className="space-y-6 animate-fade-in">
            <Hero />
            
            <UploadDropzone
              onFileSelected={(file) => {
                setSelectedFile(file);
                processUploadedDocument(file, summaryLength);
              }}
              onSampleSelected={handleSampleSelected}
              sampleDocuments={sampleDocuments}
              selectedFile={selectedFile}
              onClearFile={() => setSelectedFile(null)}
              isProcessing={isProcessing}
              summaryLength={summaryLength}
              onSummaryLengthChange={(len) => setSummaryLength(len)}
              errorMessage={errorMessage}
            />
          </div>
        )}

        {!isProcessing && summary && metadata && extractedText && (
          <ResultsDashboard
            summary={summary}
            extractedText={extractedText}
            metadata={metadata}
            summaryLength={summaryLength}
            onLengthChange={handleSummaryLengthChange}
            onUploadAnother={handleNewDocument}
            onReanalyze={handleReanalyze}
            onExportMarkdown={() => exportService.downloadMarkdown(metadata.filename, summary, metadata)}
            onExportText={() => exportService.downloadPlainText(metadata.filename, summary, metadata)}
            onPrintReport={() => exportService.printDocumentReport(metadata.filename, summary, metadata)}
            onCopyText={handleCopyText}
          />
        )}
      </main>

      <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-5 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-400">DocuMind</span>
            <span>•</span>
            <span>Document Summary Assistant</span>
          </div>
          <div>
            Built with React, TypeScript & FastAPI
          </div>
        </div>
      </footer>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onDeleteItem={(id) => setHistory(storageService.deleteItem(id))}
        onClearAll={() => {
          storageService.clearHistory();
          setHistory([]);
          addToast('History cleared', 'info');
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
      />
    </div>
  );
};
export default App;
