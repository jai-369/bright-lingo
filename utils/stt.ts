// Simple Levenshtein distance implementation
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

export interface STTVerificationResult {
  isCorrect: boolean;
  fallbackToBubbles: boolean;
}

export function handleSpeechResult(result: string, expected: string, isOnline: boolean): STTVerificationResult {
  const distance = levenshtein(result.trim(), expected.trim());
  
  if (distance <= 2) {
    return { isCorrect: true, fallbackToBubbles: false };
  }

  // Inaccurate
  if (!isOnline) {
    console.log('[STT] Inaccurate result while offline. Swapping to word bubbles.');
    return { isCorrect: false, fallbackToBubbles: true };
  } else {
    console.log('[STT] Inaccurate result while online. Marking as wrong.');
    return { isCorrect: false, fallbackToBubbles: false };
  }
}
