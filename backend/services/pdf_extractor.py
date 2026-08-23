import io
import logging
from typing import Tuple
import pypdf
from backend.utils.text_utils import clean_extracted_text

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, int]:
    try:
        pdf_stream = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_stream)
        
        page_count = len(reader.pages)
        if page_count == 0:
            raise ValueError("The PDF document contains no pages.")
        
        extracted_pages = []
        for index, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
                cleaned = clean_extracted_text(page_text)
                if cleaned:
                    if page_count > 1:
                        extracted_pages.append(f"--- Page {index + 1} ---\n{cleaned}")
                    else:
                        extracted_pages.append(cleaned)
            except Exception as page_err:
                logger.warning(f"Error extracting page {index + 1}: {page_err}")
                extracted_pages.append(f"--- Page {index + 1} ---")
        
        full_text = "\n\n".join(extracted_pages).strip()
        if not full_text:
            raise ValueError("Could not extract readable text from PDF.")
        
        return full_text, page_count
    
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise
