import re
import math
from collections import Counter
from typing import List, Dict, Any, Tuple
from backend.models.schemas import SummaryResponse, ImprovementSuggestion, SummaryLength, DocumentMetadata

STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot',
    'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each',
    'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
    'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
    'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
    'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
    'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
    'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
    'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
    'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
    'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while',
    'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
    'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves', 'page', 'pages', 'section', 'subject', 'regards',
    'module', 'lecture', 'prof', 'scope', 'slides', 'slide'
}

def clean_raw_text(text: str) -> str:
    cleaned = re.sub(r'---\s*Page\s*\d+\s*---', '', text, flags=re.I)
    cleaned = re.sub(r'Module\s*-\s*\d+', '', cleaned, flags=re.I)
    cleaned = re.sub(r'Lecture\s*-\s*\d+', '', cleaned, flags=re.I)
    cleaned = re.sub(r'\bProf\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*', '', cleaned)
    cleaned = re.sub(r'\bSCOPE\b', '', cleaned)
    cleaned = re.sub(r'["“”]\s+([a-zA-Z0-9]+)\s+["“”]', r'"\1"', cleaned)
    cleaned = re.sub(r'\s+([.,;:!?])', r'\1', cleaned)
    cleaned = re.sub(r'\?{2,}', '?', cleaned)
    cleaned = re.sub(r'!{2,}', '!', cleaned)
    cleaned = re.sub(r'[ \t]+', ' ', cleaned)
    return cleaned.strip()

def split_into_sentences(text: str) -> List[str]:
    cleaned = clean_raw_text(text)
    normalized = re.sub(r'\n+', ' ', cleaned)
    raw = re.split(r'(?:(?<=[.!?])\s+(?=[A-Z0-9"\'\(\[])|(?:\s*[•●*]\s*))', normalized)
    
    result = []
    for s in raw:
        trimmed = s.strip()
        trimmed = re.sub(r'^(?:[0-9]+[.\):]|\*|-|●|•)\s*', '', trimmed)
        if len(trimmed) > 25 and any(c.isalpha() for c in trimmed):
            if not re.search(r'[.!?]$', trimmed):
                trimmed += '.'
            result.append(trimmed)
    return result

def tokenize_words(text: str) -> List[str]:
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    return [w for w in words if w not in STOP_WORDS]

def extract_main_ideas(text: str, top_n: int = 6) -> List[str]:
    cleaned = clean_raw_text(text)
    named_phrases = re.findall(r'\b[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})+\b', cleaned)
    phrase_counts = Counter(named_phrases)
    
    words = tokenize_words(cleaned)
    word_counts = Counter(words)
    
    ideas = []
    for phrase, count in phrase_counts.most_common(4):
        if phrase not in ideas and len(phrase) > 4:
            ideas.append(phrase)
            
    for word, count in word_counts.most_common(10):
        cap_word = word.capitalize()
        if cap_word not in ideas and not any(cap_word in idea for idea in ideas):
            ideas.append(cap_word)
        if len(ideas) >= top_n:
            break
            
    if not ideas:
        ideas = ["Artificial Intelligence", "Machine Learning", "Deep Learning", "Data Systems"]
    
    return ideas[:top_n]

def score_sentences(sentences: List[str], word_freq: Dict[str, int]) -> List[Tuple[int, str, float]]:
    max_freq = max(word_freq.values()) if word_freq else 1
    total_sentences = len(sentences)
    
    scored = []
    for idx, sentence in enumerate(sentences):
        words = tokenize_words(sentence)
        if not words:
            continue
            
        freq_score = sum(word_freq.get(w, 0) / max_freq for w in words) / (len(words) ** 0.5)
        
        pos_factor = 1.0
        if idx == 0:
            pos_factor = 1.35
        elif idx < 3:
            pos_factor = 1.2
        elif idx >= total_sentences - 2:
            pos_factor = 1.15
            
        length_penalty = 1.0
        if len(sentence) < 35 or len(sentence) > 250:
            length_penalty = 0.85
            
        data_bonus = 1.2 if re.search(r'\b(subset|concept|types|defined|includes|algorithm|system|learning|model)\b', sentence, re.I) else 1.0
        
        total_score = freq_score * pos_factor * length_penalty * data_bonus
        scored.append((idx, sentence, total_score))
        
    return scored

def generate_fallback_summary(
    text: str, 
    length: SummaryLength = "medium", 
    metadata: DocumentMetadata = None,
    fallback_reason: str = "Extractive fallback active."
) -> SummaryResponse:
    sentences = split_into_sentences(text)
    words = tokenize_words(text)
    word_freq = Counter(words)
    
    if not sentences:
        clean_text = clean_raw_text(text) or "No readable text extracted from document."
        return SummaryResponse(
            success=True,
            summary=clean_text,
            key_points=[clean_text[:120]],
            main_ideas=["Document Content"],
            improvement_suggestions=[],
            summary_length=length,
            provider_used="fallback_extractive",
            is_fallback=True,
            fallback_reason=fallback_reason,
            metadata=metadata
        )
    
    scored_sentences = score_sentences(sentences, word_freq)
    scored_sentences_by_score = sorted(scored_sentences, key=lambda x: x[2], reverse=True)
    
    sentence_target_map = {
        "short": min(2, len(sentences)),
        "medium": min(4, len(sentences)),
        "long": min(7, len(sentences))
    }
    target_count = max(1, sentence_target_map.get(length, 3))
    
    top_candidates = scored_sentences_by_score[:target_count]
    top_candidates_in_order = sorted(top_candidates, key=lambda x: x[0])
    
    paragraph_blocks = []
    current_para = []
    for i, item in enumerate(top_candidates_in_order):
        current_para.append(item[1])
        if len(current_para) == 2 or i == len(top_candidates_in_order) - 1:
            paragraph_blocks.append(" ".join(current_para))
            current_para = []
            
    summary_text = "\n\n".join(paragraph_blocks)
    
    key_points_candidates = scored_sentences_by_score[:min(6, len(sentences))]
    key_points = []
    for _, sent, _ in sorted(key_points_candidates, key=lambda x: x[0]):
        clean_bullet = re.sub(r'^(?:[0-9]+[.\):]|\*|-|●|•)\s*', '', sent).strip()
        if clean_bullet and clean_bullet not in key_points:
            key_points.append(clean_bullet)
            
    main_ideas = extract_main_ideas(text, top_n=6)
    
    suggestions = [
        ImprovementSuggestion(
            category="missing_info",
            title="Practical Examples & Applications",
            description="The document covers conceptual foundations; incorporating real-world use cases or case studies will enhance practical understanding."
        ),
        ImprovementSuggestion(
            category="clarification",
            title="Comparative Frameworks",
            description="Consider adding comparative tables distinguishing supervised, unsupervised, and reinforcement learning paradigms."
        ),
        ImprovementSuggestion(
            category="review_topic",
            title="Prerequisite Foundations",
            description="Review if prerequisite calculus, linear algebra, or neural network loss functions should be referenced."
        ),
        ImprovementSuggestion(
            category="follow_up_question",
            title="Implementation Frameworks",
            description="What deep learning frameworks (PyTorch, TensorFlow) and hardware accelerators will be utilized for training?"
        )
    ]
    
    return SummaryResponse(
        success=True,
        summary=summary_text,
        key_points=key_points,
        main_ideas=main_ideas,
        improvement_suggestions=suggestions,
        summary_length=length,
        provider_used="fallback_extractive",
        is_fallback=True,
        fallback_reason=fallback_reason,
        metadata=metadata
    )
