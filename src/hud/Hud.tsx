import { useEffect, useRef } from "react";
import type { OrchardData, InboxData, NewsData } from "../data/schema";
import { useHover } from "../store";
import { fleetLive } from "../store";
import { monthsSince, ripeColor } from "../scene/ripeness";
import FleetBar from "./FleetBar";
import InfoPanel from "./InfoPanel";

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

function fmtSize(b: number): string {
  if (b >= GB) return `${(b / GB).toFixed(b >= 10 * GB ? 0 : 2)} GB`;
  return `${(b / MB).toFixed(0)} MB`;
}
function fmtAge(iso: string): string {
  const m = monthsSince(iso);
  if (m < 1) return "days ago";
  if (m < 2) return "1 month ago";
  if (m < 12) return `${Math.round(m)} months ago`;
  return `${(m / 12).toFixed(1)} yr ago`;
}

export default function Hud({
  orchard,
  inbox,
  news,
}: {
  orchard: OrchardData;
  inbox: InboxData | null;
  news: NewsData | null;
}) {
  const hovered = useHover((s) => s.hovered);
  const tipRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  // follow the cursor without re-rendering React
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const tip = tipRef.current;
      if (!tip) return;
      tip.style.left = `${Math.min(e.clientX + 16, window.innerWidth - 200)}px`;
      tip.style.top = `${Math.min(e.clientY + 16, window.innerHeight - 170)}px`;
    };
    window.addEventListener("mousemove", onMove);
    const h = setTimeout(() => hintRef.current && (hintRef.current.style.opacity = "0"), 6500);
    return () => {
      window.removeEventListener("mousemove", onMove);
      clearTimeout(h);
    };
  }, []);

  const tendedBy =
    hovered &&
    Object.values(fleetLive.current).find(
      (a) => a.tending && a.taskLabel.endsWith(hovered.name)
    )?.name;

  const dotColor = hovered ? `#${ripeColor(monthsSince(hovered.lastTouchedISO)).getHexString()}` : "#fff";

  return (
    <>
      <div id="title" className="hud">
        <div className="panel">
          <h1>
            OpenClaw <em>Orchard</em>
          </h1>
          <p>
            Every folder is a tree, every file a fruit. Fruit ripens red when fresh and browns as it
            goes untouched — then falls.
          </p>
          <div className="scope">
            <span className="chip">{orchard.scope ?? "My Drive"}</span>
            <span className="chip">{fmtSize(orchard.totalBytes)}</span>
            <span className="chip">{orchard.folders.length} folders</span>
          </div>
        </div>
      </div>

      <div id="stats" className="hud">
        <div className="panel">
          <div className="stat">
            <div className="n">
              {(orchard.totalBytes / GB).toFixed(1)}
              <small>GB</small>
            </div>
            <div className="l">Billed</div>
          </div>
          <div className="stat">
            <div className="n warn">
              {(orchard.staleBytes / GB).toFixed(1)}
              <small>GB</small>
            </div>
            <div className="l">Stale 2yr+</div>
          </div>
        </div>
      </div>

      <div id="legend" className="hud">
        <div className="panel">
          <div className="t">Fruit ripeness · last touched</div>
          <div className="ramp" />
          <div className="ends">
            <span>fresh</span>
            <span>stale → fallen</span>
          </div>
        </div>
      </div>

      <InfoPanel inbox={inbox} news={news} />

      <FleetBar />

      <div id="hint" className="hud panel" ref={hintRef}>
        drag to orbit · scroll to zoom · hover a tree
      </div>

      <div id="tip" className={hovered ? "on" : ""} ref={tipRef}>
        {hovered && (
          <>
            <div className="fn">
              <span className="dot" style={{ color: dotColor }} />
              <span>{hovered.name}</span>
            </div>
            <div className="row">
              <span>Size</span>
              <span>{fmtSize(hovered.bytes)}</span>
            </div>
            <div className="row">
              <span>Fruit (files)</span>
              <span>{hovered.fileCount.toLocaleString()}</span>
            </div>
            <div className="row">
              <span>Last touched</span>
              <span>{fmtAge(hovered.lastTouchedISO)}</span>
            </div>
            <div className={`tend ${tendedBy ? "on" : ""}`}>
              <span className="beedot" />
              <span>{tendedBy} tending</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
