// Sky Watcher — pulls the forecast from Open-Meteo (free, no API key) and writes
// weather.json, which drives the orchard's actual sky, light, and rain.
// Env: WEATHER_LAT, WEATHER_LON, WEATHER_LOCATION (optional label).

import "dotenv/config";
import { writeData, setAgentStatus } from "../lib/fleet.mjs";

const AGENT = { id: "weather", name: "Sky Watcher", color: "#ffd27f" };
const LAT = process.env.WEATHER_LAT || "-37.84"; // defaults: Melbourne
const LON = process.env.WEATHER_LON || "144.95";
const LOCATION = process.env.WEATHER_LOCATION || "";

// Map WMO weather codes to our conditions.
function condition(code) {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3 || code === 45 || code === 48) return "cloudy";
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "partly";
}

async function main() {
  setAgentStatus({ ...AGENT, status: "flying", targetFolderId: null, progress: 0.2 });
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,is_day`;
  const res = await fetch(u);
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const d = await res.json();
  const c = d.current || {};

  writeData("weather.json", {
    updatedAt: new Date().toISOString(),
    location: LOCATION,
    tempC: typeof c.temperature_2m === "number" ? Math.round(c.temperature_2m) : undefined,
    isDay: c.is_day === 1,
    condition: condition(c.weather_code),
  });

  setAgentStatus({ ...AGENT, status: "tending", targetFolderId: null, progress: 1 });
  console.log(`weather.json written — ${condition(c.weather_code)}, ${Math.round(c.temperature_2m)}°C, ${c.is_day ? "day" : "night"}`);
}

main().catch((e) => {
  console.error(e.message || e);
  setAgentStatus({ ...AGENT, status: "idle", targetFolderId: null, progress: 0 });
  process.exit(1);
});
