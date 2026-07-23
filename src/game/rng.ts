/**
 * Seedable deterministic RNG (mulberry32). Core spawn/selection rules must
 * use an injected instance of this — never Math.random() — so tests and bug
 * reproductions are repeatable.
 */
export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Random element of a non-empty array. */
  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }
}
