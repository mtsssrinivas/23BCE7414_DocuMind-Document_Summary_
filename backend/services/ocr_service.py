import io
import logging
from typing import Tuple
from PIL import Image, ImageEnhance, ImageFilter
from backend.utils.text_utils import clean_extracted_text

logger = logging.getLogger(__name__)

_has_tesseract = False
try:
    import pytesseract
    try:
        pytesseract.get_tesseract_version()
        _has_tesseract = True
    except Exception:
        _has_tesseract = False
except ImportError:
    _has_tesseract = False

def is_tesseract_available() -> bool:
    return _has_tesseract

def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    if image.mode != 'RGB':
        image = image.convert('RGB')
    gray = image.convert('L')
    enhancer = ImageEnhance.Contrast(gray)
    enhanced = enhancer.enhance(1.8)
    return enhanced.filter(ImageFilter.SHARPEN)

def extract_text_from_image(file_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(file_bytes))
        if _has_tesseract:
            processed = preprocess_image_for_ocr(image)
            text = pytesseract.image_to_string(processed)
            cleaned = clean_extracted_text(text)
            if cleaned:
                return cleaned
        raise RuntimeError("Tesseract OCR is unavailable on server. Client-side OCR will process this image.")
    except Exception as e:
        logger.warning(f"Image OCR error: {e}")
        raise
