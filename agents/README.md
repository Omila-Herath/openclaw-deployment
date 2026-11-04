# OpenClaw Orchard — Agents

Two agents that feed the Orchard dashboard, plus a tiny server so the browser can read them.

- **Inbox Scout** (`email/`) — reads your unread Gmail → `inbox.json`
- **News Forager** (`news/`) — pulls RSS headlines → `news.json`
- Both report "I'm working" into `fleet.json` → this is what makes the **bees move** in the dashboard.

They all write into one folder (default `~/.openclaw/data`), and `serve.mjs` exposes that folder over HTTP for the dashboard to poll.

```
agents/ ──writes──► ~/.openclaw/data/{inbox,news,fleet}.json ──serve.mjs──► dashboard (polls)
```

---

## 0. Install

```bash
cd agents
npm install
cp .env.example .env
```

## 1. News Forager (easiest — no accounts, do this first)

Edit `RSS_FEEDS` in `.env` (comma-separated) and optionally `NEWS_TOPICS`, then:

```bash
npm run fetch:news
```

You should see `news.json written — N headlines`. That's the agent working. ✅

## 2. Inbox Scout (Gmail)

One-time Google setup:
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create/pick a project.
2. **APIs & Services → Library →** enable **Gmail API**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Desktop app.**
4. Copy the Client ID + Secret into `.env` (`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`).
5. On the OAuth consent screen, add your own email as a **Test user**.

Then get a refresh token (opens your browser once):

```bash
npm run auth:gmail
```

Paste the printed `GMAIL_REFRESH_TOKEN=…` into `.env`, then:

```bash
npm run fetch:inbox
```

You should see `inbox.json written — N unread`. ✅ (The scope is **read-only** — the agent can never send or delete.)

## 3. See them working in the dashboard

Serve the data folder:

```bash
npm run serve
```

Then in the **dashboard** repo root, set `.env.local`:

```bash
VITE_DATA_URL="http://localhost:8787"
```

```bash
npm run dev
```

The fleet bar flips to **LIVE** and the bees follow your real agents. Run `fetch:news` / `fetch:inbox` again and watch their progress bars move.

---

## 4. Register them in OpenClaw (so OpenClaw runs them on a schedule)

Create the agents (per the [OpenClaw docs](https://docs.openclaw.ai/cli/agents) — flags vary by version, check `openclaw agents --help`):

```bash
openclaw agents add inbox --workspace ~/.openclaw/workspace-inbox
openclaw agents add news  --workspace ~/.openclaw/workspace-news
```

- Put `email/SOUL.md` into the inbox agent's workspace, and `news/SOUL.md` into the news agent's.
- Give each agent a skill/tool that runs its fetch script (point it at this `agents/` folder), e.g. the command `node <path>/agents/news/fetch-news.mjs`.
- Schedule the runs. Use OpenClaw's scheduler if your version has one; otherwise the OS works fine:
  - **Windows (Task Scheduler):** a basic task every 15 min running `node C:\...\agents\news\fetch-news.mjs`.
  - **macOS/Linux (cron):** `*/15 * * * * cd ~/…/agents && node news/fetch-news.mjs`

Each run rewrites the JSON and updates `fleet.json`, so the dashboard stays live and the bees keep moving.

---

## Running OpenClaw online vs. on your desktop

- **Desktop:** everything above works as-is; keep `serve.mjs` local.
- **Online / hosted OpenClaw:** have the hosted agents write to a data folder there and run `serve.mjs` (or your host's static serving) on that box; point `VITE_DATA_URL` at it.
- ⚠️ **Privacy:** `inbox.json` is your real mail. Do **not** expose it on a public URL. Keep the email data local or behind auth; a public demo should serve only `news.json` + sample `orchard.json`.

## Data shapes
See the dashboard's `src/data/schema.ts`. In short:
- `inbox.json` → `{ updatedAt, unread, messages:[{id,from,subject,snippet,receivedISO,importance}] }`
- `news.json` → `{ updatedAt, topics:[], items:[{id,title,source,url,publishedISO,sentiment}] }`
- `fleet.json` → `{ agents:[{id,name,color,status,targetFolderId,progress}] }`
