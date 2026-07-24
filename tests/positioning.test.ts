import { describe, expect, it } from "vitest";
import { targetTranslateX } from "../src/game/positioning";

describe("measured target positioning", () => {
  it("keeps targets inside the playfield using their actual measured width", () => {
    expect(targetTranslateX(1, 600, 140)).toBe(460);
    expect(targetTranslateX(0.5, 600, 140)).toBe(230);
    expect(targetTranslateX(0, 600, 140)).toBe(0);
  });

  it("clamps invalid progress and narrow fields without producing a negative position", () => {
    expect(targetTranslateX(-1, 300, 140)).toBe(0);
    expect(targetTranslateX(2, 300, 140)).toBe(160);
    expect(targetTranslateX(1, 80, 140)).toBe(0);
  });
});
