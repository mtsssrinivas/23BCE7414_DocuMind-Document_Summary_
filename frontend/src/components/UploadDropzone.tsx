import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  X, 
  AlertCircle, 
  BookOpen
} from 'lucide-react';
import { SampleDocument, SummaryLength } from '../types';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  onSampleSelected: (sample: SampleDocument) => void;
  sampleDocuments: SampleDocument[];
  selectedFile: File | null;
  onClearFile: () => void;
  isProcessing: boolean;
  summaryLength: SummaryLength;
  onSummaryLengthChange: (length: SummaryLength) => void;
  errorMessage?: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelected,
  onSampleSelected,
  sampleDocuments,
  selectedFile,
  onClearFile,
  isProcessing,
  summaryLength,
  onSummaryLengthChange,
  errorMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFile = (file: File) => {
    setValidationError(null);

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(`File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    const isAcceptedType = ACCEPTED_TYPES.includes(file.type) || 
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg') ||
      file.name.toLowerCase().endsWith('.webp');

    if (!isAcceptedType) {
      setValidationError('Please upload a valid PDF or image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isPdf = selectedFile?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border border-dashed p-6 sm:p-9 text-center transition-all ${
          isDragOver 
            ? 'border-emerald-500 bg-emerald-950/20' 
            : selectedFile 
              ? 'border-zinc-700 bg-zinc-900/60' 
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".pdf,.png,.jpg,.jpeg,.webp" 
          className="hidden" 
          onChange={handleFileInputChange}
          disabled={isProcessing}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
              <UploadCloud className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-200">
                Drop your document here
              </h3>
              <p className="text-xs text-zinc-400">
                PDF, PNG or JPG up to 10MB
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs text-zinc-900 bg-emerald-400 hover:bg-emerald-300 transition-colors"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Browse File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className={`p-2 rounded-md ${isPdf ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {isPdf ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {formatBytes(selectedFile.size)} • {isPdf ? 'PDF Document' : 'Image File'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClearFile}
                disabled={isProcessing}
                className="p-1 text-zinc-400 hover:text-rose-400 rounded transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-left">
              <span className="text-xs font-medium text-zinc-300">
                Summary Length:
              </span>
              <div className="flex items-center bg-zinc-950 p-0.5 rounded-md border border-zinc-800">
                {(['short', 'medium', 'long'] as SummaryLength[]).map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => onSummaryLengthChange(len)}
                    className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                      summaryLength === len
                        ? 'bg-zinc-800 text-emerald-400 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {(validationError || errorMessage) && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-rose-300/80 text-[11px]">{validationError || errorMessage}</p>
          </div>
        </div>
      )}

      {sampleDocuments.length > 0 && !selectedFile && (
        <div className="pt-2">
          <div className="flex items-center gap-1.5 mb-2.5">
            <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400">
              Or test with sample documents:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {sampleDocuments.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSampleSelected(sample)}
                disabled={isProcessing}
                className="flex flex-col text-left p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-1">
                  {sample.category}
                </span>
                <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
                  {sample.text.slice(0, 80)}...
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
