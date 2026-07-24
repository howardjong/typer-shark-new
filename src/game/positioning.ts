/**
 * Convert an engine's normalized right-to-left position into a safe DOM
 * translate value. The target width is measured by the view, so a long label
 * stays inside the playfield at spawn and never disappears beneath Pebble Bay.
 */
export function targetTranslateX(progress: number, fieldWidth: number, targetWidth: number): number {
  const normalized = Math.min(1, Math.max(0, progress));
  const usableWidth = Math.max(0, fieldWidth - Math.max(0, targetWidth));
  return normalized * usableWidth;
}
