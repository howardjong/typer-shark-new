/**
 * Reviewed word/letter content, grouped by lesson. Original content only —
 * no word list is copied from any commercial game. Keep these arrays easy to
 * edit: the validator below protects the curriculum and the generator.
 */

/** First mission: home row plus g/h, gentlest possible start. */
export const STARTER_WARMUP_LETTERS: readonly string[] = [
  "a", "s", "d", "f", "j", "k", "l", "g", "h",
];

export const HOME_ROW_LETTERS: readonly string[] = [
  "a", "s", "d", "f", "g", "h", "j", "k", "l",
];

export const TOP_ROW_LETTERS: readonly string[] = [
  "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
];

export const BOTTOM_ROW_LETTERS: readonly string[] = [
  "z", "x", "c", "v", "b", "n", "m",
];

/** Full single-letter drill pool for later Starter lessons. */
export const ALL_LETTERS: readonly string[] = "abcdefghijklmnopqrstuvwxyz".split("");

/** 3-letter phonetic words for Starter missions and Tile Rays. */
export const STARTER_CVC_WORDS: readonly string[] = [
  "bag", "bat", "bed", "big", "bug",
  "cab", "can", "cap", "cat", "cob", "cot", "cup",
  "dad", "den", "dig", "dog", "dot",
  "fan", "fat", "fin", "fog", "fun",
  "gap", "get", "gum",
  "hat", "hen", "hip", "hop", "hot", "hug",
  "jam", "jet", "job", "jug",
  "kid", "kit",
  "leg", "lid", "log",
  "map", "mat", "men", "mop", "mug",
  "nap", "net", "nod", "nut",
  "pan", "pen", "pig", "pin", "pot", "pup",
  "rag", "ram", "red", "rib", "rod", "rug", "run",
  "sad", "sat", "set", "sip", "sit", "sun",
  "tap", "ten", "tip", "top", "tub",
  "van", "vet", "web", "wig", "win", "yak", "yes", "zip",
];

/** Familiar common words, used in controlled word-pair lessons. */
export const COMMON_SIGHT_WORDS: readonly string[] = [
  "a", "all", "am", "an", "and", "are", "at", "away",
  "be", "big", "black", "blue", "brown",
  "can", "come",
  "did", "do", "down",
  "eat",
  "find", "for", "four", "funny",
  "go", "good", "green",
  "have", "he", "help", "here",
  "in", "is", "it",
  "jump",
  "like", "little", "look",
  "make", "me", "must", "my",
  "new", "no", "not", "now",
  "on", "one", "our", "out",
  "play", "please", "pretty",
  "ran", "red", "ride", "run",
  "said", "saw", "say", "see", "she", "so", "soon",
  "that", "the", "there", "they", "this", "three", "to", "two",
  "under", "up",
  "want", "was", "we", "well", "went", "what", "where", "white", "who", "will", "with",
  "yellow", "yes", "you",
];

/** Familiar 3–5 letter words for Standard missions. */
export const STANDARD_FAMILIAR_WORDS: readonly string[] = [
  "bay", "blue", "block", "build",
  "cave", "clear", "coast", "coral", "crate", "cube",
  "deep", "drift",
  "eel",
  "fish", "float", "foam",
  "gate", "gem", "glow",
  "kelp",
  "light",
  "map", "moss",
  "ocean",
  "pearl",
  "reef",
  "sand", "shelf", "shell", "shine", "spark", "stone", "swim",
  "teal", "tide", "tile", "trail",
  "warm", "wave", "water",
];

/** Familiar 4–7 letter words for Swift missions. */
export const SWIFT_CHALLENGE_WORDS: readonly string[] = [
  "anchor", "beacon", "builder", "bubble",
  "canyon", "cavern", "channel", "corals", "crystal", "current",
  "dive", "drift",
  "explore",
  "flowing",
  "gentle",
  "harbor",
  "island",
  "lantern", "little",
  "meadow",
  "ocean",
  "pebble", "protect", "purple",
  "quartz",
  "ripple",
  "sandy", "seabed", "shelter", "sparkle", "stream", "sunset", "swimmer",
  "tunnel",
  "violet", "voyage",
  "whisper", "wonder",
  "yellow",
  "zigzag",
];

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

export interface WordBankRules {
  minEntries?: number;
  minLength?: number;
  maxLength?: number;
  minDistinctFirstLetters?: number;
}

export const STARTER_CVC_RULES: Readonly<WordBankRules> = {
  minEntries: 40,
  minLength: 3,
  maxLength: 3,
  minDistinctFirstLetters: 3,
};

export const SIGHT_WORD_RULES: Readonly<WordBankRules> = {
  minEntries: 40,
  minLength: 1,
  maxLength: 7,
  minDistinctFirstLetters: 3,
};

export const STANDARD_WORD_RULES: Readonly<WordBankRules> = {
  minEntries: 40,
  minLength: 3,
  maxLength: 5,
  minDistinctFirstLetters: 3,
};

export const SWIFT_WORD_RULES: Readonly<WordBankRules> = {
  minEntries: 40,
  minLength: 4,
  maxLength: 7,
  minDistinctFirstLetters: 3,
};

/**
 * Validate a reviewed word bank. The generic rules keep word content easy to
 * replace while enforcing the gameplay constraints that prevent ambiguity.
 */
export function validateWordBank(
  entries: readonly string[],
  rules: WordBankRules = {},
): string[] {
  const issues: string[] = [];
  const {
    minEntries = 1,
    minLength = 1,
    maxLength = Number.POSITIVE_INFINITY,
    minDistinctFirstLetters = 1,
  } = rules;

  if (entries.length < minEntries) {
    issues.push(`bank needs at least ${minEntries} entries`);
  }

  const seen = new Set<string>();
  const firstLetters = new Set<string>();
  for (const entry of entries) {
    if (entry.length === 0) issues.push("entry is empty");
    if (!/^[a-z]+$/.test(entry)) {
      issues.push(`entry "${entry}" is not lowercase ASCII letters`);
    }
    if (entry.length < minLength || entry.length > maxLength) {
      issues.push(`entry "${entry}" is outside the allowed length`);
    }
    if (seen.has(entry)) issues.push(`duplicate entry "${entry}"`);
    seen.add(entry);
    if (entry.length > 0) firstLetters.add(entry[0]);
  }

  if (firstLetters.size < minDistinctFirstLetters) {
    issues.push(`bank needs at least ${minDistinctFirstLetters} distinct first letters`);
  }
  return issues;
}

/** Backward-compatible single-letter validator for letter drills. */
export function validateLetterBank(letters: readonly string[]): string[] {
  return validateWordBank(letters, {
    minEntries: 3,
    minLength: 1,
    maxLength: 1,
    minDistinctFirstLetters: 3,
  });
}
