import { describe, expect, it } from "vitest";
import { classifyKey } from "../src/game/input";

describe("classifyKey", () => {
  it("lowercases printable keys so Caps Lock/Shift never cause false mistakes", () => {
    expect(classifyKey({ key: "A" })).toEqual({ kind: "char", char: "a" });
    expect(classifyKey({ key: "a" })).toEqual({ kind: "char", char: "a" });
  });

  it("ignores repeats", () => {
    expect(classifyKey({ key: "a", repeat: true })).toEqual({ kind: "ignore" });
  });

  it("ignores composition and dead keys", () => {
    expect(classifyKey({ key: "a", isComposing: true })).toEqual({ kind: "ignore" });
    expect(classifyKey({ key: "Dead" })).toEqual({ kind: "ignore" });
  });

  it("ignores modifier combos (browser shortcuts)", () => {
    expect(classifyKey({ key: "a", ctrlKey: true })).toEqual({ kind: "ignore" });
    expect(classifyKey({ key: "a", metaKey: true })).toEqual({ kind: "ignore" });
    expect(classifyKey({ key: "a", altKey: true })).toEqual({ kind: "ignore" });
  });

  it("ignores modifier-only and function keys", () => {
    expect(classifyKey({ key: "Shift" })).toEqual({ kind: "ignore" });
    expect(classifyKey({ key: "F5" })).toEqual({ kind: "ignore" });
    expect(classifyKey({ key: "ArrowLeft" })).toEqual({ kind: "ignore" });
    expect(classifyKey({ key: "Tab" })).toEqual({ kind: "ignore" });
  });

  it("classifies control keys used by the game", () => {
    expect(classifyKey({ key: "Escape" })).toEqual({ kind: "escape" });
    expect(classifyKey({ key: "Enter" })).toEqual({ kind: "enter" });
    expect(classifyKey({ key: " " })).toEqual({ kind: "space" });
  });

  it("accepts semicolon and other printable chars as attempts", () => {
    expect(classifyKey({ key: ";" })).toEqual({ kind: "char", char: ";" });
    expect(classifyKey({ key: "3" })).toEqual({ kind: "char", char: "3" });
  });
});
