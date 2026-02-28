/**
 * Text cleanup utilities for voice dictation transcriptions.
 */

const FILLER_WORDS = /\b(um+|uh+|like|you know|i mean|basically|actually|so yeah|yeah so)\b/gi;
const REPEATED_SPACES = /\s{2,}/g;
const REPEATED_PUNCTUATION = /([.!?])\1+/g;

/**
 * Clean up raw transcription text: strip filler words,
 * fix punctuation, collapse whitespace.
 */
export function cleanTranscription(raw: string): string {
  let text = raw.trim();
  text = text.replace(FILLER_WORDS, '');
  text = text.replace(REPEATED_SPACES, ' ');
  text = text.replace(REPEATED_PUNCTUATION, '$1');
  text = text.replace(/\s+([.,!?;:])/g, '$1');
  text = text.trim();
  // Capitalize first letter
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }
  return text;
}

/**
 * Split text into paragraphs based on sentence boundaries or double newlines.
 */
export function splitIntoParagraphs(text: string): string[] {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;
  // Fallback: split on sentence endings followed by space
  return text
    .split(/(?<=[.!?])\s+/)
    .reduce<string[]>((acc, sentence, i) => {
      if (i % 3 === 0) acc.push(sentence);
      else acc[acc.length - 1] += ' ' + sentence;
      return acc;
    }, [])
    .filter(Boolean);
}

/**
 * Extract $TICKER patterns from text.
 * Returns uppercase deduplicated list.
 */
export function extractTickers(text: string): string[] {
  const matches = text.match(/\$([A-Za-z]{1,5})\b/g);
  if (!matches) return [];
  const unique = new Set(matches.map((m) => m.slice(1).toUpperCase()));
  return Array.from(unique);
}
