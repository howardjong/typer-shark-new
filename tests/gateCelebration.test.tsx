import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GateCelebration } from "../src/components/GateCelebration";
import { getMission } from "../src/game/missions";

describe("Current Gate celebration", () => {
  it("is a short, explicit scene that a player can skip", () => {
    const onContinue = vi.fn();
    render(<GateCelebration mission={getMission("sunlit-gate")} onContinue={onContinue} />);

    expect(screen.getByLabelText("Region build celebration")).toBeTruthy();
    expect(screen.getByText("Sunlit Gate is steady!")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Skip Celebration" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
