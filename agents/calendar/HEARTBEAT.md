# Heartbeat — Date Keeper

Every tick:
1. From the agents folder (so `.env` loads): `node calendar/fetch-calendar.mjs`
   > e.g. `cd /ABSOLUTE/PATH/TO/openclaw-deployment/agents && node calendar/fetch-calendar.mjs`
2. Confirm it printed `calendar.json written — N upcoming events`.
3. Status is written automatically to `fleet.json`.
