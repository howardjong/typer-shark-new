import { describe, expect, it } from "vitest";
import { isMissionUnlocked, MISSIONS, validateMissions } from "../src/game/missions";

describe("Adventure Trail mission data", () => {
  it("defines the complete 12-mission, three-region campaign", () => {
    expect(MISSIONS).toHaveLength(12);
    expect(new Set(MISSIONS.map((mission) => mission.id)).size).toBe(12);
    for (const region of ["sunlit-shelf", "kelp-cubes", "crystal-current"] as const) {
      const regionMissions = MISSIONS.filter((mission) => mission.region === region);
      expect(regionMissions).toHaveLength(4);
      expect(regionMissions.filter((mission) => mission.kind === "current-gate")).toHaveLength(1);
      expect(regionMissions.filter((mission) => mission.kind === "regular")).toHaveLength(3);
    }
    expect(validateMissions(MISSIONS)).toEqual([]);
  });

  it("opens two branch lessons after each region's first lesson and a gate after either branch", () => {
    const byId = new Map(MISSIONS.map((mission) => [mission.id, mission]));
    const sunlitTop = byId.get("sunlit-top-row")!;
    const sunlitWords = byId.get("sunlit-short-words")!;
    const sunlitGate = byId.get("sunlit-gate")!;

    expect(isMissionUnlocked(sunlitTop, new Set(["warmup-first-letter"]))).toBe(true);
    expect(isMissionUnlocked(sunlitWords, new Set(["warmup-first-letter"]))).toBe(true);
    expect(isMissionUnlocked(sunlitGate, new Set(["sunlit-top-row"]))).toBe(true);
    expect(isMissionUnlocked(sunlitGate, new Set(["sunlit-short-words"]))).toBe(true);
    expect(isMissionUnlocked(sunlitGate, new Set())).toBe(false);
  });

  it("keeps all gates bounded and each regular mission reward deterministic", () => {
    const gateStability: number[] = [];
    for (const mission of MISSIONS) {
      expect(mission.labels.length).toBeGreaterThan(0);
      if (mission.kind === "current-gate") {
        expect(mission.gate?.maximumVisibleProjectiles).toBeLessThanOrEqual(3);
        gateStability.push(mission.gate!.stabilityBlocks);
      } else {
        expect(mission.buildReward).toEqual(expect.any(String));
      }
    }
    expect(gateStability).toEqual([8, 10, 12]);
    const crystalGate = MISSIONS.find((mission) => mission.id === "crystal-gate")!;
    expect(crystalGate.labels.every((label) => label.length >= 3 && label.length <= 5)).toBe(true);
  });
});
