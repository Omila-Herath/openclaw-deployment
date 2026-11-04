# Heartbeat — News Forager

Run this every scheduled tick:

1. From the agents folder (so `.env` loads), run the fetch command:
   `node news/fetch-news.mjs`
   > Replace with the absolute path on this machine, e.g.
   > `cd /ABSOLUTE/PATH/TO/openclaw-deployment/agents && node news/fetch-news.mjs`
2. Confirm it printed `news.json written — N headlines`. If a feed failed, that's fine — it skips and continues.
3. Your status is written automatically to `fleet.json` — the dashboard shows you working.

Only read the feeds listed in `RSS_FEEDS`. Don't invent headlines.
