import { normalizeArtist, type ArtistRecord } from './csvParser';

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export interface MatchResult {
  record: ArtistRecord;
  score: number; // 0 = perfect, higher = worse
}

/**
 * Find the best matching artist from the lookup map.
 * Returns the closest match if within a reasonable threshold.
 */
export function findBestMatch(
  query: string,
  lookupMap: Map<string, ArtistRecord>
): MatchResult | null {
  const normalizedQuery = normalizeArtist(query);
  if (!normalizedQuery) return null;

  // Exact match first
  const exact = lookupMap.get(normalizedQuery);
  if (exact) return { record: exact, score: 0 };

  // Fuzzy match — find closest by Levenshtein distance
  let bestMatch: ArtistRecord | null = null;
  let bestScore = Infinity;

  for (const [key, record] of lookupMap.entries()) {
    // Quick containment check before expensive distance calc
    if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
      const score = Math.abs(key.length - normalizedQuery.length);
      if (score < bestScore) {
        bestScore = score;
        bestMatch = record;
      }
      continue;
    }

    const dist = levenshtein(normalizedQuery, key);
    // Allow up to 30% of the longer string's length as edit distance
    const threshold = Math.floor(Math.max(key.length, normalizedQuery.length) * 0.35);
    if (dist <= threshold && dist < bestScore) {
      bestScore = dist;
      bestMatch = record;
    }
  }

  if (bestMatch) return { record: bestMatch, score: bestScore };
  return null;
}
