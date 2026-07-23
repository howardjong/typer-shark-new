/**
 * Deterministic simulation engine for a mission. Plain TypeScript, no React,
 * no DOM. Time advances only through tick(); input arrives only through
 * handleKey(). All rules and tunables come from config.ts.
 */
import {
  BUILD_BITS_PER_LETTER,
  DifficultyConfig,
  FIRST_SPAWN_DELAY_MS,
  FRAME_DELTA_CLAMP_MS,
  LANE_COUNT,
  LANE_SPAWN_CLEARANCE_X,
  MOTION_MULTIPLIER,
  MotionId,
  SPAWN_RETRY_DELAY_MS,
  STALL_AUTO_PAUSE_MS,
  STARTER_SELECTED_SPEED_FACTOR,
  STREAK_BADGE_EVERY,
} from "./config";
import { RNG } from "./rng";

export interface TargetState {
  id: number;
  label: string;
  /** Count of correctly typed characters so far. */
  typed: number;
  /** 1 = spawn edge (right), 0 = Pebble Bay base (left). */
  x: number;
  lane: number;
  spawnTime: number;
  /** Cosmetic variant index (deterministic from the seeded RNG). */
  variant: number;
}

export type EngineEvent =
  | { type: "spawn"; target: TargetState }
  | { type: "select"; id: number }
  | { type: "progress"; id: number; typed: number }
  | { type: "complete"; id: number; label: string; streak: number; badge: boolean }
  | { type: "wrongKey"; id: number; expected: string }
  | { type: "noMatch"; char: string }
  | { type: "miss"; id: number; heartsLeft: number }
  | { type: "end"; outcome: MissionOutcome }
  | { type: "stall" };

export type MissionOutcome = "success" | "defeat";

export interface EngineOptions {
  difficulty: DifficultyConfig;
  motion: MotionId;
  letters: readonly string[];
  seed: number;
  /** Override mission length (tests). */
  durationMs?: number;
}

export interface EngineSnapshot {
  hearts: number;
  timeLeftMs: number;
  activeMs: number;
  correct: number;
  accepted: number;
  streak: number;
  bestStreak: number;
  completed: number;
  buildBits: number;
  ended: MissionOutcome | null;
}

export class Engine {
  targets: TargetState[] = [];
  selectedId: number | null = null;
  hearts: number;
  timeLeftMs: number;
  activeMs = 0;
  correct = 0;
  accepted = 0;
  streak = 0;
  bestStreak = 0;
  completed = 0;
  buildBits = 0;
  ended: MissionOutcome | null = null;
  /** Bumped on any observable change so the UI can re-render cheaply. */
  version = 0;

  private events: EngineEvent[] = [];
  private nextId = 1;
  private simTime = 0;
  private spawnCooldown = FIRST_SPAWN_DELAY_MS;
  private rng: RNG;
  private motionMult: number;

  constructor(private opts: EngineOptions) {
    this.hearts = opts.difficulty.hearts;
    this.timeLeftMs = opts.durationMs ?? opts.difficulty.missionDurationMs;
    this.rng = new RNG(opts.seed);
    this.motionMult = MOTION_MULTIPLIER[opts.motion];
  }

  /**
   * Motion changes made in the pause menu apply here, after the resume
   * countdown — existing targets keep their positions, only speed changes.
   */
  setMotion(motion: MotionId): void {
    this.motionMult = MOTION_MULTIPLIER[motion];
  }

  snapshot(): EngineSnapshot {
    return {
      hearts: this.hearts,
      timeLeftMs: this.timeLeftMs,
      activeMs: this.activeMs,
      correct: this.correct,
      accepted: this.accepted,
      streak: this.streak,
      bestStreak: this.bestStreak,
      completed: this.completed,
      buildBits: this.buildBits,
      ended: this.ended,
    };
  }

  drainEvents(): EngineEvent[] {
    if (this.events.length === 0) return this.events;
    const out = this.events;
    this.events = [];
    return out;
  }

  /**
   * Advance the simulation. Returns "stall" (without simulating) when the
   * frame gap is long enough that the caller must auto-pause — a stalled
   * browser must never teleport a target into the base.
   */
  tick(rawDtMs: number): "ok" | "stall" {
    if (this.ended) return "ok";
    if (rawDtMs > STALL_AUTO_PAUSE_MS) {
      this.emit({ type: "stall" });
      return "stall";
    }
    const dt = Math.min(Math.max(rawDtMs, 0), FRAME_DELTA_CLAMP_MS);
    this.simTime += dt;
    this.activeMs += dt;

    // Mission timer: reaching zero with a heart left is success. Input for
    // this frame was already handled in handleKey, so the keystroke wins.
    this.timeLeftMs -= dt;
    if (this.timeLeftMs <= 0) {
      this.timeLeftMs = 0;
      this.finish("success");
      return "ok";
    }

    // Movement (elapsed-time based, never frame-count based).
    const baseSpeed = 1 / (this.opts.difficulty.crossTimeMs * this.motionMult);
    for (const t of this.targets) {
      let speed = baseSpeed;
      if (t.id === this.selectedId && this.opts.difficulty.id === "starter") {
        speed *= STARTER_SELECTED_SPEED_FACTOR;
      }
      t.x -= speed * dt;
    }

    // Collisions: each reaching target is removed once, costs one heart once,
    // clears selection safely, and never counts as a typing mistake.
    for (const t of [...this.targets]) {
      if (t.x > 0 || this.ended) continue;
      this.removeTarget(t.id);
      if (this.selectedId === t.id) this.selectedId = null;
      this.hearts -= 1;
      this.emit({ type: "miss", id: t.id, heartsLeft: this.hearts });
      if (this.hearts <= 0) this.finish("defeat");
    }

    if (!this.ended) {
      this.spawnCooldown -= dt;
      if (this.spawnCooldown <= 0) this.trySpawn();
    }

    this.version++;
    return "ok";
  }

  /**
   * Handle one already-classified printable character. Every call counts as
   * an accepted gameplay keystroke (right or wrong) per the accuracy rules.
   */
  handleKey(char: string): void {
    if (this.ended) return;
    this.accepted++;

    const selected = this.targets.find((t) => t.id === this.selectedId);
    if (selected) {
      const expected = selected.label[selected.typed];
      if (char === expected) {
        this.advance(selected);
      } else {
        this.streak = 0;
        this.emit({ type: "wrongKey", id: selected.id, expected });
      }
      this.version++;
      return;
    }

    // No selection: first typed char selects the eligible target closest to
    // the base AND counts as its first correct character. Ties break by
    // earlier spawn time, then stable id — fully deterministic.
    const eligible = this.targets.filter((t) => t.label[0] === char);
    if (eligible.length > 0) {
      eligible.sort(
        (a, b) => a.x - b.x || a.spawnTime - b.spawnTime || a.id - b.id,
      );
      const target = eligible[0];
      this.selectedId = target.id;
      this.emit({ type: "select", id: target.id });
      this.advance(target);
    } else {
      this.streak = 0;
      this.emit({ type: "noMatch", char });
    }
    this.version++;
  }

  private advance(target: TargetState): void {
    target.typed++;
    this.correct++;
    this.emit({ type: "progress", id: target.id, typed: target.typed });
    if (target.typed >= target.label.length) {
      this.removeTarget(target.id);
      this.selectedId = null;
      this.completed++;
      this.buildBits += BUILD_BITS_PER_LETTER * target.label.length;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      const badge = this.streak > 0 && this.streak % STREAK_BADGE_EVERY === 0;
      this.emit({
        type: "complete",
        id: target.id,
        label: target.label,
        streak: this.streak,
        badge,
      });
    }
  }

  /**
   * Bounded spawn attempt. When no unambiguous label or free lane exists,
   * delay and retry later — never loop, never place an unreadable target.
   */
  private trySpawn(): void {
    if (this.targets.length >= this.opts.difficulty.maxVisibleTargets) {
      this.spawnCooldown = SPAWN_RETRY_DELAY_MS;
      return;
    }

    // No-ambiguity rule: exclude first letters of all unresolved labels.
    let pool = this.opts.letters;
    if (this.opts.difficulty.noSameFirstLetter) {
      const reserved = new Set(this.targets.map((t) => t.label[0]));
      pool = pool.filter((l) => !reserved.has(l));
    }
    if (pool.length === 0) {
      this.spawnCooldown = SPAWN_RETRY_DELAY_MS;
      return;
    }

    // Lane placement: pick a lane with no target near the spawn edge so
    // labels never overlap. If none is free, delay instead.
    const busyLanes = new Set(
      this.targets.filter((t) => t.x > LANE_SPAWN_CLEARANCE_X).map((t) => t.lane),
    );
    const freeLanes: number[] = [];
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      if (!busyLanes.has(lane)) freeLanes.push(lane);
    }
    if (freeLanes.length === 0) {
      this.spawnCooldown = SPAWN_RETRY_DELAY_MS;
      return;
    }

    const target: TargetState = {
      id: this.nextId++,
      label: this.rng.pick(pool),
      typed: 0,
      x: 1,
      lane: this.rng.pick(freeLanes),
      spawnTime: this.simTime,
      variant: this.rng.int(4),
    };
    this.targets.push(target);
    this.emit({ type: "spawn", target });
    this.spawnCooldown =
      this.opts.difficulty.minSpawnIntervalMs * this.motionMult;
  }

  private finish(outcome: MissionOutcome): void {
    if (this.ended) return;
    this.ended = outcome;
    // Remaining targets are cleared without keystrokes, streak, score, or
    // Build Bits side effects.
    this.targets = [];
    this.selectedId = null;
    this.emit({ type: "end", outcome });
    this.version++;
  }

  private removeTarget(id: number): void {
    this.targets = this.targets.filter((t) => t.id !== id);
  }

  private emit(event: EngineEvent): void {
    this.events.push(event);
  }
}
