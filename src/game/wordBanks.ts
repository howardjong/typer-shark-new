/**
 * Reviewed word/letter content, grouped by lesson. Original content only —
 * no word list is copied from any commercial game. Validated by tests.
 */

/** First mission: home row plus g/h, gentlest possible start. */
export const STARTER_WARMUP_LETTERS: readonly string[] = [
  "a", "s", "d", "f", "j", "k", "l", "g", "h",
];

/** Full single-letter drill pool for later Starter lessons. */
export const ALL_LETTERS: readonly string[] = "abcdefghijklmnopqrstuvwxyz".split("");

export interface LessonDefinition {
  id: string;
  title: string;
  /** Shown on the briefing screen, e.g. "Today: letters A, S, D, F". */
  lessonLabel: string;
  letters: readonly string[];
}

export const WARMUP_LESSON: LessonDefinition = {
  id: "warmup-first-letter",
  title: "Warm-Up: Find the First Letter",
  lessonLabel: "Today: letters A S D F · J K L · G H",
  letters: STARTER_WARMUP_LETTERS,
};

/**
 * Validate a single-letter bank. Returns a list of human-readable issues;
 * an empty list means the bank is valid. Run at test time.
 */
export function validateLetterBank(letters: readonly string[]): string[] {
  const issues: string[] = [];
  if (letters.length === 0) issues.push("bank is empty");
  const seen = new Set<string>();
  for (const l of letters) {
    if (l.length !== 1) issues.push(`entry "${l}" is not a single character`);
    if (!/^[a-z]$/.test(l)) issues.push(`entry "${l}" is not a lowercase ASCII letter`);
    if (seen.has(l)) issues.push(`duplicate entry "${l}"`);
    seen.add(l);
  }
  return issues;
}
