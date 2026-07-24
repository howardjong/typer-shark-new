import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PracticeScreen } from "../src/components/PracticeScreen";
import { getMission } from "../src/game/missions";

afterEach(() => vi.unstubAllGlobals());

describe("untimed practice", () => {
  it("reports private feedback without hearts, rewards, or Reef Shield state", () => {
    vi.stubGlobal("requestAnimationFrame", () => 1);
    vi.stubGlobal("cancelAnimationFrame", () => {});
    const onFinish = vi.fn();
    render(
      <PracticeScreen
        mission={getMission("warmup-first-letter")}
        onFinish={onFinish}
        onRestart={() => {}}
        onLeave={() => {}}
        onOpenSettings={() => {}}
      />,
    );

    const area = screen.getByLabelText("Untimed Block Reef practice");
    fireEvent.keyDown(area, { key: "x" });
    fireEvent.keyDown(area, { key: "a" });
    fireEvent.click(screen.getByRole("button", { name: "Finish Practise" }));

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toMatchObject({
      hearts: 0,
      correct: 1,
      accepted: 2,
      completed: 1,
      buildBits: 0,
      shieldCharge: 0,
      shieldReady: false,
      ended: "success",
    });
  });
});
