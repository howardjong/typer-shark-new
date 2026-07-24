# Block Reef: Typing Quest — v1 Implementation Plan

**Prepared:** 2026-07-23  
**Baseline:** `main` at `ee78f66`; 51/51 tests, `npm run type-check`, production build, and production HTTP smoke test pass. Bundle: 424 KB.

## Scope clarification

The app already has the **first playable slice**: one moving, single-letter Starter mission.

The terms below are deliberately distinct:

- **Difficulty:** Starter, Standard, Swift — pacing, target caps, hearts, travel time, and word-length ceilings.
- **Game mode:** Adventure Trail, Deep Current, Key Camp — the three user-selectable experiences required for complete v1.

This avoids the handoff's ambiguous phrase “three modes.” Task #3 should complete the **12-mission Adventure Trail**; Deep Current and Key Camp remain separate completion slices. No clean-room, learning, accessibility, child-safety, persistence, or Autoscale requirement will be removed.

## Requirement map

| Requirement | Implementation home | Automated verification |
| --- | --- | --- |
| 12-mission, 3-region campaign; branch/rejoin gates; cosmetic rewards | `src/game/missions.ts`, `src/components/AdventureMap.tsx`, `src/components/BuildCelebration.tsx`, `state/progress.ts` | Mission topology, unlock, replay, reward tests |
| Reviewed letter/word banks (40+ entries per word difficulty) | `src/game/wordBanks.ts` | Bank validation: lowercase ASCII, length, duplicate, forbidden entry, first-letter variety |
| Difficulty and readable spawning ceilings | `game/config.ts`, `game/engine.ts`, `game/missionGenerator.ts` | Deterministic spawn, caps, lane/label placement, no-same-first-letter tests |
| Target families, Shellback two-label sequence, Treasure Bubbles | `game/targetTypes.ts`, `engine.ts`, `components/TargetSprite.tsx` | Sequence lock/progress/reservation/reward tests |
| Current Gate finales and untimed practice | `game/gateEngine.ts`, `components/CurrentGate.tsx` | Stability, projectile cap, no Reef Shield, practice rules |
| Reef Shield, Build Bits, streaks, results | `engine.ts`, `Hud.tsx`, `ResultsCard.tsx` | Charge/use/prevented-use/stat invariants |
| Build Break, untimed practice | `game/practiceEngine.ts`, `components/BuildBreak.tsx`, `ResultsCard.tsx` | No progression/heart/permanent-stat side effects |
| Deep Current endless run and personal best | `game/deepCurrentEngine.ts`, `components/DeepCurrent.tsx`, `state/progress.ts` | Bounded escalation, breather, personal-best tests |
| Key Camp tutor | `game/keyCampLessons.ts`, `components/KeyCamp.tsx`, `components/KeyboardGuide.tsx` | Drill order, `;` input, skip/repeat/slow behavior |
| State transitions and keyboard/focus safety | `state/machine.ts`, `app/App.tsx`, `GameScreen.tsx` | Reducer guards, countdown/pause/blur/resize/input tests |
| Settings, reduced motion, screen-reader feedback | `state/settings.ts`, `SettingsPanel.tsx`, `styles.css` | Sanitization and presentation-level tests; manual keyboard/screen-reader checks |
| Local progress/high scores and unavailable-storage fallback | `state/progress.ts`, `state/storage.ts` | Migration, corruption, in-memory fallback, best score/distance tests |
| Original art/audio and child-safe copy | CSS/SVG components; `audio.ts`; `scripts/generate-audio.mjs` only if new effects are needed | Copy review; no external runtime assets or protected branding |
| Autoscale production serving | `server/serve.mjs`, `.replit` | build + HTTP 200/root + hashed asset smoke test; Replit Preview/deploy manual checks |

## Build slices and mandatory Git checkpoints

Every row below is a **functional commit boundary**. Do not start the next row with uncommitted implementation work. At each checkpoint: run the listed focused test(s), inspect `git diff --check` and `git status`, stage only the listed changed files, and create the specified commit. Run the full quality gates at the campaign, mode, and release boundaries.

| Checkpoint | Functional block | Key work | Minimum verification | Commit message | Status |
| --- | --- | --- | --- | --- | --- |
| A1 | Campaign data and banks | Add mission/region/run types; define the 12-mission branch/rejoin topology; add reviewed banks and reusable validation. | New mission topology and bank-validator tests. | `feat: add campaign mission data and word banks` | Complete |
| A2 | Generalized ordinary-target engine | Replace letter-only `EngineOptions` with a deterministic lesson/run definition; preserve selection, timing, collision, stall, caps, and ambiguity rules. | Existing engine/generator tests plus generalized spawn tests. | `feat: generalize typing mission engine` | Complete |
| A3 | Target behaviours and Reef Shield | Add family data, two-stage Shellback flow, hidden-label reservation, Treasure Bubble policy, and the fully constrained Reef Shield. | Target-sequence, ambiguity, Shield, and statistics tests. | `feat: add target behaviours and reef shield` | Complete |
| B1 | Adventure state and persistence | Add map/mission-selection state, selected run policy, progression migration, route unlocks, replayability, and build-piece persistence. | Reducer and progress migration/unlock tests. | `feat: add adventure progress and mission state` | Complete |
| B2 | Adventure map and regular mission UI | Build the map, mission briefing, data-driven `GameScreen`, creature variants, results actions, and defeat choices. | Component/state tests; keyboard-only manual pass. | `feat: add adventure map and mission flow` | Complete |
| B3 | Practice and Build Break | Add untimed practice, stationary Build Break, and cosmetic build rewards. Region celebrations are deliberately split into C1b so this remains an independently usable checkpoint. | Practice/Build Break side-effect tests. | `feat: add practice and build rewards` | Complete |
| C1a | Timed Current Gate encounters | Add all three gate definitions and the dedicated gate run engine/UI; unlock the next region only on gate completion. | Gate stability, cap, unlock, and no-Shield tests. | `feat: add current gate encounters` | Complete |
| C1b | Gate practice and region celebrations | Add stationary, non-persistent gate practice and short skippable region build celebrations. | Gate-practice side-effect and celebration-flow tests. | `feat: add gate practice and region celebrations` | Next |
| C2 | Campaign accessibility and visual completion | Finish measured label placement, responsive variants, safe CSS/SVG art, live messages, and reduced-motion behaviour for Adventure Trail. | Presentation checks plus 200% zoom and reduced-motion manual pass. | `feat: polish accessible adventure campaign` | Pending |
| D1 | Deep Current | Add the post-four-mission unlock, bounded endless escalation, 60-second breather, and local distance best. | Deep Current bounds, breather, and persistence tests. | `feat: add deep current mode` | Pending |
| E1 | Key Camp | Add posture/finger/letter/word drills, keyboard/hands guide, repeat/skip/slow controls, and `;` acceptance only in this mode. | Lesson sequence and input-policy tests; keyboard-only manual pass. | `feat: add key camp tutor` | Pending |
| E2 | Release hardening | Complete cross-mode accessibility and failure-path checks, production smoke tooling, and deployment-readiness documentation. | Full `npm test`, `npm run type-check`, `npm run build`, production smoke, and required manual matrix. | `chore: complete v1 release checks` | Pending |

### Checkpoint details

#### A1 — campaign data and banks

Define exactly 12 missions: each region has a first regular mission, two parallel regular missions, and a Current Gate. Either branch unlocks the gate while the other remains replayable. Replace letter-only validation with reusable validation and add reviewed CVC, sight, familiar Standard, and challenge Swift banks with at least 40 appropriate entries in every word difficulty.

#### A2–A3 — generalized rules, target types, and Shield

Keep the engine DOM-free. Extend it with target-family behaviour, two-stage Shellback sequencing, hidden-second-label ambiguity reservation, and a Reef Shield that charges after 10 ordinary completions. `Enter` works only when charged and active, never clears a gate, and never grants score, accuracy, or streak credit.

#### B1–C2 — complete Adventure Trail

Add map/progress state, then mission UI and results, followed by practice and Build Break. Timed Current Gates use 8/10/12 stability blocks with one-letter, 2–3 letter, and 3–5 letter projectiles; the next checkpoint adds their stationary, non-persistent practice and short region celebrations. Finish the campaign's measured label placement and accessibility polish before considering Adventure Trail complete.

#### D1–E2 — remaining complete-v1 modes and hardening

Deep Current unlocks after four Adventure Trail missions and uses bounded escalation with a Continue/Finish breather every 60 active seconds. Key Camp is an untimed guided home-row-to-word tutor. The final checkpoint runs the full manual/browser/deployment matrix; Autoscale configuration remains a proposed, explicit publishing decision.

## Invariants to preserve while extending

- Only active `playing` time moves targets, accepts typeable characters, changes accuracy/WPM, or consumes mission time.
- The first matching keystroke both selects and advances the nearest eligible target; selection remains locked.
- A final correct keystroke wins over a same-frame collision.
- Starter (and user-enabled) no-same-first-letter protection delays generation rather than creating ambiguity or looping forever.
- Pauses, blur, hidden tabs, resize, and >500 ms frame stalls are safe and require explicit countdown resume.
- Empty/short sessions render WPM and accuracy as `—`, never `NaN`.
- Text targets remain high-contrast real DOM text, unobscured by the HUD; every new effect honours reduced motion.
- No external runtime request, personal data, third-party API, copyrighted game asset/name, or client-side secret is introduced.

## Risks and decisions already accounted for

- **Campaign topology:** 12 = 3 regions × (first regular + two branches + gate). A celebration is not a thirteenth mission.
- **Readability is harder than engine logic:** the current lane-only placement is adequate for one-letter labels but must become measured label-bound placement before variable-length word targets ship.
- **Progress compatibility:** retain `blockReef.progress.v1`, extend it with safe field-level defaults, and preserve existing warm-up completion rather than silently resetting it.
- **Practice is a separate run policy, not a regular mission with a hidden timer:** it must not award permanent rewards/statistics/unlocks or expose hearts.
- **Audio:** current generated effects cover the existing loop. New narration is optional; missing files must always fall back silently, so no ElevenLabs key is required to play.
- **No new dependency is planned.** DOM/CSS/SVG and the existing deterministic TypeScript core are sufficient and keep the bundle compact.

## Quality-gate commands

```bash
npm test
npm run type-check
npm run build
npm start
```

Production smoke test after `npm run build` (run in another terminal while `npm start` is serving):

```bash
curl -fsSI --max-time 5 http://127.0.0.1:3000/
curl -fsS --max-time 5 http://127.0.0.1:3000/
```

For local Preview, use `npm run dev` (Vite port 5000). Before publishing, manually test keyboard-only play and the required browser/zoom/accessibility matrix in Preview. For deployment, use Replit **Autoscale**, smallest practical machine, maximum one instance; then repeat the production smoke test against the published URL and verify one hashed JS/CSS asset loads in a clean browser profile.

## Proposed deviations

None. Work will be staged to keep the current playable slice stable, but complete v1 remains the stated target.
