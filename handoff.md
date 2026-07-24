# Block Reef: Typing Quest — Agent Handoff

> **Date:** 2026-07-23  
> **Branch:** main  
> **Passing tests:** 92/92 · TypeScript: clean · Production build: verified

---

## What this project is

An original browser typing game for children ages 6–12. Block-world underwater theme: typed word labels appear on Pebble Puffer fish swimming toward a reef; the player types the labels to clear them. **Clean-room rules apply** — no Minecraft, Typer Shark, or any other IP content.

The full spec lives in [`REPLIT_AGENT_SPEC.md`](./REPLIT_AGENT_SPEC.md) (441 lines). Read it before adding missions, word banks, or mechanics — it defines every invariant.

---

## Current completion state

| Task | State |
|------|-------|
| #1 — Setup & review | Merged |
| **#2 — First playable slice (Starter mission)** | **Complete** |
| #3 — Adventure Trail campaign (12 missions, target families, Current Gates) | In progress — automated layout/accessibility complete; manual preview audit remains |
| #4 — Deep Current and Key Camp (the two remaining game modes) | Complete |
| #5 — Verify & publish (quality gates + Autoscale deploy) | In progress — automated gates are clean; manual preview/deployment audit remains |

The playable flow is: **Welcome → keyboard check → difficulty picker → Adventure map → briefing → 3-2-1 countdown → mission → results card.** Regular missions also offer untimed practice and a Build Break after a success; unlocked Current Gates are playable as timed encounters.

---

## Working protocol — required Git checkpoints

The detailed, implementation-ready checkpoint plan is in [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md). Follow it in order.

- **Starter, Standard, and Swift are difficulties**, not the three game modes. The actual v1 game modes are Adventure Trail, Deep Current, and Key Camp.
- Each functional block (A1 through E2) is an explicit commit boundary. Do not begin the next block with uncommitted code from the last one.
- At a checkpoint: run the focused tests named in the plan, run `git diff --check`, inspect `git status`, stage only the intended files, and commit using the plan's message. Run the full test/type-check/build/production-smoke gates at campaign, mode, and release boundaries.
- Never bundle unrelated formatting, generated audio, dependency changes, or deployment settings into a feature checkpoint. Audio generation or Autoscale publishing requires its own explicit scope and verification.

The documentation checkpoint that introduced this protocol is committed as `docs: add implementation checkpoints`.

### Completed implementation checkpoints

- `feat: add campaign mission data and word banks`
- `feat: generalize typing mission engine`
- `feat: add target behaviours and reef shield`
- `feat: add adventure progress and mission state`
- `feat: add adventure map and mission flow`
- `feat: add untimed mission practice`
- `feat: add build break rewards`
- `feat: add current gate encounters`
- `feat: add gate practice and region celebrations`
- `feat: improve campaign accessibility layout`
- `feat: add deep current mode`
- `feat: add key camp tutor`

---

## Architecture at a glance

### Rendering (DOM/CSS, no Canvas)
- Targets are real DOM nodes. A **single `requestAnimationFrame` loop** in `src/components/GameScreen.tsx` writes `transform: translate3d(…px, 0, 0)` via element refs — React never renders per frame.
- React renders are **event-driven only**, triggered by `engine.drainEvents()` when something meaningful changes (completion, heart loss, end, etc.) plus a throttled HUD tick (~4×/s).

### Engine (`src/game/engine.ts`)
Plain TypeScript class — no React, no DOM. Safe to unit-test in Node. Key rules:
- **Only `playing` phase** advances simulation time or accepts typing input (countdown and pause phases do not affect stats).
- Frame delta **clamped to 100 ms**; gaps **> 500 ms** return `"stall"` → GameScreen auto-pauses.
- **First-letter selection**: the first keystroke selects the nearest eligible target (by `x` position, ties broken by spawn time then id). Selection locks until that target is cleared or escapes.
- **Wrong key**: preserves typed progress on the selected target, resets streak to 0.
- **Keystroke beats collision**: `handleKey` is called before `tick` in the same frame; a completed target cannot also cost a heart.
- **One heart per miss** regardless of the frame rate.
- **Starter mode**: never spawns two visible targets with the same first letter. Uses bounded retry with delay rather than looping forever.
- **Timer end (success)**: clears remaining targets without awarding bits or affecting stats.

### Current Gate engine (`src/game/gateEngine.ts`)
- A separate DOM-free deterministic engine for the three timed Current Gate finales.
- It uses labelled foam-cube projectiles and 8/10/12 stability blocks; completing a label settles one block.
- Gates retain the selection lock, nearest-match, pause/stall, heart-loss, and Starter ambiguity protections, but deliberately provide **no Reef Shield**.

### State machine (`src/state/machine.ts`)
Discriminated-union `AppState`, pure `reduce(state, event)` — no side effects. All screen transitions guarded. Key states: `welcome | keyboardCheck | difficulty | briefing | mission{countdown | playing | paused} | results`.

Resume always goes through a `countdown` phase (`resuming: true`) before `playing`.

### Audio (`src/audio/audio.ts`)
- **ElevenLabs files are generated at build time** by `scripts/generate-audio.mjs`. The API key (`ELEVENLABS_API_KEY`) is **only used there** — it is never imported by client code.
- Files live in `src/assets/audio/*.mp3`, discovered via `import.meta.glob` at bundle time.
- **Fallback**: Web Audio API oscillator tones if a file is missing or the browser blocks it.
- Audio initialises only after a user gesture. All failures are silent (try/catch everywhere).

### Persistence (`src/state/storage.ts`, `settings.ts`, `progress.ts`)
- `blockReef.settings.v1` and `blockReef.progress.v1` in localStorage.
- `getStorage()` probes for availability; falls back to an in-memory map if localStorage throws.
- All data is sanitised field-by-field on load — corrupt JSON never crashes the app.

---

## File map

```
src/
  app/
    App.tsx              Root: wires storage/settings/progress/machine; renders all screens
  audio/
    audio.ts             AudioManager singleton; bundled-file glob + tone fallbacks
  assets/audio/          *.mp3 files generated by scripts/generate-audio.mjs (9 effects)
  components/
    ErrorBoundary.tsx    Child-friendly recovery (no stack trace shown)
    Welcome.tsx          Title screen, Play + Settings buttons
    KeyboardCheck.tsx    Press "j" gate; 8 s auto-fallback help
    DifficultyPicker.tsx Starter / Standard / Swift cards
    Briefing.tsx         Lesson preview before countdown
    Countdown.tsx        3-2-1 or "Resuming…" overlay; fires COUNTDOWN_DONE
    GameScreen.tsx       RAF loop, target nodes, HUD, pause/pause-reminder, hint
    GateScreen.tsx       RAF loop and focused Current Gate encounter UI
    GateCelebration.tsx  Short skippable region-build scene after a gate success
    DeepCurrentSetup.tsx Explicit difficulty selection before endless play
    DeepCurrentScreen.tsx RAF-driven endless play, pause, and breather UI
    DeepCurrentResults.tsx Distance and local-best feedback
    KeyCampScreen.tsx    Untimed posture-to-words typing tutor
    KeyboardGuide.tsx    Large highlighted keyboard and illustrated hand guide
    Hud.tsx              Hearts (text + emoji), timer, bits, streak, pause button
    PausePanel.tsx       Resume / Slow Down / Restart / Settings / Leave
    PebblePuffer.tsx     Inline SVG block-fish, 4 colour variants
    ResultsCard.tsx      Accuracy first, then WPM, bits, streak, next/retry buttons
    SettingsPanel.tsx    All accessibility settings + confirm-reset flow
  game/
    config.ts            All tunables: DIFFICULTIES, MOTION_MULTIPLIER, clamps, lane count
    rng.ts               Seedable mulberry32 RNG class
    wordBanks.ts         STARTER_WARMUP_LETTERS, WARMUP_LESSON, validateLetterBank, ALL_LETTERS
    input.ts             classifyKey: filters repeats/IME/modifiers; returns kind+char
    stats.ts             accuracyPct, wordsPerMinute (null → "—" for empty/<10 s), formatStat
    engine.ts            Core simulation; see Architecture section above
    gateEngine.ts        Deterministic Current Gate projectile/stability simulation
    deepCurrentEngine.ts Bounded endless pacing wrapper with 60-second breathers
    keyCampLessons.ts    Ordered posture, letter, and word drill data
    missions.ts          12-mission Adventure Trail topology and unlock definitions
    positioning.ts       Pure measured-width placement helper for both playfields
  state/
    machine.ts           AppState union, initialState, reduce, all event types
    storage.ts           StorageLike interface, readJson/writeJson (corruption-safe)
    settings.ts          Settings type, DEFAULT_SETTINGS, sanitizeSettings, load/save
    progress.ts          Progress type, DEFAULT_PROGRESS, sanitizeProgress, recordMissionResult
  styles/
    styles.css           Full palette, menu cards, buttons, label plates, game screen, HUD,
                         overlays, animations, reduced-motion, text-large, contrast-extra classes
  main.tsx               StrictMode + ErrorBoundary + App
index.html
server/serve.mjs         Static server: 0.0.0.0, $PORT (default 3000), SPA fallback, path-traversal guard
scripts/
  generate-audio.mjs     Build-time ElevenLabs sound-effects generator (--force to regenerate)
tests/
  engine.test.ts         Selection, lock, tie-break, wrong-key, collision, hearts, timing, streaks
  gateEngine.test.ts     Gate stability, projectile cap, no-Shield, and heart-loss rules
  adventureMap.test.tsx     Current Gate practice availability on the map
  gateCelebration.test.tsx  Skippable gate celebration component flow
  liveRegions.test.tsx     Atomic polite announcements for both playfields
  positioning.test.ts       Safe variable-width label placement
  deepCurrentEngine.test.ts Bounded pace tiers, target cap, and breather rules
  keyCampLessons.test.ts   Tutor lesson order and finger-hint data
  keyCampScreen.test.tsx   Semicolon drill and tutor-control interaction
  generator.test.ts      No-same-first-letter, max targets, bounded termination, determinism, spawn rate
  stats.test.ts          Accuracy and WPM edge cases (null, NaN, zero)
  input.test.ts          classifyKey filtering — case, repeats, modifiers, IME, dead keys
  storage.test.ts        Corruption safety, round-trips, sanitize, progress records
  machine.test.ts        Happy path, guards, pause/resume/restart/end transitions
```

---

## How to run

```bash
npm run dev        # dev server on port 5000 (Vite)
npm test           # Vitest (92 tests, ~3 s)
npm run type-check # tsc --noEmit (zero errors expected)
npm run build      # tsc + Vite → dist/
npm start          # serves dist/ on $PORT (default 3000); requires a build first
```

**Regenerate audio** (only needed if prompts change or files are missing):
```bash
node scripts/generate-audio.mjs           # skips existing files
node scripts/generate-audio.mjs --force   # regenerates all
```
`ELEVENLABS_API_KEY` must be set in the environment (Replit Secret). The game works without it — fallback tones cover every effect.

---

## Remaining implementation work

Adventure Trail now has its complete 12-mission data model, unlock/replay persistence, ordinary target families, Reef Shield, map flow, untimed regular and Current Gate practice, Build Break, three timed Current Gate encounters, short skippable region-build scenes, and automated variable-label/live-region coverage. **C2b** remains a release-time manual check:

- Run the manual 200% zoom, small-screen, reduced-motion, keyboard-only, and screen-reader audit in a persistent browser preview. The production server starts here, but this execution environment stops it when the command returns, so no interactive audit was possible.
- Keep the three difficulties distinct from the three game modes. Starter / Standard / Swift remain pacing rules; Adventure Trail / Deep Current / Key Camp are game modes.

The next checkpoint is **E2 — Release hardening**. The automated test/type/build gates are clean; the persistent-browser preview, 200% zoom/reduced-motion/screen-reader matrix, and Autoscale deployment smoke still require an environment that can keep the server running.

The reviewed banks and mission definitions live in `src/game/wordBanks.ts` and `src/game/missions.ts`; do not reintroduce the old letter-only mission model.

---

## Critical invariants — do not break

1. **Stats only from `playing` phase.** Engine `handleKey` and `tick` must only be called while `phase.name === "playing"`.
2. **Accuracy/WPM return `null` (renders as "—") for zero accepted input or sessions < 10 s active.** Never let `NaN` reach the UI.
3. **Starter no-same-first-letter** is enforced in `engine.ts` spawn logic. Do not weaken it for Standard/Swift — the constraint is mode-specific.
4. **Child-safe copy.** No "fail", "wrong", "bad", "loser" anywhere in UI text. Use "Oops", "Try again", "Almost!" etc.
5. **Audio key never in client code.** `ELEVENLABS_API_KEY` only in `scripts/generate-audio.mjs`.
6. **No flashing animations.** Any new animation must be slow/smooth and honour `prefers-reduced-motion` and the `.reduced-feedback` CSS class.
7. **Focus management.** `GameScreen` container must receive focus on `playing` and `countdown` phase entry. Tab must never be trapped anywhere.
8. **Deployment target is Autoscale** (smallest machine, max 1 instance) — not Static. The spec explicitly requires this for Agent apps.

---

## Known non-issues / deliberate decisions

- `nodeRefs` map in `GameScreen` never leaks: ref callback deletes the entry when the node unmounts (`else { nodeRefs.current.delete(t.id) }`).
- Strict Mode double-mount: engine constructor is pure (no listeners, no RAF); cleanup in `useEffect` cancels the RAF before the second mount's effect fires.
- `useMemo` with an intentionally empty dep array for the engine — it is created once per mount (App keys `GameScreen` by `attempt`, so restart always gets a fresh component and engine).
- `engine.setMotion()` is called at the top of the playing `useEffect`, not during pause, so motion changes take effect on the next resume countdown completion.
