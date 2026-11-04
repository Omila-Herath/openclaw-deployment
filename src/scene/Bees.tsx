import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import type { TreeMetrics } from "./layout";
import type { Agent } from "../data/schema";
import { fleetLive } from "../store";

const reduced =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Agents, as glowing bees.
 * - live mode: each bee flies to the folder its agent reports (targetFolderId)
 *   and its progress bar comes straight from the agent's `progress`.
 * - demo mode: bees wander and tend folders on their own so a shared link looks alive.
 */
export default function Bees({
  layout,
  agents,
  live,
}: {
  layout: TreeMetrics[];
  agents: Agent[];
  live: boolean;
}) {
  const byId = useMemo(() => {
    const m = new Map<string, TreeMetrics>();
    layout.forEach((t) => m.set(t.folder.id, t));
    return m;
  }, [layout]);

  if (!layout.length) return null;
  return (
    <>
      {agents.map((a) => (
        <Bee key={a.id} agent={a} byId={byId} layout={layout} live={live} />
      ))}
    </>
  );
}

function Bee({
  agent,
  byId,
  layout,
  live,
}: {
  agent: Agent;
  byId: Map<string, TreeMetrics>;
  layout: TreeMetrics[];
  live: boolean;
}) {
  const ref = useRef<Group>(null);
  const agentRef = useRef(agent);
  agentRef.current = agent; // always the latest polled agent state

  const sim = useRef({
    target: byId.get(agent.targetFolderId ?? "") ?? layout[Math.floor(Math.random() * layout.length)],
    dwell: agent.progress * 4.2,
    phase: Math.random() * 6.28,
    progress: agent.progress,
  });

  // In live mode, follow the folder the agent reports.
  useEffect(() => {
    if (!live) return;
    const t = byId.get(agent.targetFolderId ?? "");
    if (t) sim.current.target = t;
  }, [agent.targetFolderId, live, byId]);

  const tmp = useRef(new Vector3());

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const a = agentRef.current;
    const t = clock.getElapsedTime();
    const tgt = sim.current.target;
    if (!tgt) return;
    const [cx, cy, cz] = tgt.center;

    tmp.current.set(
      cx + Math.sin(t * 1.3 + sim.current.phase) * tgt.canopyR * 0.7,
      cy + Math.cos(t * 1.7 + sim.current.phase) * tgt.canopyR * 0.4 + 0.5,
      cz + Math.cos(t * 1.1 + sim.current.phase) * tgt.canopyR * 0.7
    );

    const d = g.position.distanceTo(tmp.current);
    const speed = reduced ? 0.02 : 0.045;
    g.position.lerp(tmp.current, Math.min(1, speed * (d > 3 ? 1.6 : 1)));
    g.scale.setScalar(1.3 + Math.sin(t * 6 + sim.current.phase) * 0.22);

    const close = d < tgt.canopyR + 2.2;
    let progress: number;
    let tending: boolean;
    let label: string;

    if (live) {
      // Data drives everything.
      tending = a.status === "tending";
      progress = Math.max(0, Math.min(1, a.progress ?? 0));
      label =
        a.status === "idle"
          ? "idle"
          : (a.status === "flying" ? "flying to " : "tending ") + tgt.folder.name;
    } else {
      // Self-driven simulation for the demo.
      if (close) {
        sim.current.dwell += reduced ? 0.004 : 0.016;
        sim.current.progress = Math.min(1, sim.current.dwell / 4);
        if (sim.current.dwell > 4.2) {
          sim.current.dwell = 0;
          sim.current.progress = 0;
          sim.current.target = layout[Math.floor(Math.random() * layout.length)];
          sim.current.phase = Math.random() * 6.28;
        }
      }
      tending = close;
      progress = close ? sim.current.progress : 0.08;
      label = (close ? "tending " : "flying to ") + tgt.folder.name;
    }

    fleetLive.current[a.id] = {
      id: a.id,
      name: a.name,
      color: a.color,
      taskLabel: label,
      progress,
      tending,
    };
  });

  return (
    <group ref={ref} position={[Math.random() * 20 - 10, 9, Math.random() * 20 - 10]}>
      <mesh>
        <sphereGeometry args={[0.32, 12, 12]} />
        <meshStandardMaterial color={agent.color} emissive={agent.color} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <pointLight color={agent.color} intensity={6} distance={10} decay={2} />
    </group>
  );
}
