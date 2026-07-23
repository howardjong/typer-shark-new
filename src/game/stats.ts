import { MIN_ACTIVE_SECONDS_FOR_WPM } from "./config";

/**
 * Accuracy = correct gameplay keystrokes / all accepted gameplay keystrokes.
 * Returns null (rendered as "—") when there is no accepted input, never NaN
 * and never a misleading 100%.
 */
export function accuracyPct(correct: number, accepted: number): number | null {
  if (accepted <= 0) return null;
  return Math.round((correct / accepted) * 100);
}

/**
 * WPM = (correct characters / 5) / active minutes. Active time excludes
 * menus, countdowns, pauses, and hidden-tab time (the engine only accumulates
 * activeMs while simulating). Sessions under 10 active seconds return null.
 */
export function wordsPerMinute(correctChars: number, activeMs: number): number | null {
  const seconds = activeMs / 1000;
  if (seconds < MIN_ACTIVE_SECONDS_FOR_WPM) return null;
  return Math.round(correctChars / 5 / (seconds / 60));
}

/** Format a nullable stat for display. */
export function formatStat(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${value}${suffix}`;
}
