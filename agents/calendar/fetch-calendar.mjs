// Date Keeper — reads an iCal (.ics) feed and writes calendar.json, shown as
// lanterns strung across the orchard sky (soonest event = brightest).
// Env: CALENDAR_ICS_URL  (Google Calendar → Settings → "Secret address in iCal format")

import "dotenv/config";
import ical from "node-ical";
import { writeData, setAgentStatus } from "../lib/fleet.mjs";

const AGENT = { id: "calendar", name: "Date Keeper", color: "#c77dff" };
const ICS = process.env.CALENDAR_ICS_URL;
const MAX = 7;

async function main() {
  if (!ICS) throw new Error("No CALENDAR_ICS_URL — add your calendar's secret iCal link to .env.");
  setAgentStatus({ ...AGENT, status: "flying", targetFolderId: null, progress: 0.2 });

  const data = await ical.async.fromURL(ICS);
  const now = Date.now();
  const events = Object.values(data)
    .filter((e) => e.type === "VEVENT" && e.start)
    .map((e) => ({
      id: String(e.uid || e.start),
      title: String(e.summary || "(untitled)"),
      startISO: new Date(e.start).toISOString(),
      allDay: e.datetype === "date",
    }))
    .filter((e) => Date.parse(e.startISO) >= now - 6 * 3600 * 1000) // keep today + future
    .sort((a, b) => Date.parse(a.startISO) - Date.parse(b.startISO))
    .slice(0, MAX);

  writeData("calendar.json", { updatedAt: new Date().toISOString(), events });
  setAgentStatus({ ...AGENT, status: "tending", targetFolderId: null, progress: 1 });
  console.log(`calendar.json written — ${events.length} upcoming events`);
}

main().catch((e) => {
  console.error(e.message || e);
  setAgentStatus({ ...AGENT, status: "idle", targetFolderId: null, progress: 0 });
  process.exit(1);
});
