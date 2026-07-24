export type KeyCampLessonKind = "posture" | "letters" | "words";

export interface KeyCampLesson {
  id: string;
  kind: KeyCampLessonKind;
  title: string;
  instruction: string;
  prompts: readonly string[];
}

/** Untimed, deliberately ordered drills: posture → single keys → short words. */
export const KEY_CAMP_LESSONS: readonly KeyCampLesson[] = [
  {
    id: "home-row-posture",
    kind: "posture",
    title: "Home-row ready",
    instruction: "Rest your fingers on A S D F and J K L ;. Try one calm key at a time.",
    prompts: ["a", "s", "d", "f", "j", "k", "l", ";"],
  },
  {
    id: "left-hand-letters",
    kind: "letters",
    title: "Left-hand letters",
    instruction: "Keep your left hand relaxed. Follow the highlighted key and finger hint.",
    prompts: ["a", "s", "d", "f", "f", "d", "s", "a"],
  },
  {
    id: "right-hand-letters",
    kind: "letters",
    title: "Right-hand letters",
    instruction: "Now try the right-hand home row, including the semicolon key.",
    prompts: ["j", "k", "l", ";", ";", "l", "k", "j"],
  },
  {
    id: "home-row-words",
    kind: "words",
    title: "Home-row words",
    instruction: "Read one short word from left to right. Your keyboard guide will show the next key.",
    prompts: ["sad", "dad", "fall", "ask", "dash", "all"],
  },
];

const FINGER_HINTS: Record<string, string> = {
  a: "left pinky", s: "left ring finger", d: "left middle finger", f: "left index finger",
  j: "right index finger", k: "right middle finger", l: "right ring finger", ";": "right pinky",
};

export function keyCampFingerHint(key: string): string {
  return FINGER_HINTS[key] ?? "a relaxed finger";
}
