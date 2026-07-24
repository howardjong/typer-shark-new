# Block Reef: Typing Quest — Release Checklist

Run these automated gates after a clean install:

```bash
npm test
npm run type-check
npm run build
npm run smoke
```

The smoke command starts and stops the production static server, checks the HTML entry point, verifies a hashed JavaScript asset has immutable caching, and checks SPA fallback routing.

Before publishing, use a persistent browser preview to complete the manual matrix:

- Keyboard-only: Welcome, Key Camp, map, regular mission, Current Gate, Deep Current breather, pause/resume, results, and exit paths.
- 200% browser zoom and a narrow viewport: labels, HUD controls, Key Camp keyboard, map cards, and dialogs remain usable.
- `prefers-reduced-motion` and in-game Reduced feedback: no bobbing or focus pulse remains.
- Screen reader: concise announcements for countdown, target clear, heart loss, Shield, gate stability, Deep Current breather, and Key Camp hints.
- Persistence: reload after a mission and after Deep Current; confirm local completion, bests, Build Bits, and settings return.

Deployment is a separate, explicit action. Use Replit **Autoscale**, the smallest practical machine, and at most one instance. Repeat `npm run smoke` (or equivalent root, asset, and route checks) against the deployed URL before sharing it.
