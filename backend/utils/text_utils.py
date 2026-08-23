import re
import math
from typing import Tuple
from backend.models.schemas import DocumentMetadata

def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def clean_extracted_text(text: str) -> str:
    if not text:
        return ""
    
    text = text.replace('\xa0', ' ').replace('\u200b', '')
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
    
    raw_lines = [l.strip() for l in text.split('\n')]
    non_empty = [l for l in raw_lines if l]
    
    if not non_empty:
        return ""
        
    total_words = sum(len(l.split()) for l in non_empty)
    is_fragmented = len(non_empty) > 6 and (total_words / max(len(non_empty), 1)) < 2.8
    
    if is_fragmented:
        merged_blocks = []
        current_block = []
        
        for line in raw_lines:
            if not line:
                continue
                
            is_new_block_starter = (
                line.startswith(('--- Page', 'Subject:', 'Project:', 'Dear', 'Best regards', 
                                 'Required Features:', 'Technical Requirements:', 'Technical Freedom:', 
                                 'Deliverables:', 'Timeline:', 'Next Steps:', 'Questions?'))
                or bool(re.match(r'^(?:[0-9]+[\.\)]|\u25cf|\u2022|\*|-)\s+', line))
            )
            
            if is_new_block_starter:
                if current_block:
                    merged_blocks.append(' '.join(current_block))
                    current_block = []
                current_block.append(line)
            else:
                current_block.append(line)
                
        if current_block:
            merged_blocks.append(' '.join(current_block))
            
        cleaned_text = '\n\n'.join(b for b in merged_blocks if b)
    else:
        lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in raw_lines]
        cleaned_text = '\n'.join(lines)
        cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
        
    return cleaned_text.strip()

def calculate_metadata(filename: str, file_type: str, file_size_bytes: int, text: str, page_count: int = None) -> DocumentMetadata:
    words = [w for w in re.split(r'\s+', text) if w]
    word_count = len(words)
    character_count = len(text)
    reading_time = round(word_count / 225.0, 1) if word_count > 0 else 0.0
    
    return DocumentMetadata(
        filename=filename,
        file_type=file_type,
        file_size_bytes=file_size_bytes,
        file_size_formatted=format_file_size(file_size_bytes),
        page_count=page_count,
        word_count=word_count,
        character_count=character_count,
        estimated_reading_time_min=reading_time
    )
