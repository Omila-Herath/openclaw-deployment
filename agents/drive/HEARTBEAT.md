# Heartbeat — Drive Keeper

Every tick (hourly is plenty):
1. From the agents folder (so `.env` loads): `node drive/fetch-drive.mjs`
   > e.g. `cd /ABSOLUTE/PATH/TO/openclaw-deployment/agents && node drive/fetch-drive.mjs`
2. Confirm it printed `orchard.json written — N folders, X GB`.
3. Status is written automatically to `fleet.json`.
