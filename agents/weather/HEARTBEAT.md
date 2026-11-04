# Heartbeat — Sky Watcher

Every tick:
1. From the agents folder (so `.env` loads): `node weather/fetch-weather.mjs`
   > e.g. `cd /ABSOLUTE/PATH/TO/openclaw-deployment/agents && node weather/fetch-weather.mjs`
2. Confirm it printed `weather.json written — …`.
3. Status is written automatically to `fleet.json`.
