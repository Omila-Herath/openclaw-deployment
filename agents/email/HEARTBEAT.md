# Heartbeat — Inbox Scout

Run this every scheduled tick:

1. From the agents folder (so `.env` loads), run the fetch command:
   `node email/fetch-inbox.mjs`
   > Replace with the absolute path on this machine, e.g.
   > `cd /ABSOLUTE/PATH/TO/openclaw-deployment/agents && node email/fetch-inbox.mjs`
2. Confirm it printed `inbox.json written — N unread`. If it errored, note why and stop (don't retry in a loop).
3. Your status is written automatically to `fleet.json` — the dashboard shows you working.

Do **not** send, reply to, archive, or delete any mail. Read-only.
