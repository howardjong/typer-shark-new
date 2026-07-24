import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameScreen } from "../src/components/GameScreen";
import { GateScreen } from "../src/components/GateScreen";
import { getMission } from "../src/game/missions";
import { DEFAULT_SETTINGS } from "../src/state/settings";

const pausedPhase = { name: "paused" as const, reason: "user" as const };

describe("gameplay live regions", () => {
  it("provides atomic polite announcements for regular missions", () => {
    render(
      <GameScreen
        difficultyId="starter"
        mission={getMission("warmup-first-letter")}
        phase={pausedPhase}
        settings={DEFAULT_SETTINGS}
        updateSettings={() => {}}
        dispatch={() => {}}
        onMissionEnd={() => {}}
        onOpenSettings={() => {}}
      />,
    );

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");
  });

  it("provides the same concise announcement channel for Current Gates", () => {
    render(
      <GateScreen
        difficultyId="starter"
        mission={getMission("sunlit-gate")}
        phase={pausedPhase}
        settings={DEFAULT_SETTINGS}
        updateSettings={() => {}}
        dispatch={() => {}}
        onMissionEnd={() => {}}
        onOpenSettings={() => {}}
      />,
    );

    const statuses = screen.getAllByRole("status");
    const liveStatus = statuses.find((status) => status.getAttribute("aria-live") === "polite");
    expect(liveStatus?.getAttribute("aria-atomic")).toBe("true");
  });
});
