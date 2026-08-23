export type SummaryLength = 'short' | 'medium' | 'long';
export type AIProvider = 'gemini' | 'openai' | 'fallback' | 'auto';

export interface DocumentMetadata {
  filename: string;
  file_type: string;
  file_size_bytes: number;
  file_size_formatted: string;
  page_count: number | null;
  word_count: number;
  character_count: number;
  estimated_reading_time_min: number;
}

export interface ImprovementSuggestion {
  category: 'missing_info' | 'clarification' | 'review_topic' | 'follow_up_question';
  title: string;
  description: string;
}

export interface ExtractionResponse {
  success: boolean;
  text: string;
  metadata: DocumentMetadata;
  method: 'pdf_parser' | 'ocr' | 'raw_text';
  message?: string;
}

export interface SummaryResponse {
  success: boolean;
  summary: string;
  key_points: string[];
  main_ideas: string[];
  improvement_suggestions: ImprovementSuggestion[];
  summary_length: SummaryLength;
  provider_used: 'gemini' | 'openai' | 'fallback_extractive';
  is_fallback: boolean;
  fallback_reason?: string;
  metadata?: DocumentMetadata;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  filename: string;
  file_type: string;
  summary: string;
  summary_length: SummaryLength;
  key_points: string[];
  main_ideas: string[];
  improvement_suggestions: ImprovementSuggestion[];
  extracted_text: string;
  metadata: DocumentMetadata;
  provider_used: string;
  is_fallback: boolean;
}

export interface SampleDocument {
  id: string;
  title: string;
  category: string;
  filename: string;
  text: string;
}

export interface ProcessingStep {
  id: number;
  title: string;
  description: string;
  status: 'waiting' | 'active' | 'completed' | 'error';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}
