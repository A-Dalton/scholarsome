/**
 * Calculates the Sørensen–Dice coefficient between two strings based on
 * bigram overlap. Returns a value between 0 (no similarity) and 1
 * (identical strings).
 *
 * This is the same algorithm used by the removed `string-similarity` package.
 * Whitespace is ignored when building bigrams.
 */
export function compareTwoStrings(first: string, second: string): number {
  const normalizedFirst = first.replace(/\s+/g, "");
  const normalizedSecond = second.replace(/\s+/g, "");

  // Identical strings (including two empty strings) are a perfect match.
  if (normalizedFirst === normalizedSecond) return 1;
  // A single-character (or empty) string has no bigrams to compare.
  if (normalizedFirst.length < 2 || normalizedSecond.length < 2) return 0;

  const firstBigrams = new Map<string, number>();
  for (let i = 0; i < normalizedFirst.length - 1; i++) {
    const bigram = normalizedFirst.substring(i, i + 2);
    firstBigrams.set(bigram, (firstBigrams.get(bigram) ?? 0) + 1);
  }

  let intersectionSize = 0;
  for (let i = 0; i < normalizedSecond.length - 1; i++) {
    const bigram = normalizedSecond.substring(i, i + 2);
    const count = firstBigrams.get(bigram) ?? 0;

    if (count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (normalizedFirst.length + normalizedSecond.length - 2);
}
