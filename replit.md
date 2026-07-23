# Block Reef: Typing Quest

## Overview
An original, child-friendly (ages 6–12) browser typing game with a block-world underwater theme. All game logic runs client-side; no accounts, no backend API, no telemetry. Built from the specification in `REPLIT_AGENT_SPEC.md`.

## Current state
First playable slice complete: Welcome → keyboard check → difficulty picker → briefing → countdown → Starter mission (one-letter Pebble Puffer targets) → results card. Settings and progress persist in localStorage with safe fallbacks.

## Stack & architecture
- React 19 + TypeScript (strict) + Vite; DOM/CSS-first rendering (no Canvas)
- Dependency-free discriminated-union state machine: `src/state/machine.ts`
- Simulation engine (plain TS, no React/DOM): `src/game/engine.ts` — deterministic, seeded RNG (`src/game/rng.ts`), all tunables in `src/game/config.ts`
- Movement driven by one `requestAnimationFrame` loop in `src/components/GameScreen.tsx`; React renders event-driven, positions applied via `transform` on refs
- Audio: Web Audio API tones now; ElevenLabs-generated bundled files drop into `src/assets/audio/<effect>.mp3` and are picked up automatically (`src/audio/audio.ts`)
- Persistence: versioned localStorage keys `blockReef.settings.v1` / `blockReef.progress.v1`, corruption-safe (`src/state/storage.ts`)
- Tests: Vitest, `tests/` (engine rules, generator, stats, input filtering, storage, machine)

## How to run
- Dev: workflow "Start application" (`npm run dev`, port 5000)
- Tests: `npm test` · Type check: `npm run type-check`
- Production: `npm run build` then `npm start` (serves `dist/` on `0.0.0.0:$PORT`, default 3000, via `server/serve.mjs`)
- Deployment target: Autoscale (smallest machine, max 1 instance) — spec forbids Static for Agent apps

## Key invariants (from spec — do not break)
- Only the `playing` phase advances simulation time or accepts typing input
- Keys are filtered by `src/game/input.ts` (repeats/modifiers/IME never count)
- Frame delta clamped to 100 ms; >500 ms gap auto-pauses (never teleport targets)
- Starter never shows two labels with the same first letter
- Accuracy/WPM show "—" instead of NaN/100% for empty or <10 s sessions
- Child-facing copy never says "fail" or "wrong"; no flashing effects
- Audio only after user gesture; all audio failures silent

## User preferences
- Audio assets generated with ElevenLabs at build time (key via Replit Secrets, `ELEVENLABS_API_KEY`); never shipped to or called from the browser
