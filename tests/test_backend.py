import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app
from backend.services.pdf_extractor import extract_text_from_pdf
from backend.services.fallback_summarizer import generate_fallback_summary, extract_main_ideas
from backend.utils.text_utils import calculate_metadata, clean_extracted_text

client = TestClient(app)

SAMPLE_PDF_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "Copy of Document Summary Assistant- Assignment 3 (5) (1) (1).pdf")
)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "gemini_configured" in data

def test_sample_documents_endpoint():
    response = client.get("/api/samples")
    assert response.status_code == 200
    data = response.json()
    assert "samples" in data
    assert len(data["samples"]) >= 3

def test_pdf_extraction_real_file():
    assert os.path.exists(SAMPLE_PDF_PATH), f"Assignment PDF file should exist at {SAMPLE_PDF_PATH}"
    with open(SAMPLE_PDF_PATH, "rb") as f:
        file_bytes = f.read()
    
    text, page_count = extract_text_from_pdf(file_bytes)
    assert page_count == 2
    assert "Technical Assessment Project" in text or "Document Summary Assistant" in text
    assert len(text) > 100

def test_text_cleaning_and_metadata():
    raw_sample = "This is a test document.\xa0 With some  extra    spaces.\n\n\nAnd newlines."
    cleaned = clean_extracted_text(raw_sample)
    assert "\xa0" not in cleaned
    assert "    " not in cleaned
    
    meta = calculate_metadata("test.pdf", "PDF Document", 1024, cleaned, 2)
    assert meta.filename == "test.pdf"
    assert meta.word_count > 5
    assert meta.file_size_formatted == "1.0 KB"

def test_extractive_summarizer_lengths():
    sample_text = """Artificial Intelligence and Document Intelligence have evolved rapidly. 
Modern natural language processing allows systems to extract actionable takeaways from complex unstructured reports. 
Deep learning architectures like Transformers process multi-page documents in parallel with self-attention mechanisms. 
Optical Character Recognition bridges the gap between physical paper scans and digital search indexes. 
Automated summarization enables executives and researchers to quickly grasp critical concepts without reading hundreds of pages. 
Quality assurance and deterministic fallback methods ensure reliability even when external cloud AI services experience downtime. 
Continuous monitoring and feedback loops help refine precision and recall over time."""

    short_res = generate_fallback_summary(sample_text, length="short")
    assert short_res.success is True
    assert short_res.summary_length == "short"
    assert len(short_res.key_points) >= 1
    assert len(short_res.main_ideas) >= 1
    assert len(short_res.improvement_suggestions) >= 1
    assert short_res.is_fallback is True

    med_res = generate_fallback_summary(sample_text, length="medium")
    assert med_res.success is True
    assert med_res.summary_length == "medium"
    assert len(med_res.summary) >= len(short_res.summary)

    long_res = generate_fallback_summary(sample_text, length="long")
    assert long_res.success is True
    assert long_res.summary_length == "long"
    assert len(long_res.summary) >= len(med_res.summary)

def test_summarize_api_endpoint():
    payload = {
        "text": "The DocuMind system provides advanced document summarization. It extracts text from PDFs and scanned images, providing short, medium, and long summaries alongside key takeaways and improvement recommendations for end users.",
        "length": "short",
        "preferred_provider": "fallback"
    }
    response = client.post("/api/summarize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "summary" in data
    assert len(data["key_points"]) > 0

def test_extract_api_endpoint_with_real_pdf():
    with open(SAMPLE_PDF_PATH, "rb") as f:
        response = client.post(
            "/api/extract",
            files={"file": ("assignment.pdf", f, "application/pdf")}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["metadata"]["page_count"] == 2
    assert "Document Summary Assistant" in data["text"]

def test_invalid_file_extension_rejection():
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00"
    response = client.post(
        "/api/extract",
        files={"file": ("malicious.exe", fake_exe, "application/x-msdownload")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_empty_file_rejection():
    response = client.post(
        "/api/extract",
        files={"file": ("empty.pdf", b"", "application/pdf")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

if __name__ == "__main__":
    pytest.main(["-v", __file__])
