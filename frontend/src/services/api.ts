import { 
  ExtractionResponse, 
  SummaryResponse, 
  SummaryLength, 
  AIProvider, 
  DocumentMetadata, 
  SampleDocument 
} from '../types';

const getApiBase = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (!envBase) return '/api';
  const trimmed = envBase.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE = getApiBase();

export async function fetchHealthCheck(): Promise<{
  status: string;
  version: string;
  gemini_configured: boolean;
  openai_configured: boolean;
  tesseract_available: boolean;
}> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchSampleDocuments(): Promise<SampleDocument[]> {
  const res = await fetch(`${API_BASE}/samples`);
  if (!res.ok) {
    throw new Error('Failed to load sample documents');
  }
  const data = await res.json();
  return data.samples || [];
}

export async function extractDocumentFile(file: File): Promise<ExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to extract text from document.' }));
    throw new Error(errorData.detail || `Extraction failed with HTTP ${res.status}`);
  }

  return res.json();
}

export async function generateDocumentSummary(
  text: string,
  length: SummaryLength,
  metadata?: DocumentMetadata,
  customApiKey?: string,
  preferredProvider?: AIProvider
): Promise<SummaryResponse> {
  const res = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      length,
      metadata,
      custom_api_key: customApiKey || undefined,
      preferred_provider: preferredProvider || 'auto',
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to generate summary.' }));
    throw new Error(errorData.detail || `Summarization failed with HTTP ${res.status}`);
  }

  return res.json();
}
