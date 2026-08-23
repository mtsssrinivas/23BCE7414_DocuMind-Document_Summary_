from typing import List, Optional, Literal
from pydantic import BaseModel, Field

SummaryLength = Literal["short", "medium", "long"]
AIProvider = Literal["gemini", "openai", "fallback", "auto"]

class DocumentMetadata(BaseModel):
    filename: str
    file_type: str
    file_size_bytes: int
    file_size_formatted: str
    page_count: Optional[int] = None
    word_count: int = 0
    character_count: int = 0
    estimated_reading_time_min: float = 0.0

class ImprovementSuggestion(BaseModel):
    category: Literal["missing_info", "clarification", "review_topic", "follow_up_question"]
    title: str
    description: str

class ExtractionResponse(BaseModel):
    success: bool
    text: str
    metadata: DocumentMetadata
    method: Literal["pdf_parser", "ocr", "raw_text"]
    message: Optional[str] = None

class SummaryRequest(BaseModel):
    text: str = Field(..., min_length=10, description="The document text to summarize")
    length: SummaryLength = Field(default="medium", description="Summary length: short, medium, or long")
    metadata: Optional[DocumentMetadata] = None
    custom_api_key: Optional[str] = Field(default=None, description="Optional client-provided API key for Gemini/OpenAI")
    preferred_provider: Optional[AIProvider] = Field(default="auto", description="Preferred AI provider or fallback")

class SummaryResponse(BaseModel):
    success: bool
    summary: str
    key_points: List[str]
    main_ideas: List[str]
    improvement_suggestions: List[ImprovementSuggestion]
    summary_length: SummaryLength
    provider_used: Literal["gemini", "openai", "fallback_extractive"]
    is_fallback: bool
    fallback_reason: Optional[str] = None
    metadata: Optional[DocumentMetadata] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    gemini_configured: bool
    openai_configured: bool
    tesseract_available: bool
