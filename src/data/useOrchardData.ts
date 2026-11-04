import { useEffect, useRef, useState } from "react";
import type { OrchardData, FleetData, InboxData, NewsData } from "./schema";

// Where to read data from.
//  - Demo / shareable build: bundled files in /public/sample (default).
//  - Live / personal mode: set VITE_DATA_URL to where OpenClaw serves (or a
//    static server exposes) the JSON, e.g.
//    VITE_DATA_URL="http://localhost:8787"  or  "/api" (with the Vite proxy).
const RAW = import.meta.env.VITE_DATA_URL;

/** True when pointed at a real data source (vs. the bundled demo sample). */
export const isLive = !!RAW;

const BASE = RAW ? RAW.replace(/\/$/, "") : `${import.meta.env.BASE_URL}sample`;
const url = (name: string) => `${BASE}/${name}`;

// Poll intervals (ms). Fleet changes constantly; content less often; structure rarely.
const FLEET_MS = 2000;
const CONTENT_MS = 10000;
const ORCHARD_MS = 60000;

async function getJSON<T>(u: string): Promise<T> {
  const res = await fetch(u, { cache: "no-store" });
  if (!res.ok) throw new Error(`${u} -> ${res.status}`);
  return (await res.json()) as T;
}

export function useOrchardData() {
  const [orchard, setOrchard] = useState<OrchardData | null>(null);
  const [fleet, setFleet] = useState<FleetData | null>(null);
  const [inbox, setInbox] = useState<InboxData | null>(null);
  const [news, setNews] = useState<NewsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const orchardSig = useRef<string>("");

  useEffect(() => {
    let alive = true;

    async function pullOrchard() {
      try {
        const d = await getJSON<OrchardData>(url("orchard.json"));
        if (!alive) return;
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
    const pullFleet = () => getJSON<FleetData>(url("fleet.json")).then((d) => alive && setFleet(d)).catch(() => {});
    const pullInbox = () => getJSON<InboxData>(url("inbox.json")).then((d) => alive && setInbox(d)).catch(() => {});
    const pullNews = () => getJSON<NewsData>(url("news.json")).then((d) => alive && setNews(d)).catch(() => {});

    pullOrchard();
    pullFleet();
    pullInbox();
    pullNews();

    const timers = [
      setInterval(pullFleet, FLEET_MS),
      setInterval(pullInbox, CONTENT_MS),
      setInterval(pullNews, CONTENT_MS),
      ...(isLive ? [setInterval(pullOrchard, ORCHARD_MS)] : []),
    ];

    return () => {
      alive = false;
      timers.forEach(clearInterval);
    };
  }, []);

  return { orchard, fleet, inbox, news, error, isLive };
}
