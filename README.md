# OpenClaw Orchard 🍎🐝

A living 3D orchard that visualizes your Google Drive and your OpenClaw agent fleet.

- **Folders are trees** — bigger folder, bigger tree. The giant gnarled one is usually `Orphaned`.
- **Files are fruit** — ripe red when fresh, browning as they go untouched, **fallen on the ground** once stale (your "untouched 2yr+" pile).
- **Agents are bees** — each flies to the folder it's working on, tends it, and reports in the **fleet bar** (bottom-right).

Built with Vite + React + React Three Fiber (three.js). The 3D scene is procedural and **seeded** — every folder always grows the exact same tree.

---

## 1. Run it locally (VS Code)

You need **Node.js 18+** ([nodejs.org](https://nodejs.org)). Then, in the project folder:

```bash
npm install
```

```bash
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). It starts in **demo mode** with the sample data in `public/sample/`.

> In VS Code: `File → Open Folder…` → pick `openclaw-orchard`, then open a terminal (`` Ctrl+` ``) and run the two commands above.

---

## 2. How data flows (the important part)

The orchard never talks to your agents directly. OpenClaw **writes JSON**, the orchard **reads JSON**. That one seam is what lets the same app show sample data publicly *and* your real data privately.

```
OpenClaw agents  ──►  orchard.json / fleet.json  ──►  Orchard (this app)
```

The shapes are defined once in [`src/data/schema.ts`](src/data/schema.ts). Two files:

- `orchard.json` — your folders (`id, name, bytes, fileCount, lastTouchedISO, parentId`)
- `fleet.json` — your agents (`id, name, color, status, targetFolderId, progress`)

### Live updates (built in)

The app **polls** for fresh data automatically:

- `fleet.json` every **2s** (which agent is tending which folder — the bees follow it)
- `orchard.json` every **60s** (folder structure; only re-polled in live mode)

In **live mode** the bees are data-driven: each flies to the folder its agent reports and its progress bar reflects the real `progress`. In **demo mode** (the bundled sample) the bees simulate activity so a shared link still looks alive. The fleet bar shows a `LIVE` / `DEMO` badge.

> A browser can only read data over HTTP, never off disk — so OpenClaw must *serve* these two files (an endpoint on its portal), or write them into a folder a static server exposes. Polling is enough for a dashboard; swap to SSE later if you want instant push.

### Point it at live data

Set the source in `.env.local`, then restart `npm run dev`:

```bash
# Option A — OpenClaw (or any server) serves the JSON directly:
VITE_DATA_URL="http://localhost:8787"

# Option B — route through the dev proxy to avoid CORS (recommended in dev):
VITE_DATA_URL="/api"
OPENCLAW_URL="http://localhost:8787"
```

Either way it expects `…/orchard.json` and `…/fleet.json`. The proxy (in `vite.config.ts`) maps `/api/*` → `OPENCLAW_URL/*` so the browser sees same-origin requests and never hits a CORS wall.

### Wiring OpenClaw to it

Write an adapter that turns your Drive-scan output into `orchard.json`. A starting point is in [`tools/openclaw-adapter.mjs`](tools/openclaw-adapter.mjs) — edit the `mapScan()` function to match whatever OpenClaw emits, then:

```bash
node tools/openclaw-adapter.mjs path/to/openclaw-scan.json public/sample/orchard.json
```

For **real-time bees**, have an agent rewrite `fleet.json` as it works (the app can be switched from the bundled sample to polling that file). Start simple with polling; upgrade to a tiny SSE endpoint later.

---

## 3. Share it with people

### A. Public demo (safe to share — no private data)
The bundled sample data is already shareable. Push to GitHub, then deploy:

**Vercel (recommended):**
1. Push this repo to GitHub (see below).
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset: **Vite** (auto-detected). Click **Deploy**. Done — you get a public link, and every `git push` redeploys.

Netlify and Cloudflare Pages work the same way. For **GitHub Pages**, set `base: "/openclaw-orchard/"` in `vite.config.ts` first.

### B. Your real orchard (private)
Don't put your live inbox/Drive on a public URL. Two safe options:
- **Keep it local** — just run `npm run dev` (or `npm run build && npm run preview`) on your machine.
- **Deploy a frozen snapshot** — export a scrubbed `orchard.json` once and deploy that specific build to a password-protected site (Vercel password / Cloudflare Access).

---

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "OpenClaw Orchard: initial scaffold"
```

```bash
git branch -M main
git remote add origin https://github.com/<you>/openclaw-orchard.git
git push -u origin main
```

(Create the empty repo first on github.com, or use the GitHub extension in VS Code.)

---

## Project structure

```
src/
  App.tsx                 # Canvas + HUD
  data/
    schema.ts             # the OpenClaw ⇄ Orchard data contract
    useOrchardData.ts     # fetches orchard.json / fleet.json (demo or live)
  scene/
    layout.ts             # deterministic tree placement + metrics
    prng.ts               # seeded randomness (same folder → same tree)
    ripeness.ts           # recency → fruit color ramp
    wind.ts               # canopy wind shader (onBeforeCompile)
    Sky / Ground / Tree / Apples / FallenFruit / Bees / Orchard
  hud/
    Hud.tsx  FleetBar.tsx # glass overlay, tooltip, agent activity bar
public/sample/            # demo data (what the public build shows)
tools/openclaw-adapter.mjs
```

## Next steps / roadmap
1. ✅ Scaffold + demo deploy (you are here)
2. Adapter: emit `orchard.json` from the OpenClaw Drive agent
3. Live mode via polling `fleet.json`
4. Email (birds) + news (weather/sky) widgets
5. Real-time fleet via SSE
6. Asset polish: HDRI lighting, PBR bark/leaf textures, LOD for very large drives

> Performance note: don't render all 64k files literally. Aggregate to one tree per folder and keep fruit *representative* (count/size per folder), with instancing + LOD.
