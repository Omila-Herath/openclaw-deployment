import { useMemo } from "react";
import { Color } from "three";
import { Instances, Instance } from "@react-three/drei";
import type { TreeMetrics } from "./layout";
import { rngFor } from "./prng";
import { ripeColor } from "./ripeness";

interface Fallen {
  pos: [number, number, number];
  scale: [number, number, number];
  rot: [number, number, number];
  color: Color;
}

/** Rotten fruit on the ground under stale folders — the "untouched 2yr+" pile. */
export default function FallenFruit({ layout }: { layout: TreeMetrics[] }) {
  const items = useMemo(() => {
    const out: Fallen[] = [];
    for (const m of layout) {
      if (m.months < 18) continue;
      const rnd = rngFor(`${m.folder.id}|fallen`);
      const [px, , pz] = m.position;
      const fn = Math.round((m.months - 16) * 0.7 + m.norm * 22);
      for (let k = 0; k < fn; k++) {
        const a = rnd() * Math.PI * 2;
        const rr = m.canopyR * (0.3 + rnd() * 1.05);
        const s = 0.22 + rnd() * 0.18;
        out.push({
          pos: [px + Math.cos(a) * rr, s * 0.7, pz + Math.sin(a) * rr],
          scale: [s, s * 0.7, s],
          rot: [1.3, rnd() * 6.28, 0.4],
          color: ripeColor(38, (rnd() - 0.5) * 4),
        });
      }
    }
    return out;
  }, [layout]);

  if (!items.length) return null;

  return (
    <Instances limit={items.length} castShadow receiveShadow>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial roughness={0.85} metalness={0} />
      {items.map((a, i) => (
        <Instance key={i} position={a.pos} scale={a.scale} rotation={a.rot} color={a.color} />
      ))}
    </Instances>
  );
}
