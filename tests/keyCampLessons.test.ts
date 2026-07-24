import { describe, expect, it } from "vitest";
import { KEY_CAMP_LESSONS, keyCampFingerHint } from "../src/game/keyCampLessons";

describe("Key Camp lessons", () => {
  it("teaches posture, then letters, then words in a fixed child-friendly order", () => {
    expect(KEY_CAMP_LESSONS.map((lesson) => lesson.kind)).toEqual(["posture", "letters", "letters", "words"]);
    expect(KEY_CAMP_LESSONS[0].prompts).toContain(";");
    expect(KEY_CAMP_LESSONS[KEY_CAMP_LESSONS.length - 1].prompts.every((prompt) => prompt.length >= 3)).toBe(true);
  });

  it("maps the home row to clear finger hints", () => {
    expect(keyCampFingerHint("a")).toBe("left pinky");
    expect(keyCampFingerHint(";")).toBe("right pinky");
  });
});
