import { useEffect, useRef, useState } from "react";
import type { OrchardData, FleetData } from "./schema";

// Where to read data from.
//  - Demo / shareable build: bundled files in /public/sample (default).
//  - Live / personal mode: set VITE_DATA_URL to where OpenClaw serves (or a
//    static server exposes) orchard.json + fleet.json, e.g.
//    VITE_DATA_URL="http://localhost:8787"  or  "/api" (with the Vite proxy).
const RAW = import.meta.env.VITE_DATA_URL;

/** True when pointed at a real data source (vs. the bundled demo sample). */
export const isLive = !!RAW;

const BASE = RAW ? RAW.replace(/\/$/, "") : `${import.meta.env.BASE_URL}sample`;
const ORCHARD_URL = `${BASE}/orchard.json`;
const FLEET_URL = `${BASE}/fleet.json`;

// Poll intervals. Fleet (which agent is doing what) changes constantly;
// folder structure changes rarely, so we re-poll it far less often.
const FLEET_MS = 2000;
const ORCHARD_MS = 60000;

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return (await res.json()) as T;
}

export function useOrchardData() {
  const [orchard, setOrchard] = useState<OrchardData | null>(null);
  const [fleet, setFleet] = useState<FleetData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const orchardSig = useRef<string>("");

  useEffect(() => {
    let alive = true;

    async function pullOrchard() {
      try {
        const d = await getJSON<OrchardData>(ORCHARD_URL);
        if (!alive) return;
        // Only swap state when the content actually changed, so trees don't
        // rebuild on every poll.
        const sig = JSON.stringify(d);
        if (sig !== orchardSig.current) {
          orchardSig.current = sig;
          setOrchard(d);
        }
        setError(null);
      } catch (e) {
        if (alive && !orchardSig.current) setError(String(e));
      }
    }

    async function pullFleet() {
      try {
        const d = await getJSON<FleetData>(FLEET_URL);
        if (alive) setFleet(d);
      } catch {
        /* fleet optional; bees fall back to defaults/simulation */
      }
    }

    pullOrchard();
    pullFleet();

    // Keep the fleet fresh. Re-poll structure only in live mode (the demo
    // sample never changes).
    const fleetTimer = setInterval(pullFleet, FLEET_MS);
    const orchardTimer = isLive ? setInterval(pullOrchard, ORCHARD_MS) : null;

    return () => {
      alive = false;
      clearInterval(fleetTimer);
      if (orchardTimer) clearInterval(orchardTimer);
    };
  }, []);

  return { orchard, fleet, error, isLive };
}
