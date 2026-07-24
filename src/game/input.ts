/**
 * Pure keyboard-event classification. Applied before any key reaches the
 * engine so repeats, modifiers, IME composition, and browser shortcuts are
 * never counted as typing attempts.
 */

export type KeyAction =
  | { kind: "char"; char: string }
  | { kind: "escape" }
  | { kind: "enter" }
  | { kind: "space" }
  | { kind: "ignore" };

export interface KeyEventLike {
  key: string;
  repeat?: boolean;
  isComposing?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export interface InputPolicy {
  /** Key Camp alone teaches the home-row semicolon key. */
  allowSemicolon?: boolean;
}

export function classifyKey(e: KeyEventLike, policy: InputPolicy = {}): KeyAction {
  if (e.repeat || e.isComposing) return { kind: "ignore" };
  if (e.ctrlKey || e.metaKey || e.altKey) return { kind: "ignore" };
  if (e.key === "Escape") return { kind: "escape" };
  if (e.key === "Enter") return { kind: "enter" };
  if (e.key === " ") return { kind: "space" };
  // Dead keys / composition intermediates report multi-char names like "Dead".
  if (e.key.length !== 1) return { kind: "ignore" };
  const char = e.key.toLowerCase();
  if (char === ";" && !policy.allowSemicolon) return { kind: "ignore" };
  // Printable single characters count as attempts (right or wrong).
  return { kind: "char", char };
}
