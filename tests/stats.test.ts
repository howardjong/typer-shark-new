import { describe, expect, it } from "vitest";
import { accuracyPct, formatStat, wordsPerMinute } from "../src/game/stats";

describe("accuracy", () => {
  it("returns null (—) with zero accepted input, never NaN or 100%", () => {
    expect(accuracyPct(0, 0)).toBeNull();
    expect(formatStat(accuracyPct(0, 0), "%")).toBe("—");
  });
  it("computes correct/accepted", () => {
    expect(accuracyPct(9, 10)).toBe(90);
    expect(accuracyPct(1, 3)).toBe(33);
    expect(accuracyPct(10, 10)).toBe(100);
  });
});

describe("wpm", () => {
  it("returns null for sessions under 10 active seconds", () => {
    expect(wordsPerMinute(50, 9999)).toBeNull();
    expect(formatStat(wordsPerMinute(50, 5000))).toBe("—");
  });
  it("computes (chars/5)/minutes for valid sessions", () => {
    // 100 correct chars in 60s -> 20 WPM
    expect(wordsPerMinute(100, 60000)).toBe(20);
    // 25 chars in 30s -> 10 WPM
    expect(wordsPerMinute(25, 30000)).toBe(10);
  });
  it("handles zero input in a valid-length session", () => {
    expect(wordsPerMinute(0, 60000)).toBe(0);
  });
});
