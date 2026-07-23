# Block Reef: Typing Quest — Replit Agent Build Specification

## Read this first

Build a polished, desktop-first, single-player browser typing game for children ages 6–12. It should capture the *learning loop* of an arcade typing game—spot a moving target, read its letter or word, type accurately, and receive immediate feedback—while being an original game.

Working title: **Block Reef: Typing Quest**. The title can be changed later, but do not call the app "Typer Shark," "Minecraft," or a variation of either.

The game will be built and deployed on Replit. Deliver a self-contained game whose application logic runs entirely in the browser and works without a login, database, application API, user-provided secrets, multiplayer, ads, or telemetry. A minimal production server may exist only to serve the built files when required by Replit publishing.

### Replit Agent planning contract

Before changing code, Replit Agent must read this entire file and produce a concise implementation plan that:

1. maps every v1 requirement to a component, data file, or test;
2. identifies assumptions, browser risks, asset dependencies, and accessibility checks;
3. separates the first playable slice from the complete v1 release;
4. names the exact build, test, Preview, and Autoscale Deployment verification commands;
5. calls out any proposed deviation from this specification before implementing it.

Do not silently remove a learning, accessibility, child-safety, clean-room, or deployment requirement to make the build easier. When artwork or audio is unavailable, continue with original procedural placeholders and silent fallbacks. Prefer a small working implementation over a new framework or unnecessary backend.

### Scope boundaries

**First playable slice:** one polished Starter mission, one target family, pause/resume, forgiving input, results, settings, and local persistence.

**Complete v1:** the three modes, twelve campaign missions, three original region-finale encounters, local statistics, accessibility settings, original visual/audio polish, tests, and a verified Replit Autoscale Deployment.

Out of scope for v1: accounts, cloud saves, global leaderboards, multiplayer, chat, user-generated content, purchases, ads, analytics, mobile typing controls, localization, and any application backend, API, database, or server-side game logic. A thin static-file server used only as the Autoscale hosting shell is allowed.

## Product goal

Make practice feel like a short block-world adventure, not a test. A child should be able to:

1. understand what to type within five seconds of starting;
2. play a gentle first round using only home-row letters or short familiar words;
3. choose an appropriate challenge level without an adult configuring anything;
4. see improvement through accuracy, words per minute, and completed lessons;
5. pause, slow down, or practise without a timer whenever they need to.

The core promise is: **"Type the labels to protect the reef and collect building blocks."**

## Non-negotiable clean-room and brand rules

Use a bright, original **block-world / voxel-adventure** art direction: chunky geometric terrain, block-built coral, cube-like fish, tiled sand, caves, crystals, and construction rewards. This is a visual genre reference only.

Do not use Minecraft or Typer Shark names, logos, characters, sounds, music, fonts, textures, UI layouts, enemy names, story, maps, screenshots, copied word lists, or other game assets. Do not use Creepers, Steve, Endermen, Minecoins, or recognisable Minecraft block textures. Do not reproduce the original Typer Shark diver, sharks, zapper, bosses, map, terminology, or soundtrack.

All art must be original: use CSS, SVG, Canvas drawing, generated simple geometry, or properly licensed original assets. Use original creature and location names defined in this spec.

## Audience and device assumptions

- Primary audience: children aged 6–12 who are learning keyboard confidence and early typing fluency.
- Primary device: laptop or desktop with a physical keyboard; mouse/touch is used for menus only.
- Support current Chrome, Edge, Safari, and Firefox at 1024 px wide and above. Make the menu usable on smaller screens, but clearly explain that a physical keyboard is required to play.
- Language: English only for v1.
- Session length: 3–10 minutes by default. No account and no personal data collection.

## Learning objectives

The game must explicitly reinforce these skills, in this order:

1. Identify and press a requested letter.
2. Use home-row hand placement and recognise the next key.
3. Type short phonetic/common words accurately from left to right.
4. Maintain accuracy while choosing among several visible targets.
5. Build speed gradually without rewarding careless key mashing.

Show progress in child-friendly language. Say "Great accuracy!" and "Try that word again"; never say "fail," "wrong," or use red error screens.

## Functional parity target

Recreate the useful *functions* of a classic arcade typing tutor through original expression. The complete v1 must include:

- a map-based campaign with a small path choice and escalating target types;
- letter targets, word targets, and targets that require two short words in sequence;
- a short optional post-mission word rush for bonus Build Bits;
- an emergency screen-clear ability earned through accurate typing;
- original region-finale encounters where typing redirects labelled projectiles;
- an endless mode with increasing but bounded challenge;
- an untimed guided keyboard tutor;
- local high scores and learning statistics.

These are mechanical goals, not permission to copy any original game’s presentation, values, names, content, or assets.

## Game fantasy and visual direction

### World

The player is a young **Reef Builder** protecting a friendly underwater block settlement called **Pebble Bay**. Mischievous creatures drift toward the settlement carrying floating rune labels. Correct typing gently sends them back into the current and earns **Build Bits**.

Three original regions form the first campaign:

- **Sunlit Shelf** — warm sand blocks, clear water, simple letters and short words.
- **Kelp Cubes** — green blocky plants, two-step targets, slightly longer words.
- **Crystal Current** — blue-purple caves, mixed target types, careful accuracy practice.

Use an original palette: deep navy water, teal, coral orange, sandstone, moss green, violet crystals, and warm gold rewards. The environment can be pixelated or voxel-like, but instructional text must remain clean and smooth.

### Legibility over decoration

- Use a friendly, highly legible sans-serif for every letter, word, number, button, and instruction. Do **not** use a pixel font for text the child must read or type.
- Decorative display lettering is allowed only for the logo, and never for the active target word.
- Prefer real HTML text in a DOM overlay for every active target label. If Canvas text is used, mirror the full label and typed state in accessible DOM text. Never bake typeable text into an image or texture.
- Put each target word on an opaque or nearly opaque dark rounded label plate with a strong outline. Never place typeable text directly over a detailed moving background.
- Default active-target text: at least 30 CSS px on desktop; allow a Large Text setting of at least 38 CSS px. Instructions and buttons must be at least 18 CSS px.
- Meet at least 4.5:1 text contrast everywhere; aim for 7:1 for target words. Never make colour the only way to understand state.
- Highlight the next required character with an underline and a non-colour cue such as a caret, border, or gentle scale change. Already typed characters change to a second high-contrast state.

## Core gameplay

### The play field

The screen is a 16:9 block-world scene. Friendly targets enter from the right and travel toward Pebble Bay on the left. Each has a word or letter label above it. A target reaching the settlement removes one shield heart. The first two missions use three shield hearts and a very slow pace.

The target label is the source of truth. The game must never require a child to infer a word from artwork, sound, colour, or a small icon.

Keep labels inside the safe play area and prevent labels from overlapping. A label must never be clipped, truncated, scaled below 24 CSS px, or covered by the HUD. If a word cannot fit, do not spawn it. Cap simultaneous visible targets by difficulty and delay a spawn rather than create an unreadable layout.

### Input and target selection

1. While no target is selected, the first typed character selects the eligible target closest to Pebble Bay whose label begins with that character **and counts as the first correctly typed character**. Break an exact distance tie by earlier spawn time, then stable target ID, so selection is deterministic. Do not require the child to type that letter twice.
2. Add a thick, animated but non-flashing **focus frame** around the selected target and its label.
3. Each correct key advances the visible character progress immediately.
4. Completing a label resolves the target with a soft block-burst, a small score pop, and an optional sound.
5. If no visible label begins with the key, show a brief neutral "Try a label that starts with…" hint only in Starter mode. Do not subtract a life.
6. If a selected word receives a wrong key, shake the label less than 4 px once, play an optional soft cue, preserve the typed progress, and show the expected next letter. Do not erase correctly entered letters.
7. Once selected, a target remains locked until completed or missed; another target moving closer must not steal focus. Pausing must preserve the selection and typed progress.
8. `Escape` pauses the game. `Enter` or `Space` resumes from the pause dialog. Resume with a visible three-second countdown. Never make the child use a mouse during active play.

Avoid ambiguous selection: the mission generator must not show two targets that begin with the same letter in Starter mode. In higher difficulty, permit overlap only after the child has seen an explanation and can turn "No same first letter" back on in Settings.

If a correct final keystroke and a target collision occur in the same update, resolve the keystroke first so the child receives the completion. In Starter mode, multiply the currently selected target's movement speed by `0.75` while it is being typed; do not stop it entirely.

### Keyboard event rules and gotchas

- Give the gameplay surface an explicit focus target (`tabIndex="0"` or equivalent), focus it after Start and after the resume countdown, and listen to `keydown` only while gameplay or a tutor drill owns focus. Menus and results must not feed keys into the game.
- Match printable input using `KeyboardEvent.key`, lowercased, so Caps Lock and Shift do not cause false mistakes. Adventure Trail and Deep Current accept `a`–`z`; Key Camp additionally accepts `;` for the home row. v1 assumes an English QWERTY keyboard.
- Ignore `event.repeat`, modifier-only keys, function keys, browser shortcuts using Control/Command/Alt, `event.isComposing`, and composition/dead-key events. Never count them as attempts.
- Never reserve an alphabetic key for an ability because it may be the first letter of a target. Use `Enter` for Reef Shield only when it is fully charged and gameplay is active.
- Prevent the browser’s default Space/arrow scrolling only when those keys are handled by the game. Do not globally trap browser shortcuts or `Tab`.
- Auto-pause on window blur, tab visibility change, resize/orientation change, or loss of the game surface. Resume only by explicit action and a countdown.
- Install each event listener and animation loop exactly once, and remove it on unmount. Account for React Strict Mode mounting effects twice in development.
- If a selected target reaches the base, remove it once, subtract one heart once, clear the selection, and discard its partial progress without treating the cleanup as another typing mistake.

### Target families

Use original geometric sea creatures, not sharks or copied enemy behaviors.

| Family | Visual | Typing behaviour | First appearance |
| --- | --- | --- | --- |
| Pebble Puffer | small round block fish | one letter | Starter lessons |
| Tile Ray | flat tiled fish | one short word | Sunlit Shelf |
| Shellback | block turtle | two short words in sequence | Kelp Cubes |
| Prism Eel | segmented crystal eel | one word; its background pattern changes, never the word | Crystal Current |
| Spark School | three tiny cubes | one letter at a time, spaced apart | accuracy lessons |
| Treasure Bubble | harmless golden cube bubble | optional three-letter bonus word | all regions |

Do not introduce phrases, punctuation-based targets, backwards text, gibberish, or targets whose visible letters mutate in v1. Shellback’s two stages must be presented as two separate short labels, never as a phrase. The game should reward reading accuracy before complexity.

For a Shellback, completing the first label keeps the same target selected, shows a clear "Next word" transition that does not move or obscure the second label, and starts the second label at zero typed characters. The first character of the second label is an ordinary correct keystroke; no extra selection keystroke is required. A Shellback counts as one completed target only after both labels are complete.

### Region-finale encounters

The fourth mission in each region is an original **Current Gate** encounter. A large block-built gate launches slow foam cubes carrying letters or short words. Typing a projectile’s label redirects it into the gate and removes one stability block. The gate cannot directly attack and has no copied character design.

- Sunlit Gate: one-letter projectiles and 8 stability blocks.
- Kelp Gate: 2–3 letter projectiles and 10 stability blocks.
- Crystal Gate: 3–5 letter projectiles and 12 stability blocks.
- Show a labelled progress bar, keep at most three projectiles visible, and provide an untimed Practise version.
- Missing a projectile removes one heart; completing the gate always unlocks the next region.

### Rewards, health, and feedback

- Each cleared target earns Build Bits, displayed as a small total only after the immediate typing feedback is readable.
- Score is secondary to accuracy. The end-of-round card leads with **Accuracy**, then **Words per minute**, **Words cleared**, **Best streak**, and **Build Bits**.
- Award a streak badge every five consecutive correct target completions, but reset only the streak on a mistake—not the child’s level progress.
- Give a gentle "Reef Shield" clear after 10 ordinary target completions. It clears ordinary on-screen targets only, has a labelled button and uses `Enter` when fully charged. It is never required to succeed, never activates from an alphabetic key, does not clear a Current Gate, and awards no accuracy or streak credit for cleared labels. Pressing `Enter` before it is ready is ignored.
- Reef Shield charge starts at zero for each mission, does not carry between missions, and returns to zero after use. Shellback counts as one ordinary completion only after both words. Treasure Bubbles, gate projectiles, Build Break, and Practise do not charge it. If no clearable ordinary target is visible, `Enter` preserves the full charge instead of wasting it.
- Hearts are visible, labelled with text for screen-reader context, and never blink rapidly.
- A completed mission cannot be lost permanently. On zero hearts, show "Let’s try that path again" with Restart, Practise, and Return to Map choices.

Calculate learning statistics consistently:

- **Accuracy** = correct gameplay keystrokes / all accepted gameplay keystrokes × 100. Accepted gameplay keystrokes are printable character attempts made during active play, including a key that matches no target or the wrong next character. Ability keys, menu keys, repeats, modifiers, composition events, and ignored input are excluded. If no accepted keys exist, display `—`, not `NaN` or 100%.
- **WPM** = (correct characters / 5) / active gameplay minutes. Exclude menus, countdowns, pauses, hidden-tab time, results, and loading. For sessions shorter than 10 active seconds, display `—` to avoid misleading spikes.
- A mistake resets the current streak once; ignored keys and browser shortcuts do not affect statistics.

## Modes

### 1. Adventure Trail (primary mode)

A simple map of the three regions above. Start with one unlocked mission: **Warm-Up: Find the First Letter**. Each region contains three regular missions, one Current Gate finale, and a celebratory build scene. After the first mission in each region, offer two short route choices that rejoin at the finale. Both routes remain replayable; choosing one must not permanently hide content.

- Mission length: 60–120 seconds for Starter; 90–180 seconds for Standard.
- A regular mission succeeds when its configured active-play timer reaches zero with at least one heart remaining. Stop spawning at zero, resolve the state transition once, and remove remaining ordinary targets without adding keystrokes, streak, score, or Build Bits. Reaching zero hearts first ends the attempt and does not unlock content. Pauses, countdowns, hidden-tab time, settings, and results never reduce the timer.
- A mission has a clear lesson label, for example: "Today: letters A, S, D, F" or "Today: short words with A."
- Between missions, award a non-random building piece and visibly add it to the Pebble Bay settlement. This is cosmetic only.
- Completing a mission unlocks the next one regardless of score. A star rating can reflect accuracy, but must not block progression.
- Each mission has a **Practise without timer** button.
- After a regular mission, offer an optional **Build Break**: a 30-second stationary-label word rush with adjustable timing and no hearts. Mistakes reduce only the potential bonus, never campaign progress. The child can skip it.

Each region's map topology is exactly: first regular mission → either of two parallel regular missions → Current Gate. Completing the first mission unlocks both branches. Completing either branch unlocks the gate; the other branch remains visible, unlocked, and independently completable. The build celebration is a short skippable scene, not a thirteenth mission.

**Untimed Practise contract:** Practise uses the selected lesson's real word bank but shows one stationary target at a time, has no countdown clock, hearts, score, unlocks, stars, rewards, or permanent statistics, and waits for the child before showing the next target. Pause, settings, restart, and exit remain available. The results view reports session accuracy and WPM only as private immediate feedback and offers Repeat or Return. Current Gate Practise follows the same rule with one stationary projectile at a time.

### 2. Deep Current (endless optional challenge)

An endless, increasingly busy run for children who have completed at least four Adventure Trail missions. It uses the same clear label system, shows a distance counter, and saves a local personal best. It must offer Starter, Standard, and Swift speeds before play. Increase challenge in small steps by choosing slightly longer words and shorter spawn intervals, but never exceed the selected mode’s visible-target cap or minimum readability timing. Every 60 seconds, hold spawning for a five-second breather and offer Continue or Finish.

### 3. Key Camp (guided tutor)

An untimed teaching mode with a large on-screen keyboard and simple illustrated hands. It must teach:

- home-row posture (`A S D F` and `J K L ;`);
- which finger to try for the highlighted key;
- letter drills before words;
- short word drills with accuracy feedback.

The child can repeat, skip, or slow any lesson. The keyboard/hands are instructional aids, not a substitute for the active word label.

## Difficulty, pacing, and word content

### Starting choice

On first launch, ask: **"Which feels best today?"**

- **Starter** — one letter or 2–3 letter words, one spawn every 4.5 seconds or slower, at most 3 visible targets, no same-first-letter ambiguity, no loss on a mistyped key, 3 hearts.
- **Standard** — familiar 3–5 letter words, one spawn every 3 seconds or slower, at most 4 visible targets, 3 hearts.
- **Swift** — familiar 4–7 letter words, one spawn every 2 seconds or slower, at most 5 visible targets, 2 hearts, intended for confident typists.

These are hard ceilings, not required steady rates. The generator may wait longer after a difficult word, when the screen is crowded, or when it cannot place a readable label. Make the choice changeable from pause/settings at all times. Also offer `Slow`, `Normal`, and `Fast` motion speed. Slow must reduce both movement and spawn rate; it must not shrink labels or hide feedback. Do not implement hidden adaptive difficulty in v1.

Difficulty/word-level changes made during pause apply on Restart or the next mission, never halfway through a live word set. Motion speed changes apply after the resume countdown to existing and future targets without moving their current positions. Text size, contrast, sound, captions, and reduced-motion settings apply immediately. Enabling no-same-first-letter mode during a round prevents new conflicts but does not delete already visible targets.

At Normal motion, a newly spawned ordinary target should take approximately 15 seconds to cross the safe play area in Starter, 12 seconds in Standard, and 10 seconds in Swift. Slow multiplies travel time and spawn intervals by 1.35; Fast multiplies them by 0.85. Store these values in configuration, tune them through child playtesting, and retain the hard visible-target caps.

### Word-bank rules

- Store word banks as simple reviewed TypeScript/JSON data grouped by lesson and difficulty. Keep the word content easy to replace.
- Starter words: letters, CVC words, common familiar words, and names of harmless world objects; examples: `cat`, `sun`, `map`, `fish`, `sand`, `gem`.
- Standard words: 3–5 letter familiar words; examples: `coral`, `block`, `shell`, `build`, `stone`.
- Swift words: 4–7 letter familiar words; examples: `crystal`, `current`, `treasure`.
- Use lowercase display and accept case-insensitive input. Do not use punctuation, numbers, profanity, slang, proper names, frightening words, or words with irregular spellings in Starter.
- Never use the word bank from Typer Shark or any other commercial game.
- Provide at least 40 reviewed entries for each word difficulty plus the required single-letter drills. Validate banks at build/test time for duplicate entries, lowercase ASCII, allowed length, forbidden punctuation, empty values, and enough first-letter variety for the no-ambiguity generator.
- When no-same-first-letter mode is active, treat the normalized first character of every unresolved current label as reserved. For a two-stage Shellback, reserve the first character of its hidden second label as well so revealing it cannot create a new ambiguity.

## Screens and UX copy

### Required screens

1. **Welcome / profile-free start** — Play, Key Camp, Settings; explain "Use a keyboard to type the labels."
2. **Keyboard check** — one friendly prompt to press a shown letter; if no usable input is detected, explain that a physical keyboard is needed and keep menus available.
3. **Difficulty picker** — the three choices above with plain-language descriptions.
4. **Adventure map** — obvious unlocked next mission, progress markers, and a Practise button.
5. **Mission briefing** — one sentence, one illustrated example, Start button, and keyboard reminder.
6. **Gameplay HUD** — pause, hearts, optional Reef Shield charge, target area, and compact score. No cluttered inventory bar.
7. **Pause panel** — Resume, Slow Down, Restart, Settings, Leave Mission.
8. **Results card** — celebratory but calm, plain-language feedback, next action.
9. **Settings** — changes persist locally.
10. **Recovery message** — a child-friendly fallback when storage, audio, or an asset is unavailable; always provide a playable or restart path.

### Required settings

- text size: Default / Large;
- contrast: Standard / Extra Contrast;
- motion: Slow / Normal / Fast;
- sound effects, music, and master volume separately;
- visual feedback: Normal / Reduced; sound captions on/off;
- no-same-first-letter mode;
- pause reminder after a configurable number of minutes;
- reset local progress, with a confirmation dialog.

Pause reminder choices are Off, 5, 10, or 15 active-play minutes, with 10 minutes as the default. Only active gameplay time counts; showing the reminder pauses the game and does not interrupt a word with lost progress.

## Accessibility and child-safety requirements

These are release criteria, not polish work:

- Full keyboard operation for every gameplay-critical action; visible focus state for every menu control.
- Persistent Pause button and `Escape` support. Every timed mission has an untimed practise alternative and a speed setting before play.
- No flashing/strobing, rapid red screen effects, camera shake, sudden loud sounds, autoplay audio, or visual effects that obscure target labels. Default music and effects volume should be modest.
- Sound must never be required; captions such as `[soft chime]` or `[shield ready]` can describe useful sounds when captions are enabled.
- Use colour plus shape/text for status. Hearts, selected target, correct key, and warning states need non-colour cues.
- Store preferences and progress only in browser `localStorage`. Do not ask a child for name, email, age, microphone, camera, location, or any other personal information.
- Make all explanatory UI readable by screen readers. Provide concise ARIA labels for buttons and a polite live region for game events; do not announce every animation frame.
- Respect `prefers-reduced-motion`; simplify motion and disable decorative particles when it is set.
- Never show outbound links, social sharing, chat, ads, purchases, or an open text field. "Builder" is the fixed local player label in v1.

## Technical implementation constraints

### Replit deployment

- Build a client-only React + TypeScript + Vite game unless a simpler approach is demonstrably better.
- Current Replit documentation states that apps created with Replit Agent are not compatible with Static Deployments because Agent projects use a server-backed app shape. Therefore, publish this Agent-built project with **Autoscale Deployment**, even though all game logic and persistence remain client-side.
- Autoscale can scale to zero when idle and is billed while requests are served. During planning, surface the publishing/cost implication and use the smallest reasonable machine and maximum-instance setting for this lightweight game; do not change paid deployment settings silently.
- Use the smallest practical Node production entry point solely to serve Vite's built `dist` files. It must not contain game rules, an application API, authentication, database access, web sockets, scheduled jobs, or durable server state.
- The production server must listen on `0.0.0.0` and choose one port with `Number(process.env.PORT ?? 3000)` or an equivalent validated fallback. Replit can auto-detect that port. If the project declares `[[ports]]` in `.replit`, its `localPort` must match the server and its `externalPort` must be `80`. The `/` response must complete comfortably within Replit's five-second health-check window. Serve the SPA entry point for valid app navigation, and exit visibly on an unrecoverable startup error.
- Required production flow: `npm run build` creates `dist`; `npm start` starts the production file server. Replit Preview may use `npm run dev`, but the published deployment must not depend on the Vite development server.
- Target a production bundle below 25 MB for v1. Avoid large texture packs, uncompressed audio, and unnecessary runtime dependencies.
- Do not require a third-party API, image CDN, login, paid service, or user-configured environment variable. An optional runtime `PORT` override is hosting configuration, not an application secret.
- Verify the app in Replit Preview before publishing. It must work at the published URL as well as Preview.
- Use a single-page state machine rather than URL-based client routes. Use deployment-safe asset URLs and test a direct request to `/` at the final `.replit.app` URL.
- Pin dependency versions with a lockfile. Do not rely on development-only files, Replit secrets, or writable production filesystem state.
- If Replit changes its publishing rules and the actual workspace explicitly offers a supported Static Deployment for an Agent-created app, the Agent may propose that simpler option during planning, cite the current Replit documentation, and wait for approval before deviating. Do not silently choose a deployment type based on an old tutorial.

### Suggested file structure

```text
src/
  app/
  components/
  game/
    engine.ts
    missionGenerator.ts
    targetTypes.ts
    wordBanks.ts
  state/
    progress.ts
    settings.ts
  styles/
  assets/                 # original, compact assets only
server/
  serve.mjs               # minimal production static-file server only
```

Keep game rules in data/configuration rather than scattering magic numbers across UI components. Use `requestAnimationFrame` for the play loop and cleanly stop it when paused, hidden, or unmounted. Avoid a game engine unless it materially improves the implementation; this is a small 2D browser game.

Use an explicit application state machine such as `boot → welcome → keyboardCheck → map/lessonSelect → briefing → countdown → playing → paused → results/retry`. Only the `playing` state may advance simulation time or accept target-typing input. Keep world simulation data separate from React menu state.

Use elapsed time rather than frame count for movement. Clamp a normal frame delta to 100 ms; if the observed gap exceeds 500 ms, auto-pause instead of advancing the simulation. Process queued input before collision checks. Limit decorative particles and remove completed entities promptly.

Inject a seedable random-number source into mission generation and cosmetic variation. Do not call `Math.random()` directly inside core selection/spawn rules; deterministic seeds are required for repeatable tests and bug reproduction. Production may create a fresh seed per attempt, but lesson rules and difficulty ceilings must not depend on luck.

### Persistence model

Version local storage entries, for example `blockReef.progress.v1` and `blockReef.settings.v1`. Persist only:

- unlocked mission IDs and cosmetic build pieces;
- best accuracy, WPM, and star result per campaign mission; best streak and best distance per applicable mode;
- settings;

Include safe default values and recover gracefully from invalid/old local storage. Wrap every storage read/write in error handling. If storage is disabled, full, corrupt, or unavailable in private browsing, continue with in-memory progress for the session and show one unobtrusive message: "Progress will last until this tab closes." Never block gameplay because persistence failed.

## Required failure-mode behaviour

| Failure or edge case | Required behaviour |
| --- | --- |
| Word bank has no valid non-ambiguous target | delay the spawn, retry from the allowed pool with a bounded attempt count, then continue; never loop forever |
| Label cannot be placed without overlap | delay it; never hide, clip, or stack labels |
| Tab loses focus or is hidden | auto-pause immediately; exclude hidden time from movement and statistics |
| Browser stalls or device is slow | clamp elapsed time, reduce particles, and auto-pause after a long stall; never teleport a target into the base |
| Resize or zoom changes layout | pause, recompute bounds and label positions, then require explicit resume |
| Local storage is unavailable/corrupt | use defaults or session memory; keep the game playable |
| Audio autoplay is blocked | remain silent until a user gesture; never show an error or block play |
| An audio file fails | skip that sound and preserve visual feedback |
| A decorative image fails | use an original geometric/CSS fallback; target labels and controls must still work |
| Reduced motion is requested | remove particles, parallax, label shake, and large transitions; retain clear static state changes |
| Input arrives during countdown/pause/results | ignore it for typing statistics and targets; handle only documented menu controls |
| Duplicate or rapid key events occur | ignore repeats and process each real key once |
| A target disappears while selected | clear selection safely and select nothing; never type into a stale object |
| Game code throws an unrecoverable error | show a calm recovery panel with Restart Game and Return Home; do not expose a stack trace to the child |
| Replit deployment health check fails | verify that `npm run build` produced `dist`, `npm start` binds to `0.0.0.0` on the selected port, any `.replit` port mapping is correct, `/` responds within five seconds, and startup does not wait for an external service |
| Published assets return 404 | verify the production server's `dist` root and SPA fallback, then test built JS, CSS, audio, and image URLs from a clean browser session |
| Network drops after the app has loaded | continue the current session using already loaded local assets; no game rule may require a live request |

Audio must be initialized only after a click/key gesture. All audio playback calls must tolerate rejected promises. Use system or bundled licensed fonts; do not depend on a third-party font CDN.

An installable PWA and guaranteed cold start or hard refresh while fully offline are out of scope for v1. "Offline after load" means the already-open game keeps working after its initial same-origin HTML, JavaScript, CSS, and bundled assets have loaded.

## Testing and quality gates

Use automated tests for deterministic rules and focused manual testing for playability.

### Required unit/component tests

- first-letter selection chooses the nearest eligible target and keeps it locked;
- Starter generation never exposes duplicate first letters and terminates when the pool is constrained;
- correct, incorrect, repeated, modified, and composed key events affect progress/statistics correctly;
- final keystroke wins a same-update collision;
- pause, tab hiding, frame stalls, and countdown do not advance active time;
- accuracy and WPM handle zero input, short rounds, mistakes, and pauses without invalid numbers;
- progress/settings load defaults, migrate valid data, and survive corrupt or unavailable storage;
- Reef Shield cannot consume an alphabetic typing key and cannot clear a Current Gate;
- reduced-motion and large-text settings alter presentation without changing lesson content.

### Required integration/manual checks

- first launch through first mission, completion, retry, Practise, refresh, and reset-progress flows;
- keyboard-only navigation with visible focus;
- sound muted, audio blocked, asset failure, and offline-after-load behaviour;
- browser zoom at 200%, text size Large, Extra Contrast, and reduced motion;
- current Chrome, Edge, Safari, and Firefox at 1024×768 and 1366×768;
- Replit Preview and the published `.replit.app` URL with a clean browser profile.
- a production smoke test that starts the built app, receives HTTP 200 from `/` within five seconds, and successfully loads at least one hashed JavaScript/CSS asset;

Run type-checking, unit tests, production build, and any linting configured by the project. Do not mark a slice complete while one of its relevant checks is failing.

## Build sequence for Replit Agent

Work in small, verifiable slices. Do not attempt final art or every mode before the core input loop is trustworthy.

0. Produce the planning artifact required above and confirm the first playable slice’s acceptance checks.
1. Confirm the current Replit publishing options, then scaffold the client-only React/TypeScript app, minimal production serving shell, state machine, responsive UI, settings persistence, error boundary, and high-contrast type system.
2. Build one playable Starter mission with moving one-letter Pebble Puffer targets, deterministic letter bank, target selection, typed-character progress, pause/focus safety, hearts, statistics, and results card.
3. Add automated tests, difficulty configuration, the bounded mission generator, failure fallbacks, Reef Shield, and local progress.
4. Add the Adventure Trail map, route choices, three regions, twelve missions, Current Gates, Build Break, and build-reward progression.
5. Add Key Camp, Deep Current, settings/captions/reduced-motion support, and original block-world polish.
6. Run the full quality gates on a real physical keyboard in Replit Preview and after Autoscale Deployment. Fix functional bugs before visual extras.

## Acceptance checklist

The build is ready only when all statements are true:

- A 6-year-old can start the first mission and identify exactly what to type without reading a long paragraph.
- The active word is large, high contrast, unobstructed, and remains readable while the background moves.
- Correct letters advance the selected target; incorrect letters are forgiving and clear.
- `Escape` pauses immediately; no game time advances while paused.
- Blur, hidden-tab, resize, and long-frame-stall cases pause safely without target jumps.
- Starter mode never presents two labels with the same first letter.
- Labels never overlap, clip, shrink below the minimum, or pass behind the HUD.
- The game works with sound muted and with reduced motion enabled.
- Text size, contrast, speed, volume, and progress persist after refresh.
- If persistence or an optional asset fails, gameplay remains available through the documented fallback.
- Accuracy and WPM remain correct after pauses, retries, ignored keys, and short sessions.
- No personal data leaves the browser; browser devtools show no required network requests after initial asset load.
- All game art/audio is original or licensed for this use, and no Minecraft or Typer Shark branding/content appears.
- Type-checking and automated tests pass, `npm run build` succeeds, `npm start` serves the production build on its detected/configured port, and Replit Autoscale Deployment serves the finished app successfully.

## Research basis and source checks

This specification applies current guidance rather than copying an existing game:

- [W3C WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) supports the 4.5:1 text minimum and reinforces use of real readable text.
- [W3C WCAG 2.2 timing adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) supports pause, adjustable timing, and untimed practise alternatives.
- [Microsoft game accessibility guidance](https://learn.microsoft.com/en-us/windows/uwp/gaming/accessibility-for-games) supports adjustable difficulty, readable/large high-contrast text, non-colour cues, sound alternatives, and no-flash options.
- [Minecraft usage guidelines](https://www.minecraft.net/en-us/usage-guidelines) are why this is an original block-world aesthetic rather than a Minecraft-branded or asset-based game.
- [Replit deployment types](https://docs.replit.com/features/publishing/deployment-types), [Replit Agent overview](https://docs.replit.com/features/agent/overview), and [publishing troubleshooting](https://docs.replit.com/build/troubleshooting) support using Autoscale for an Agent-created app, keeping the application logic client-side, and validating the production server's port and startup behaviour.

Citation validation: the linked W3C, Microsoft, Minecraft, and Replit pages were fetched and checked on 2026-07-23. Treat this document as a product/implementation specification, not legal advice.
