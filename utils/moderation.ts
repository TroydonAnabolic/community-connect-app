const BLOCKED_TERMS = ["scam", "hate", "abuse", "harass", "threat"];

export function moderateText(input: string): {
  isFlagged: boolean;
  reason?: string;
} {
  const lower = input.toLowerCase();
  const matchedTerm = BLOCKED_TERMS.find((term) => lower.includes(term));

  if (!matchedTerm) {
    return { isFlagged: false };
  }

  return {
    isFlagged: true,
    reason: `Potentially unsafe language detected (${matchedTerm}).`,
  };
}
