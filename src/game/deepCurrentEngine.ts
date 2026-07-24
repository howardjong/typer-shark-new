import { DifficultyConfig, DifficultyId, MotionId } from "./config";
import { Engine, EngineEvent, EngineSnapshot, MissionOutcome, MissionRunDefinition, TargetState } from "./engine";
import { HOME_ROW_LETTERS, STANDARD_FAMILIAR_WORDS, STARTER_CVC_WORDS, SWIFT_CHALLENGE_WORDS } from "./wordBanks";

export const DEEP_CURRENT_BREATHER_MS = 60_000;
const DEEP_CURRENT_TIER_MS = 30_000;

export interface DeepCurrentPace {
  tier: number;
  labels: readonly string[];
  /** Never lower than the selected difficulty's readability floor. */
  minSpawnIntervalMs: number;
}

/** Bounded, transparent escalation: longer labels first, then a gentler interval reduction. */
export function deepCurrentPace(difficulty: DifficultyConfig, activeMs: number): DeepCurrentPace {
  const tier = Math.max(0, Math.floor(activeMs / DEEP_CURRENT_TIER_MS));
  const labels = labelsFor(difficulty.id, tier);
  const startingInterval = Math.round(difficulty.minSpawnIntervalMs * 1.5);
  const minSpawnIntervalMs = Math.max(
    difficulty.minSpawnIntervalMs,
    startingInterval - tier * Math.round(difficulty.minSpawnIntervalMs * 0.12),
  );
  return { tier, labels, minSpawnIntervalMs };
}

function labelsFor(difficulty: DifficultyId, tier: number): readonly string[] {
  if (difficulty === "starter") return tier === 0 ? HOME_ROW_LETTERS : STARTER_CVC_WORDS;
  if (difficulty === "standard") {
    const maxLength = Math.min(5, 3 + tier);
    return STANDARD_FAMILIAR_WORDS.filter((word) => word.length <= maxLength);
  }
  const maxLength = Math.min(7, 4 + tier);
  return SWIFT_CHALLENGE_WORDS.filter((word) => word.length <= maxLength);
}

export type DeepCurrentEvent = EngineEvent | { type: "breather"; distance: number };

export interface DeepCurrentSnapshot extends EngineSnapshot {
  distance: number;
  tier: number;
}

interface DeepCurrentOptions {
  difficulty: DifficultyConfig;
  motion: MotionId;
  seed: number;
  /** Test-only override; production uses the required 60 seconds. */
  breatherEveryMs?: number;
}

/**
 * Endless mode built on the normal deterministic typing rules. It changes
 * only the run pacing; caps, collisions, selection, pause safety, and Reef
 * Shield behavior stay in the tested base engine.
 */
export class DeepCurrentEngine {
  readonly engine: Engine;
  private readonly baseDifficulty: DifficultyConfig;
  private readonly liveDifficulty: DifficultyConfig;
  private readonly run: MissionRunDefinition;
  private readonly breatherEveryMs: number;
  private nextBreatherAtMs: number;
  private events: DeepCurrentEvent[] = [];

  constructor(options: DeepCurrentOptions) {
    this.baseDifficulty = { ...options.difficulty };
    const pace = deepCurrentPace(this.baseDifficulty, 0);
    this.liveDifficulty = { ...this.baseDifficulty, minSpawnIntervalMs: pace.minSpawnIntervalMs };
    this.run = {
      id: "deep-current",
      labels: pace.labels,
      targetFamilies: ["pebble-puffer", "tile-ray", "prism-eel", "treasure-bubble"],
      shellbackLabels: pace.labels,
      bonusLabels: STARTER_CVC_WORDS,
    };
    this.engine = new Engine({
      difficulty: this.liveDifficulty,
      motion: options.motion,
      run: this.run,
      seed: options.seed,
      // An endless run never reaches the ordinary mission timer.
      durationMs: Number.MAX_SAFE_INTEGER,
    });
    this.breatherEveryMs = options.breatherEveryMs ?? DEEP_CURRENT_BREATHER_MS;
    this.nextBreatherAtMs = this.breatherEveryMs;
  }

  get targets(): TargetState[] { return this.engine.targets; }
  get selectedId(): number | null { return this.engine.selectedId; }
  get activeMs(): number { return this.engine.activeMs; }
  get ended(): MissionOutcome | null { return this.engine.ended; }

  setMotion(motion: MotionId): void { this.engine.setMotion(motion); }
  handleKey(char: string): void { this.engine.handleKey(char); }
  activateReefShield(): boolean { return this.engine.activateReefShield(); }

  tick(rawDtMs: number): "ok" | "stall" | "breather" {
    this.applyPace();
    const result = this.engine.tick(rawDtMs);
    for (const event of this.engine.drainEvents()) this.events.push(event);
    if (result === "stall") return "stall";
    if (!this.engine.ended && this.engine.activeMs >= this.nextBreatherAtMs) {
      this.nextBreatherAtMs += this.breatherEveryMs;
      this.events.push({ type: "breather", distance: this.distance() });
      return "breather";
    }
    return "ok";
  }

  drainEvents(): DeepCurrentEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  distance(): number {
    return Math.floor(this.engine.activeMs / 1000);
  }

  snapshot(): DeepCurrentSnapshot {
    return { ...this.engine.snapshot(), timeLeftMs: 0, distance: this.distance(), tier: deepCurrentPace(this.baseDifficulty, this.engine.activeMs).tier };
  }

  private applyPace(): void {
    const pace = deepCurrentPace(this.baseDifficulty, this.engine.activeMs);
    this.liveDifficulty.minSpawnIntervalMs = pace.minSpawnIntervalMs;
    this.run.labels = pace.labels;
    this.run.shellbackLabels = pace.labels;
  }
}
