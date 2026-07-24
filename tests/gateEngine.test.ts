import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../src/game/config";
import { GateEngine } from "../src/game/gateEngine";

function makeGate(overrides: Partial<ConstructorParameters<typeof GateEngine>[0]> = {}) {
  return new GateEngine({
    difficulty: DIFFICULTIES.starter,
    motion: "normal",
    labels: ["a", "s", "d", "f"],
    stabilityBlocks: 2,
    maximumVisibleProjectiles: 3,
    seed: 7,
    ...overrides,
  });
}

function spawn(engine: GateEngine, count = 1) {
  for (let i = 0; i < 400 && engine.projectiles.length < count; i++) engine.tick(50);
  if (engine.projectiles.length < count) throw new Error("projectile did not spawn");
}

describe("Current Gate engine", () => {
  it("redirects labelled projectiles into stability blocks and finishes the gate", () => {
    const gate = makeGate();
    for (let i = 0; i < 2; i++) {
      spawn(gate);
      gate.handleKey(gate.projectiles[0].label[0]);
    }
    expect(gate.stabilityLeft).toBe(0);
    expect(gate.ended).toBe("success");
    expect(gate.snapshot().shieldReady).toBe(false);
    expect("activateReefShield" in gate).toBe(false);
  });

  it("keeps the gate's three-projectile ceiling and Starter ambiguity protection", () => {
    const gate = makeGate({ labels: ["a", "s", "d", "f", "g"] });
    for (let i = 0; i < 260; i++) {
      gate.tick(50);
      expect(gate.projectiles.length).toBeLessThanOrEqual(3);
      const firsts = gate.projectiles.map((projectile) => projectile.label[0]);
      expect(new Set(firsts).size).toBe(firsts.length);
    }
  });

  it("charges no shield and loses one heart once for each missed projectile", () => {
    const gate = makeGate();
    spawn(gate);
    const projectile = gate.projectiles[0];
    projectile.x = 0.00001;
    gate.tick(50);
    expect(gate.hearts).toBe(DIFFICULTIES.starter.hearts - 1);
    expect(gate.accepted).toBe(0);
    expect(gate.snapshot().shieldCharge).toBe(0);
  });
});
