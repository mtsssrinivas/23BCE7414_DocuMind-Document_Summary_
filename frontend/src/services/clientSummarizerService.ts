import { SummaryResponse, SummaryLength, DocumentMetadata, ImprovementSuggestion } from '../types';

const STOP_WORDS = new Set([
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
]);

function cleanRawText(text: string): string {
  let cleaned = text
    .replace(/---\s*Page\s*\d+\s*---/gi, '')
    .replace(/Module\s*-\s*\d+/gi, '')
    .replace(/Lecture\s*-\s*\d+/gi, '')
    .replace(/\bProf\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g, '')
    .replace(/SCOPE\b/g, '')
    .replace(/["“”]\s+([a-zA-Z0-9]+)\s+["“”]/g, '"$1"')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([(\[{])\s+/g, '$1')
    .replace(/\s+([)\]}])/g, '$1')
    .replace(/\?{2,}/g, '?')
    .replace(/!{2,}/g, '!')
    .replace(/\.{3,}/g, '...')
    .replace(/[ \t]+/g, ' ');

  return cleaned.trim();
}

function splitSentences(text: string): string[] {
  const cleaned = cleanRawText(text);
  const normalized = cleaned.replace(/\n+/g, ' ');
  
  // Split on bullet points or sentence ends
  const raw = normalized.split(/(?:(?<=[.!?])\s+(?=[A-Z0-9"'\(\[])|(?:\s*[•●*]\s*))/);
  
  const result: string[] = [];
  for (const s of raw) {
    let trimmed = s.trim();
    trimmed = trimmed.replace(/^(?:[0-9]+[.\):]|\*|-|●|•)\s*/, '');
    if (trimmed.length > 25 && /[a-zA-Z]/.test(trimmed)) {
      if (!/[.!?]$/.test(trimmed)) {
        trimmed += '.';
      }
      result.push(trimmed);
    }
  }
  return result;
}

function tokenizeWords(text: string): string[] {
  const words = text.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
  return words.filter(w => !STOP_WORDS.has(w));
}

function extractIdeas(text: string, topN = 6): string[] {
  const cleaned = cleanRawText(text);
  const namedPhrases = cleaned.match(/\b[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})+\b/g) || [];
  const phraseCounts = new Map<string, number>();
  for (const p of namedPhrases) {
    if (!p.toLowerCase().includes('page') && !p.toLowerCase().includes('module') && !p.toLowerCase().includes('lecture')) {
      phraseCounts.set(p, (phraseCounts.get(p) || 0) + 1);
    }
  }

  const words = tokenizeWords(cleaned);
  const wordCounts = new Map<string, number>();
  for (const w of words) {
    wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
  }

  const ideas: string[] = [];
  const sortedPhrases = [...phraseCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [p] of sortedPhrases.slice(0, 4)) {
    if (!ideas.includes(p) && p.length > 4) {
      ideas.push(p);
    }
  }

  const sortedWords = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [w] of sortedWords.slice(0, 10)) {
    const cap = w.charAt(0).toUpperCase() + w.slice(1);
    if (!ideas.includes(cap) && !ideas.some(id => id.toLowerCase().includes(w.toLowerCase()))) {
      ideas.push(cap);
    }
    if (ideas.length >= topN) break;
  }

  return ideas.length > 0 ? ideas.slice(0, topN) : ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Data Processing'];
}

export function generateClientSummary(
  rawText: string,
  length: SummaryLength = 'medium',
  metadata?: DocumentMetadata
): SummaryResponse {
  const sentences = splitSentences(rawText);
  const words = tokenizeWords(rawText);

  if (sentences.length === 0) {
    const clean = cleanRawText(rawText) || 'No readable text extracted.';
    return {
      success: true,
      summary: clean,
      key_points: [clean.slice(0, 120)],
      main_ideas: ['Overview', 'Summary'],
      improvement_suggestions: [],
      summary_length: length,
      provider_used: 'fallback_extractive',
      is_fallback: true,
      fallback_reason: 'Extractive summary.',
      metadata,
    };
  }

  const wordFreq = new Map<string, number>();
  for (const w of words) {
    wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  }
  const maxFreq = Math.max(...wordFreq.values(), 1);

  const scored = sentences.map((sent, idx) => {
    const sentWords = tokenizeWords(sent);
    const freqScore = sentWords.length > 0
      ? sentWords.reduce((acc, w) => acc + (wordFreq.get(w) || 0) / maxFreq, 0) / Math.sqrt(sentWords.length)
      : 0;

    let posFactor = 1.0;
    if (idx === 0) posFactor = 1.35;
    else if (idx < 3) posFactor = 1.2;
    else if (idx >= sentences.length - 2) posFactor = 1.15;

    let lengthPenalty = 1.0;
    if (sent.length < 35 || sent.length > 250) lengthPenalty = 0.85;

    const dataBonus = /\b(subset|concept|types|defined|includes|algorithm|system|learning|model)\b/i.test(sent) ? 1.25 : 1.0;
    return { idx, sent, score: freqScore * posFactor * lengthPenalty * dataBonus };
  });

  const byScore = [...scored].sort((a, b) => b.score - a.score);

  const targetMap: Record<SummaryLength, number> = {
    short: Math.min(2, sentences.length),
    medium: Math.min(4, sentences.length),
    long: Math.min(7, sentences.length),
  };
  const targetCount = Math.max(1, targetMap[length]);

  const topCandidates = byScore.slice(0, targetCount).sort((a, b) => a.idx - b.idx);
  
  // Format into clean paragraphs (2 sentences per paragraph for readability)
  const paragraphBlocks: string[] = [];
  let currentPara: string[] = [];

  for (let i = 0; i < topCandidates.length; i++) {
    currentPara.push(topCandidates[i].sent);
    if (currentPara.length === 2 || i === topCandidates.length - 1) {
      paragraphBlocks.push(currentPara.join(' '));
      currentPara = [];
    }
  }

  const summaryText = paragraphBlocks.join('\n\n');

  // Key Points: distinct bullet points
  const keyPointsCandidates = byScore.slice(0, Math.min(6, sentences.length)).sort((a, b) => a.idx - b.idx);
  const keyPoints: string[] = [];
  for (const c of keyPointsCandidates) {
    const clean = c.sent.replace(/^(?:[0-9]+[.\):]|\*|-|●|•)\s*/, '').trim();
    if (clean && !keyPoints.includes(clean)) {
      keyPoints.push(clean);
    }
  }

  const mainIdeas = extractIdeas(rawText, 6);

  const suggestions: ImprovementSuggestion[] = [
    {
      category: 'missing_info',
      title: 'Practical Examples & Applications',
      description: 'The document covers conceptual foundations; incorporating real-world use cases or case studies would enhance practical understanding.'
    },
    {
      category: 'clarification',
      title: 'Detailed Comparisons',
      description: 'Consider adding comparative tables distinguishing supervised, unsupervised, and reinforcement learning paradigms.'
    },
    {
      category: 'review_topic',
      title: 'Mathematical Foundations',
      description: 'Review if prerequisite calculus, linear algebra, or neural network loss functions should be referenced.'
    },
    {
      category: 'follow_up_question',
      title: 'Implementation Scope',
      description: 'What deep learning frameworks (PyTorch, TensorFlow) and hardware accelerators will be utilized for model training?'
    }
  ];

  return {
    success: true,
    summary: summaryText,
    key_points: keyPoints,
    main_ideas: mainIdeas,
    improvement_suggestions: suggestions,
    summary_length: length,
    provider_used: 'fallback_extractive',
    is_fallback: true,
    fallback_reason: 'In-browser Extractive Intelligence (Clean Multi-Depth Mode).',
    metadata,
  };
}
