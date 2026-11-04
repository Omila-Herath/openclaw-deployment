import { useEffect, useState } from "react";
import { fleetLive, type LiveAgent } from "../store";
import { isLive } from "../data/useOrchardData";

/**
 * The agent activity bar. Bees write their live task to `fleetLive` every frame;
 * this reads it ~4x/second so we don't re-render React at 60fps.
 */
export default function FleetBar() {
  const [rows, setRows] = useState<LiveAgent[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      setRows(Object.values(fleetLive.current));
    }, 250);
    return () => clearInterval(id);
  }, []);

  const tending = rows.filter((r) => r.tending).length;

  return (
    <div id="fleet" className="hud">
      <div className="panel">
        <div className="fhd">
          <span className="t">
            Agent fleet
            <span className="chip" style={{ marginLeft: 7, fontSize: 9 }}>
              {isLive ? "LIVE" : "DEMO"}
            </span>
          </span>
          <span className="live">
            <i />
            {tending} tending
          </span>
        </div>
        {rows.length === 0 && <div className="task" style={{ opacity: 0.6 }}>waking agents…</div>}
        {rows.map((r) => (
          <div className="agent" key={r.id} style={{ color: r.color }}>
            <span className="swatch" style={{ background: r.color }} />
            <div>
              <div className="nm">{r.name}</div>
              <div className="task">{r.taskLabel}</div>
            </div>
            <div className="bar">
              <i style={{ width: `${Math.round(r.progress * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
