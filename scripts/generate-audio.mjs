// Build-time audio generation via ElevenLabs sound-effects API.
// Run: node scripts/generate-audio.mjs  (requires ELEVENLABS_API_KEY env var)
// Output: src/assets/audio/<effect>.mp3 — bundled by Vite; the key is never
// used or shipped in the browser.
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY is not set. Aborting.");
  process.exit(1);
}

const OUT_DIR = path.resolve("src/assets/audio");

// Child-friendly, soft, non-startling underwater/blocky sounds.
const EFFECTS = {
  select: {
    duration: 0.6,
    prompt:
      "Soft short gentle water droplet plip, friendly video game UI select blip, underwater, mellow, quiet, single note",
  },
  correct: {
    duration: 0.5,
    prompt:
      "Tiny cheerful bubble pop, single soft xylophone pling, kids game correct keystroke feedback, gentle, bright, very short",
  },
  complete: {
    duration: 1.0,
    prompt:
      "Happy quick ascending marimba three-note flourish with a soft bubble pop, kids game small success jingle, warm, gentle",
  },
  wrong: {
    duration: 0.5,
    prompt:
      "Soft muted low wooden knock, dull gentle thud, kids game oops sound, friendly not scary, quiet, single hit",
  },
  miss: {
    duration: 0.8,
    prompt:
      "Gentle descending two-note whistle slide with a soft water swish, kids game mild setback sound, sympathetic, not scary",
  },
  badge: {
    duration: 1.2,
    prompt:
      "Sparkly gentle glockenspiel arpeggio with soft chime shimmer, kids game achievement badge earned, magical, warm, short",
  },
  countdown: {
    duration: 0.5,
    prompt:
      "Single soft woodblock tick with slight underwater echo, kids game countdown beep alternative, gentle, short",
  },
  victory: {
    duration: 2.5,
    prompt:
      "Cheerful short victory jingle, marimba and soft steel drum, tropical underwater kids game mission complete fanfare, warm and happy, ends cleanly",
  },
  defeat: {
    duration: 2.0,
    prompt:
      "Gentle consoling short melody, soft kalimba descending then a hopeful up-note, kids game try-again sound, kind, never harsh or sad-dramatic",
  },
};

await mkdir(OUT_DIR, { recursive: true });

let failures = 0;
for (const [name, { prompt, duration }] of Object.entries(EFFECTS)) {
  const outPath = path.join(OUT_DIR, `${name}.mp3`);
  const skip = await access(outPath).then(() => true, () => false);
  if (skip && !process.argv.includes("--force")) {
    console.log(`skip   ${name}.mp3 (exists; use --force to regenerate)`);
    continue;
  }
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: duration,
        prompt_influence: 0.5,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) throw new Error(`suspiciously small file (${buf.length} bytes)`);
    await writeFile(outPath, buf);
    console.log(`wrote  ${name}.mp3 (${(buf.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    failures++;
    console.error(`FAILED ${name}: ${err.message}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} effect(s) failed. The game still works — it falls back to built-in tones for missing files. Re-run to retry.`);
  process.exit(1);
}
console.log("\nAll audio effects generated.");
