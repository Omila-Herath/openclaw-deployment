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

You've already created the agents:

```bash
openclaw agents add inbox --workspace ~/.openclaw/workspace-inbox
openclaw agents add news  --workspace ~/.openclaw/workspace-news
```

### 4a. Give each agent its charter + heartbeat
OpenClaw loads the files in an agent's workspace at session start, and runs
`HEARTBEAT.md` on every scheduled tick. Copy them in:

```bash
cp email/SOUL.md email/HEARTBEAT.md ~/.openclaw/workspace-inbox/
cp news/SOUL.md  news/HEARTBEAT.md  ~/.openclaw/workspace-news/
```

Edit the two `HEARTBEAT.md` files and replace `/ABSOLUTE/PATH/TO/` with the real
path to this `agents/` folder on your machine. (`.env` is loaded from wherever
the command runs, so the `cd …/agents` part matters.)

### 4b. Schedule them
OpenClaw stores schedules in `~/.openclaw/cron/jobs.json`. Create a recurring job
per agent (command name varies by version — check `openclaw automations --help`
or `openclaw cron --help`):

```bash
openclaw automations create "*/15 * * * *" "Run your HEARTBEAT: fetch and update your JSON." --agent inbox
openclaw automations create "*/20 * * * *" "Run your HEARTBEAT: fetch and update your JSON." --agent news
```

Prefer not to route through the LLM each run? Schedule the scripts directly instead:
- **Windows (Task Scheduler):** new task every 15 min → `node C:\...\openclaw-deployment\agents\news\fetch-news.mjs` (set "Start in" to the `agents` folder).
- **macOS/Linux (cron):** `*/15 * * * * cd ~/…/openclaw-deployment/agents && node news/fetch-news.mjs`

Either way, each run rewrites the JSON and updates `fleet.json`, so the dashboard
stays live and the bees keep moving.

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
