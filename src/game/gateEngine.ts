/**
 * Deterministic engine for Current Gate encounters. It deliberately has no
 * Reef Shield API: gates use redirected labelled projectiles and stability
 * blocks, not ordinary-target clears.
 */
import {
  BUILD_BITS_PER_LETTER,
  DifficultyConfig,
  FRAME_DELTA_CLAMP_MS,
  LANE_COUNT,
  LANE_SPAWN_CLEARANCE_X,
  MOTION_MULTIPLIER,
  MotionId,
  SPAWN_RETRY_DELAY_MS,
  STALL_AUTO_PAUSE_MS,
  STREAK_BADGE_EVERY,
} from "./config";
import type { EngineSnapshot, MissionOutcome } from "./engine";
import { RNG } from "./rng";

export interface GateProjectileState {
  id: number;
  label: string;
  typed: number;
  x: number;
  lane: number;
  spawnTime: number;
  variant: number;
}

export type GateEngineEvent =
  | { type: "spawn"; projectile: GateProjectileState }
  | { type: "select"; id: number }
  | { type: "progress"; id: number; typed: number }
  | { type: "complete"; id: number; label: string; stabilityLeft: number; badge: boolean }
  | { type: "wrongKey"; id: number; expected: string }
  | { type: "noMatch"; char: string }
  | { type: "miss"; id: number; heartsLeft: number }
  | { type: "end"; outcome: MissionOutcome }
  | { type: "stall" };

export interface GateEngineOptions {
  difficulty: DifficultyConfig;
  motion: MotionId;
  labels: readonly string[];
  stabilityBlocks: number;
  maximumVisibleProjectiles: number;
  seed: number;
}

export interface GateSnapshot extends EngineSnapshot {
  stabilityLeft: number;
  stabilityTotal: number;
}

export class GateEngine {
  projectiles: GateProjectileState[] = [];
  selectedId: number | null = null;
  hearts: number;
  activeMs = 0;
  correct = 0;
  accepted = 0;
  streak = 0;
  bestStreak = 0;
  completed = 0;
  buildBits = 0;
  ended: MissionOutcome | null = null;
  stabilityLeft: number;
  readonly stabilityTotal: number;
  version = 0;

  private events: GateEngineEvent[] = [];
  private nextId = 1;
  private simTime = 0;
  private spawnCooldown = 1_500;
  private rng: RNG;
  private motionMult: number;

  constructor(private opts: GateEngineOptions) {
    this.hearts = opts.difficulty.hearts;
    this.stabilityLeft = opts.stabilityBlocks;
    this.stabilityTotal = opts.stabilityBlocks;
    this.rng = new RNG(opts.seed);
    this.motionMult = MOTION_MULTIPLIER[opts.motion];
  }

  setMotion(motion: MotionId): void {
    this.motionMult = MOTION_MULTIPLIER[motion];
  }

  snapshot(): GateSnapshot {
    return {
      hearts: this.hearts,
      timeLeftMs: 0,
      activeMs: this.activeMs,
      correct: this.correct,
      accepted: this.accepted,
      streak: this.streak,
      bestStreak: this.bestStreak,
      completed: this.completed,
      buildBits: this.buildBits,
      shieldCharge: 0,
      shieldReady: false,
      ended: this.ended,
      stabilityLeft: this.stabilityLeft,
      stabilityTotal: this.stabilityTotal,
    };
  }

  drainEvents(): GateEngineEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  tick(rawDtMs: number): "ok" | "stall" {
    if (this.ended) return "ok";
    if (rawDtMs > STALL_AUTO_PAUSE_MS) {
      this.emit({ type: "stall" });
      return "stall";
    }
    const dt = Math.min(Math.max(rawDtMs, 0), FRAME_DELTA_CLAMP_MS);
    this.simTime += dt;
    this.activeMs += dt;
    const speed = 1 / (this.opts.difficulty.crossTimeMs * 1.25 * this.motionMult);
    for (const projectile of this.projectiles) projectile.x -= speed * dt;

    for (const projectile of [...this.projectiles]) {
      if (projectile.x > 0 || this.ended) continue;
      this.removeProjectile(projectile.id);
      if (this.selectedId === projectile.id) this.selectedId = null;
      this.hearts -= 1;
      this.emit({ type: "miss", id: projectile.id, heartsLeft: this.hearts });
      if (this.hearts <= 0) this.finish("defeat");
    }

    if (!this.ended) {
      this.spawnCooldown -= dt;
      if (this.spawnCooldown <= 0) this.trySpawn();
    }
    this.version++;
    return "ok";
  }

  handleKey(char: string): void {
    if (this.ended) return;
    this.accepted++;
    const selected = this.projectiles.find((projectile) => projectile.id === this.selectedId);
    if (selected) {
      const expected = selected.label[selected.typed];
      if (char === expected) this.advance(selected);
      else {
        this.streak = 0;
        this.emit({ type: "wrongKey", id: selected.id, expected });
      }
      this.version++;
      return;
    }

    const eligible = this.projectiles.filter((projectile) => projectile.label[0] === char);
    if (eligible.length === 0) {
      this.streak = 0;
      this.emit({ type: "noMatch", char });
      this.version++;
      return;
    }
    eligible.sort((a, b) => a.x - b.x || a.spawnTime - b.spawnTime || a.id - b.id);
    const projectile = eligible[0];
    this.selectedId = projectile.id;
    this.emit({ type: "select", id: projectile.id });
    this.advance(projectile);
    this.version++;
  }

  private advance(projectile: GateProjectileState): void {
    projectile.typed++;
    this.correct++;
    this.emit({ type: "progress", id: projectile.id, typed: projectile.typed });
    if (projectile.typed < projectile.label.length) return;

    this.removeProjectile(projectile.id);
    this.selectedId = null;
    this.completed++;
    this.buildBits += BUILD_BITS_PER_LETTER * projectile.label.length;
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const badge = this.streak > 0 && this.streak % STREAK_BADGE_EVERY === 0;
    this.stabilityLeft = Math.max(0, this.stabilityLeft - 1);
    this.emit({
      type: "complete",
      id: projectile.id,
      label: projectile.label,
      stabilityLeft: this.stabilityLeft,
      badge,
    });
    if (this.stabilityLeft === 0) this.finish("success");
  }

  private trySpawn(): void {
    if (this.projectiles.length >= this.opts.maximumVisibleProjectiles) {
      this.spawnCooldown = SPAWN_RETRY_DELAY_MS;
      return;
    }
    let labels = this.opts.labels;
    if (this.opts.difficulty.noSameFirstLetter) {
      const reserved = new Set(this.projectiles.map((projectile) => projectile.label[0]));
      labels = labels.filter((label) => !reserved.has(label[0]));
    }
    if (labels.length === 0) {
      this.spawnCooldown = SPAWN_RETRY_DELAY_MS;
      return;
    }
    const busyLanes = new Set(
      this.projectiles.filter((projectile) => projectile.x > LANE_SPAWN_CLEARANCE_X).map((projectile) => projectile.lane),
    );
    const freeLanes = Array.from({ length: LANE_COUNT }, (_, lane) => lane).filter((lane) => !busyLanes.has(lane));
    if (freeLanes.length === 0) {
      this.spawnCooldown = SPAWN_RETRY_DELAY_MS;
      return;
    }
    const projectile: GateProjectileState = {
      id: this.nextId++,
      label: this.rng.pick(labels),
      typed: 0,
      x: 1,
      lane: this.rng.pick(freeLanes),
      spawnTime: this.simTime,
      variant: this.rng.int(3),
    };
    this.projectiles.push(projectile);
    this.emit({ type: "spawn", projectile });
    this.spawnCooldown = this.opts.difficulty.minSpawnIntervalMs * this.motionMult;
  }

  private removeProjectile(id: number): void {
    this.projectiles = this.projectiles.filter((projectile) => projectile.id !== id);
  }

  private finish(outcome: MissionOutcome): void {
    if (this.ended) return;
    this.ended = outcome;
    this.projectiles = [];
    this.selectedId = null;
    this.emit({ type: "end", outcome });
    this.version++;
  }

  private emit(event: GateEngineEvent): void {
    this.events.push(event);
  }
}
