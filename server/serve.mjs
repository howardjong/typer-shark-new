// Minimal production static-file server for Block Reef: Typing Quest.
// Serves the built `dist/` directory with an SPA fallback. No game logic,
// no API, no database, no server state.
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(PORT) || PORT <= 0 || PORT > 65535) {
  console.error(`Invalid PORT value: ${process.env.PORT}`);
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
};

async function readFileSafe(filePath) {
  // Prevent path traversal outside dist
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(DIST + path.sep) && resolved !== DIST) return null;
  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) return null;
    return await fs.readFile(resolved);
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";

    let body = await readFileSafe(path.join(DIST, pathname));
    let ext = path.extname(pathname).toLowerCase();

    if (!body) {
      // SPA fallback: serve index.html for app navigation paths (no file extension)
      if (!ext) {
        body = await readFileSafe(path.join(DIST, "index.html"));
        ext = ".html";
      }
      if (!body) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
    }

    const headers = { "Content-Type": MIME[ext] ?? "application/octet-stream" };
    // Hashed assets can be cached aggressively; HTML must not be.
    if (pathname.startsWith("/assets/")) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    } else {
      headers["Cache-Control"] = "no-cache";
    }
    res.writeHead(200, headers);
    res.end(body);
  } catch (err) {
    console.error("Request error:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server error");
  }
});

// Fail visibly if dist is missing rather than serving nothing.
fs.stat(path.join(DIST, "index.html"))
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Block Reef serving dist/ on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(() => {
    console.error(`dist/index.html not found. Run \`npm run build\` first.`);
    process.exit(1);
  });
