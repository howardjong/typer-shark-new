import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 31_000 + Math.floor(Math.random() * 1_000);
const child = spawn(process.execPath, ["server/serve.mjs"], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
let started = false;
const startedPromise = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error(`server did not start\n${output}`)), 5_000);
  child.stdout.on("data", (chunk) => {
    output += chunk;
    if (output.includes("Block Reef serving")) {
      started = true;
      clearTimeout(timeout);
      resolve();
    }
  });
  child.stderr.on("data", (chunk) => { output += chunk; });
  child.once("exit", (code) => {
    if (!started) {
      clearTimeout(timeout);
      reject(new Error(`server exited before smoke checks (code ${code})\n${output}`));
    }
  });
});

try {
  await startedPromise;
  const base = `http://127.0.0.1:${port}`;
  const rootResponse = await fetch(`${base}/`);
  if (!rootResponse.ok || !rootResponse.headers.get("content-type")?.includes("text/html")) {
    throw new Error(`root response was not HTML (${rootResponse.status})`);
  }
  const html = await rootResponse.text();
  const assetPath = html.match(/src="(\/assets\/[^"?]+\.js)"/)?.[1];
  if (!assetPath) throw new Error("built HTML did not reference a hashed JavaScript asset");

  const assetResponse = await fetch(`${base}${assetPath}`);
  if (!assetResponse.ok || assetResponse.headers.get("cache-control") !== "public, max-age=31536000, immutable") {
    throw new Error(`asset cache policy was unexpected (${assetResponse.status})`);
  }
  const routeResponse = await fetch(`${base}/adventure-trail`);
  if (!routeResponse.ok || !routeResponse.headers.get("content-type")?.includes("text/html")) {
    throw new Error(`SPA fallback was not HTML (${routeResponse.status})`);
  }
  console.log("Production smoke passed: root, hashed asset, and SPA fallback are healthy.");
} finally {
  child.kill();
}
