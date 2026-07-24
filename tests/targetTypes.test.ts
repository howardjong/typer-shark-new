import { describe, expect, it } from "vitest";
import { isOrdinaryTargetFamily, TARGET_FAMILY_RULES } from "../src/game/targetTypes";

describe("target-family safety rules", () => {
  it("keeps Current Gates outside the ordinary target engine and Reef Shield", () => {
    expect(isOrdinaryTargetFamily("current-gate")).toBe(false);
    expect(TARGET_FAMILY_RULES["current-gate"].clearableByReefShield).toBe(false);
    expect(TARGET_FAMILY_RULES["current-gate"].chargesReefShield).toBe(false);
  });

  it("makes Treasure Bubbles optional rather than harmful", () => {
    const bubble = TARGET_FAMILY_RULES["treasure-bubble"];
    expect(bubble.collisionCostsHeart).toBe(false);
    expect(bubble.chargesReefShield).toBe(false);
    expect(bubble.usesBonusLabels).toBe(true);
  });
});
