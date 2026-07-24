import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PebbleBayBuilds } from "../src/components/PebbleBayBuilds";

describe("Pebble Bay builds", () => {
  it("renders durable cosmetic reward names and visible block pieces", () => {
    const { container } = render(<PebbleBayBuilds pieces={["sandstone welcome arch", "coral lantern post"]} />);
    expect(screen.getByRole("heading", { name: "Pebble Bay builds" })).toBeTruthy();
    expect(screen.getByText(/sandstone welcome arch/)).toBeTruthy();
    expect(container.querySelectorAll(".reward-piece")).toHaveLength(2);
  });
});
