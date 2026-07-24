import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KeyCampScreen } from "../src/components/KeyCampScreen";

afterEach(cleanup);

describe("Key Camp screen", () => {
  it("accepts semicolon in the tutor and advances from letter drills to words", () => {
    render(<KeyCampScreen onExit={() => {}} onOpenSettings={() => {}} />);
    const area = screen.getByLabelText("Key Camp typing tutor");
    fireEvent.click(screen.getByRole("button", { name: "Skip Lesson" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip Lesson" }));
    expect(screen.getByRole("heading", { name: "Right-hand letters" })).toBeTruthy();
    for (const key of ["j", "k", "l", ";", ";", "l", "k", "j"]) {
      fireEvent.keyDown(area, { key });
    }
    expect(screen.getByRole("heading", { name: "Home-row words" })).toBeTruthy();
    expect(document.querySelector(".key-camp-target")?.textContent).toBe("sad");
  });

  it("offers repeat, skip, slow guidance, settings, and exit controls", () => {
    const onExit = vi.fn();
    const onOpenSettings = vi.fn();
    render(<KeyCampScreen onExit={onExit} onOpenSettings={onOpenSettings} />);
    fireEvent.click(screen.getByRole("button", { name: "Use Slow Guidance" }));
    expect(screen.getByRole("button", { name: "Slow Guidance On" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Exit Key Camp" }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(onExit).toHaveBeenCalledOnce();
  });
});
