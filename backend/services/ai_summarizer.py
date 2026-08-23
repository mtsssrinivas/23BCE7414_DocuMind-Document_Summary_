import os
import re
import json
import logging
import requests
from typing import Optional, List, Dict, Any
from backend.models.schemas import SummaryResponse, SummaryLength, DocumentMetadata, ImprovementSuggestion, AIProvider
from backend.services.fallback_summarizer import generate_fallback_summary

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Analyze the provided document text and produce a structured analysis in JSON format.

JSON Schema:
{
  "summary": "A clear, natural summary tailored to the requested length.",
  "key_points": [
    "Key point 1",
    "Key point 2",
    "Key point 3",
    "Key point 4"
  ],
  "main_ideas": [
    "Core Idea 1",
    "Core Idea 2",
    "Core Idea 3"
  ],
  "improvement_suggestions": [
    {
      "category": "missing_info",
      "title": "Title",
      "description": "Details about missing dates, scope, or background."
    },
    {
      "category": "clarification",
      "title": "Title",
      "description": "Details on dense phrasing or unclear parameters."
    },
    {
      "category": "review_topic",
      "title": "Title",
      "description": "Critical areas to review."
    },
    {
      "category": "follow_up_question",
      "title": "Title",
      "description": "Important follow-up question."
    }
  ]
}

Length guidelines:
- 'short': 1-2 concise paragraphs (~60-120 words).
- 'medium': 2-3 paragraphs (~150-250 words).
- 'long': 4-5 paragraphs (~300-500 words).

Return valid JSON only.
"""

def summarize_with_gemini(
    text: str, 
    api_key: str, 
    length: SummaryLength, 
    metadata: Optional[DocumentMetadata] = None
) -> SummaryResponse:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    prompt = f"Target Length: {length.upper()}\n\nDocument Text:\n{text[:40000]}"
    
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\n{prompt}"}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    if response.status_code != 200:
        url_fallback = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        response = requests.post(url_fallback, headers=headers, json=payload, timeout=30)
        
    if response.status_code != 200:
        raise RuntimeError(f"Gemini request failed: {response.text}")
        
    data = response.json()
    candidate = data.get("candidates", [{}])[0]
    content_part = candidate.get("content", {}).get("parts", [{}])[0]
    raw_text = content_part.get("text", "").strip()
    
    if raw_text.startswith("```"):
        raw_text = re.sub(r'^```(?:json)?\s*', '', raw_text)
        raw_text = re.sub(r'\s*```$', '', raw_text)
        
    parsed = json.loads(raw_text)
    
    suggestions = [
        ImprovementSuggestion(
            category=item.get("category", "review_topic"),
            title=item.get("title", "Review Point"),
            description=item.get("description", "")
        )
        for item in parsed.get("improvement_suggestions", [])
    ]
    
    return SummaryResponse(
        success=True,
        summary=parsed.get("summary", ""),
        key_points=parsed.get("key_points", []),
        main_ideas=parsed.get("main_ideas", []),
        improvement_suggestions=suggestions,
        summary_length=length,
        provider_used="gemini",
        is_fallback=False,
        fallback_reason=None,
        metadata=metadata
    )

def summarize_with_openai(
    text: str, 
    api_key: str, 
    length: SummaryLength, 
    metadata: Optional[DocumentMetadata] = None
) -> SummaryResponse:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Target Length: {length.upper()}\n\nDocument Text:\n{text[:35000]}"}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    if response.status_code != 200:
        raise RuntimeError(f"OpenAI request failed: {response.text}")
        
    data = response.json()
    raw_text = data["choices"][0]["message"]["content"].strip()
    parsed = json.loads(raw_text)
    
    suggestions = [
        ImprovementSuggestion(
            category=item.get("category", "review_topic"),
            title=item.get("title", "Review Point"),
            description=item.get("description", "")
        )
        for item in parsed.get("improvement_suggestions", [])
    ]
    
    return SummaryResponse(
        success=True,
        summary=parsed.get("summary", ""),
        key_points=parsed.get("key_points", []),
        main_ideas=parsed.get("main_ideas", []),
        improvement_suggestions=suggestions,
        summary_length=length,
        provider_used="openai",
        is_fallback=False,
        fallback_reason=None,
        metadata=metadata
    )

def generate_summary(
    text: str,
    length: SummaryLength = "medium",
    metadata: Optional[DocumentMetadata] = None,
    custom_api_key: Optional[str] = None,
    preferred_provider: Optional[AIProvider] = "auto"
) -> SummaryResponse:
    gemini_key = custom_api_key or os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    
    if preferred_provider == "fallback":
        return generate_fallback_summary(text, length, metadata, fallback_reason="Extractive fallback selected.")
        
    if (preferred_provider in ("auto", "gemini")) and gemini_key:
        try:
            return summarize_with_gemini(text, gemini_key, length, metadata)
        except Exception as e:
            logger.warning(f"Gemini failed, falling back: {e}")
            return generate_fallback_summary(text, length, metadata, fallback_reason=str(e)[:100])
            
    if (preferred_provider in ("auto", "openai")) and openai_key:
        try:
            return summarize_with_openai(text, openai_key, length, metadata)
        except Exception as e:
            logger.warning(f"OpenAI failed, falling back: {e}")
            return generate_fallback_summary(text, length, metadata, fallback_reason=str(e)[:100])
            
    return generate_fallback_summary(text, length, metadata, fallback_reason="Offline extractive mode active.")
