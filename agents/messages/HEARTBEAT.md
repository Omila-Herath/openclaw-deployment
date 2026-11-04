# Heartbeat — Messenger

Every tick:
1. From the agents folder (so `.env` loads): `node messages/fetch-messages.mjs`
   > e.g. `cd /ABSOLUTE/PATH/TO/openclaw-deployment/agents && node messages/fetch-messages.mjs`
2. Confirm it printed `messages.json written — N messages`.
3. Status is written automatically to `fleet.json`.
