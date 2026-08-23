import os
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from backend.models.schemas import (
    ExtractionResponse, 
    SummaryRequest, 
    SummaryResponse, 
    HealthResponse,
    DocumentMetadata,
    SummaryLength,
    AIProvider
)
from backend.services.pdf_extractor import extract_text_from_pdf
from backend.services.ocr_service import extract_text_from_image, is_tesseract_available
from backend.services.ai_summarizer import generate_summary
from backend.utils.text_utils import calculate_metadata, clean_extracted_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tiff"}

SAMPLE_DOCUMENTS = [
    {
        "id": "technical-assessment",
        "title": "Technical Assessment Specification",
        "category": "Engineering / Specification",
        "filename": "Technical_Assessment_Project_SE.pdf",
        "text": """Subject: Technical Assessment Project - Software Engineering Position

Dear Candidate,

Thank you for your interest in the Software Engineer position at our company. We've reviewed your application and would like to proceed with our technical assessment phase. We believe in evaluating candidates through practical, real-world scenarios.

Here is your project challenge:
Project: Document Summary Assistant is an application that takes any document (PDF/Image) and generates smart summaries.

Required Features:
1. Document Upload:
- Allow users to upload PDF files and image files (e.g., scanned documents).
- Support drag-and-drop or file picker interface for easy uploads.
- Validate maximum file sizes (up to 10MB) and supported document formats.

2. Text Extraction:
- PDF Parsing: Extract text from PDFs while maintaining formatting and structural integrity.
- OCR (Optical Character Recognition): For image files (scanned documents), extract text using OCR technology such as Tesseract.

3. Summary Generation:
- Automatically generate smart summaries of the document content.
- Provide options for summary length (short, medium, long).
- Highlight key points and main ideas, ensuring the summary captures essential information.

4. Improvement Suggestions:
- Present AI-driven recommendations including missing information, topics to review, and strategic follow-up questions.

5. UI/UX:
- Simple, intuitive interface for uploading documents and viewing summaries.
- Mobile-responsive design for seamless use on desktop, tablet, and mobile devices.

6. Hosting:
- Deploy on a reliable hosting service (e.g., Netlify, Vercel, or Render) for easy access and scalability.

Evaluation Criteria:
- Problem-solving approach, Code quality, Working functionality, and Comprehensive documentation."""
    },
    {
        "id": "ai-research",
        "title": "Transformer Architecture & Large Language Models",
        "category": "Research / AI",
        "filename": "Attention_Is_All_You_Need_Overview.pdf",
        "text": """Title: Attention Mechanisms and Modern Transformer Architectures in AI

Abstract:
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The Transformer model architecture eschews recurrence and instead relies entirely on self-attention mechanisms to draw global dependencies between input and output representations.

1. Introduction
Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time generates a sequence of hidden states. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths.

2. Architecture and Attention
An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.

Multi-Head Attention allows the model to jointly attend to information from different representation subspaces at different positions. With single attention heads, averaging inhibits this capacity.

3. Impact and Future Directions
Transformers have become the foundational architecture powering modern Large Language Models (LLMs), vision transformers, and multimodal foundational models. Their superior parallelizability and scaling laws have enabled breakthroughs across natural language understanding, automated reasoning, document summarization, and software engineering."""
    },
    {
        "id": "business-contract",
        "title": "Software License & Master Services Agreement",
        "category": "Legal / Business",
        "filename": "Master_Services_Agreement_2026.pdf",
        "text": """MASTER SERVICES AND SOFTWARE LICENSE AGREEMENT

This Master Services Agreement ("Agreement") is entered into as of January 15, 2026 ("Effective Date"), by and between DocuMind Technologies Inc. ("Provider"), and the Client ("Customer").

1. Scope of Services & Deliverables
Provider agrees to deliver cloud-based Document Intelligence, OCR text extraction, and automated summarization APIs in accordance with the specifications described in Exhibit A. All services shall be performed in a professional, workmanlike manner conforming to industry best practices.

2. Service Level Agreement (SLA)
Provider warrants 99.95% monthly uptime for production API endpoints. In the event uptime falls below this threshold during any calendar month, Customer shall receive a 10% credit towards the subsequent billing cycle upon written request submitted within thirty (30) days.

3. Data Privacy and Security Compliance
Provider shall maintain robust administrative, physical, and technical safeguards designed to protect the security, confidentiality, and integrity of Customer Data. Provider will never train shared machine learning models on Customer confidential documents without express written consent.

4. Term and Termination
This Agreement shall remain in effect for an initial term of twelve (12) months and shall automatically renew for successive one-year terms unless either party provides written notice of non-renewal at least sixty (60) days prior to the expiration of the current term."""
    }
]

@router.get("/health", response_model=HealthResponse)
def health_check():
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    tesseract_ok = is_tesseract_available()
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        gemini_configured=bool(gemini_key and len(gemini_key) > 5),
        openai_configured=bool(openai_key and len(openai_key) > 5),
        tesseract_available=tesseract_ok
    )

@router.get("/samples")
def get_sample_documents():
    return {"samples": SAMPLE_DOCUMENTS}

@router.post("/extract", response_model=ExtractionResponse)
async def extract_document(file: UploadFile = File(...)):
    filename = file.filename or "unknown_document"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, PNG, JPG, JPEG, WEBP."
        )
        
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes)."
        )
        
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds the 10MB size limit (Received {file_size / (1024*1024):.2f} MB)."
        )
        
    is_pdf = ext == ".pdf" or file.content_type == "application/pdf"
    
    try:
        if is_pdf:
            extracted_text, page_count = extract_text_from_pdf(file_bytes)
            method = "pdf_parser"
        else:
            extracted_text = extract_text_from_image(file_bytes)
            page_count = 1
            method = "ocr"
            
        metadata = calculate_metadata(
            filename=filename,
            file_type="PDF Document" if is_pdf else "Scanned Image",
            file_size_bytes=file_size,
            text=extracted_text,
            page_count=page_count
        )
        
        return ExtractionResponse(
            success=True,
            text=extracted_text,
            metadata=metadata,
            method=method,
            message="Document text extracted successfully."
        )
        
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(val_err))
    except Exception as err:
        logger.error(f"Error processing file {filename}: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract text from document: {str(err)}"
        )

@router.post("/summarize", response_model=SummaryResponse)
def summarize_text(req: SummaryRequest):
    cleaned = clean_extracted_text(req.text)
    if len(cleaned.strip()) < 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document text contains insufficient content to generate a summary."
        )
        
    metadata = req.metadata
    if not metadata:
        metadata = calculate_metadata(
            filename="Document",
            file_type="Text Document",
            file_size_bytes=len(req.text.encode('utf-8')),
            text=cleaned,
            page_count=None
        )
        
    return generate_summary(
        text=cleaned,
        length=req.length,
        metadata=metadata,
        custom_api_key=req.custom_api_key,
        preferred_provider=req.preferred_provider
    )

@router.post("/process", response_model=SummaryResponse)
async def process_document_full(
    file: UploadFile = File(...),
    length: SummaryLength = Form("medium"),
    custom_api_key: Optional[str] = Form(None),
    preferred_provider: Optional[AIProvider] = Form("auto")
):
    filename = file.filename or "unknown_document"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'."
        )
        
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    if file_size == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds 10MB limit.")
        
    is_pdf = ext == ".pdf"
    if is_pdf:
        extracted_text, page_count = extract_text_from_pdf(file_bytes)
    else:
        extracted_text = extract_text_from_image(file_bytes)
        page_count = 1
        
    metadata = calculate_metadata(
        filename=filename,
        file_type="PDF Document" if is_pdf else "Scanned Image",
        file_size_bytes=file_size,
        text=extracted_text,
        page_count=page_count
    )
    
    return generate_summary(
        text=extracted_text,
        length=length,
        metadata=metadata,
        custom_api_key=custom_api_key,
        preferred_provider=preferred_provider
    )
