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
  REEF_SHIELD_COMPLETIONS,
  SPAWN_RETRY_DELAY_MS,
  STALL_AUTO_PAUSE_MS,
  STARTER_SELECTED_SPEED_FACTOR,
  STREAK_BADGE_EVERY,
} from "./config";
import { RNG } from "./rng";
import { OrdinaryTargetFamily, TARGET_FAMILY_RULES } from "./targetTypes";

export interface TargetState {
  id: number;
  family: OrdinaryTargetFamily;
  label: string;
  /** Shellback's hidden second label, reserved until it is revealed. */
  nextLabel: string | null;
  /** 1 for the initial label, 2 after a Shellback label transition. */
  stage: 1 | 2;
  /** Total characters across every label, used for a fair final reward. */
  rewardCharacters: number;
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
  | { type: "nextLabel"; id: number; label: string }
  | { type: "complete"; id: number; label: string; streak: number; badge: boolean }
  | { type: "wrongKey"; id: number; expected: string }
  | { type: "noMatch"; char: string }
  | { type: "miss"; id: number; heartsLeft: number }
  | { type: "drift"; id: number; family: OrdinaryTargetFamily }
  | { type: "shieldReady" }
  | { type: "shieldUsed"; cleared: number }
  | { type: "end"; outcome: MissionOutcome }
  | { type: "stall" };

export type MissionOutcome = "success" | "defeat";

/**
 * Engine-owned, deterministic input for one ordinary timed run. Higher-level
 * screens may adapt a campaign mission, practice drill, or endless run into
 * this small shape without giving the engine React or DOM concerns.
 */
export interface MissionRunDefinition {
  id: string;
  labels: readonly string[];
  /** Defaults to Pebble Puffers to preserve the first playable slice. */
  targetFamilies?: readonly OrdinaryTargetFamily[];
  /** Second-label bank for two-stage Shellbacks; defaults to `labels`. */
  shellbackLabels?: readonly string[];
  /** Optional three-letter bank for harmless Treasure Bubbles. */
  bonusLabels?: readonly string[];
}

export interface EngineOptions {
  difficulty: DifficultyConfig;
  motion: MotionId;
  run: MissionRunDefinition;
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
  shieldCharge: number;
  shieldReady: boolean;
  ended: MissionOutcome | null;
}

export class Engine {
  readonly runId: string;
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
  shieldCharge = 0;
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
    this.runId = opts.run.id;
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

  isReefShieldReady(): boolean {
    return this.shieldCharge >= REEF_SHIELD_COMPLETIONS;
  }

  /**
   * Clears ordinary targets without granting score, accuracy, streak, or
   * Shield charge. A full Shield stays ready when there is nothing safe to
   * clear, so Enter can never waste it between spawns.
   */
  activateReefShield(): boolean {
    if (this.ended || !this.isReefShieldReady()) return false;
    const clearable = this.targets.filter(
      (target) => TARGET_FAMILY_RULES[target.family].clearableByReefShield,
    );
    if (clearable.length === 0) return false;

    const clearedIds = new Set(clearable.map((target) => target.id));
    this.targets = this.targets.filter((target) => !clearedIds.has(target.id));
    if (this.selectedId !== null && clearedIds.has(this.selectedId)) {
      this.selectedId = null;
    }
    this.shieldCharge = 0;
    this.emit({ type: "shieldUsed", cleared: clearable.length });
    this.version++;
    return true;
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
      shieldCharge: this.shieldCharge,
      shieldReady: this.isReefShieldReady(),
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

    // Collisions: each reaching target is removed once, clears selection
    // safely, and never counts as a typing mistake. Treasure Bubbles are
    // harmless: an untyped bonus simply drifts away.
    for (const t of [...this.targets]) {
      if (t.x > 0 || this.ended) continue;
      this.removeTarget(t.id);
      if (this.selectedId === t.id) this.selectedId = null;
      if (!TARGET_FAMILY_RULES[t.family].collisionCostsHeart) {
        this.emit({ type: "drift", id: t.id, family: t.family });
        continue;
      }
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
      if (target.nextLabel !== null) {
        target.label = target.nextLabel;
        target.nextLabel = null;
        target.stage = 2;
        target.typed = 0;
        this.emit({ type: "nextLabel", id: target.id, label: target.label });
        return;
      }

      this.removeTarget(target.id);
      this.selectedId = null;
      this.completed++;
      this.buildBits += BUILD_BITS_PER_LETTER * target.rewardCharacters;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      const badge = this.streak > 0 && this.streak % STREAK_BADGE_EVERY === 0;
      if (TARGET_FAMILY_RULES[target.family].chargesReefShield) {
        const wasReady = this.isReefShieldReady();
        this.shieldCharge = Math.min(REEF_SHIELD_COMPLETIONS, this.shieldCharge + 1);
        if (!wasReady && this.isReefShieldReady()) this.emit({ type: "shieldReady" });
      }
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

    // No-ambiguity rule: reserve both a Shellback's visible and hidden first
    // letters, so its second label can never reveal into a conflict.
    const reserved = this.opts.difficulty.noSameFirstLetter
      ? new Set(
          this.targets.flatMap((target) =>
            [target.label, target.nextLabel]
              .filter((label): label is string => label !== null)
              .map((label) => label[0]),
          ),
        )
      : new Set<string>();
    const families = this.targetFamilies().filter((family) =>
      this.canSpawnFamily(family, reserved),
    );
    if (families.length === 0) {
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

    const family = this.rng.pick(families);
    const labels = this.availableLabels(this.labelsFor(family), reserved);
    const label = this.rng.pick(labels);
    const nextLabel = TARGET_FAMILY_RULES[family].stages === 2
      ? this.rng.pick(this.availableLabels(this.opts.run.shellbackLabels ?? this.opts.run.labels, reserved))
      : null;
    const target: TargetState = {
      id: this.nextId++,
      family,
      label,
      nextLabel,
      stage: 1,
      rewardCharacters: label.length + (nextLabel?.length ?? 0),
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

  private targetFamilies(): readonly OrdinaryTargetFamily[] {
    return this.opts.run.targetFamilies ?? ["pebble-puffer"];
  }

  private labelsFor(family: OrdinaryTargetFamily): readonly string[] {
    if (!TARGET_FAMILY_RULES[family].usesBonusLabels) return this.opts.run.labels;
    return this.opts.run.bonusLabels ?? this.opts.run.labels.filter((label) => label.length === 3);
  }

  private availableLabels(labels: readonly string[], reserved: ReadonlySet<string>): readonly string[] {
    if (!this.opts.difficulty.noSameFirstLetter) return labels;
    return labels.filter((label) => !reserved.has(label[0]));
  }

  private canSpawnFamily(family: OrdinaryTargetFamily, reserved: ReadonlySet<string>): boolean {
    if (this.availableLabels(this.labelsFor(family), reserved).length === 0) return false;
    if (TARGET_FAMILY_RULES[family].stages === 1) return true;
    return this.availableLabels(this.opts.run.shellbackLabels ?? this.opts.run.labels, reserved).length > 0;
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
