import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdventureMap } from "../src/components/AdventureMap";
import { DEFAULT_PROGRESS } from "../src/state/progress";

describe("Adventure map", () => {
  it("offers an unlocked Current Gate the same untimed practice route as a regular mission", () => {
    const onPracticeMission = vi.fn();
    render(
      <AdventureMap
        difficulty="starter"
        progress={{ ...DEFAULT_PROGRESS, unlockedMissionIds: ["sunlit-gate"] }}
        onSelectMission={() => {}}
        onPracticeMission={onPracticeMission}
        onBack={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Practise without timer" }));
    expect(onPracticeMission).toHaveBeenCalledWith("sunlit-gate");
  });
});
