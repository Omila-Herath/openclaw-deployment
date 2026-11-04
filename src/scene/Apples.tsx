import { useMemo } from "react";
import { Color } from "three";
import { Instances, Instance } from "@react-three/drei";
import type { TreeMetrics } from "./layout";
import { rngFor } from "./prng";
import { ripeColor } from "./ripeness";

interface AppleInst {
  pos: [number, number, number];
  scale: [number, number, number];
  rot: [number, number, number];
  color: Color;
}

const GB = 1024 * 1024 * 1024;

/** One InstancedMesh for every apple in the orchard. Fruit = files; color = ripeness. */
export default function Apples({ layout }: { layout: TreeMetrics[] }) {
  const apples = useMemo(() => {
    const out: AppleInst[] = [];
    for (const m of layout) {
      const rnd = rngFor(`${m.folder.id}|fruit`);
      const [px, , pz] = m.position;
      const fruitN = Math.min(46, Math.max(4, Math.round(Math.sqrt(m.folder.fileCount) * 2.1)));
      for (let k = 0; k < fruitN; k++) {
        const a = rnd() * Math.PI * 2;
        const b = Math.acos(rnd() * 0.9);
        const rr = m.canopyR * (0.72 + rnd() * 0.3);
        const wx = px + Math.sin(b) * Math.cos(a) * rr;
        const wy = m.canopyY + Math.cos(b) * rr * 0.9 - 0.2;
        const wz = pz + Math.sin(b) * Math.sin(a) * rr;
        const sz = 0.26 + rnd() * 0.22 + m.norm * 0.18;
        const rot = rnd() * 6.28;
        out.push({
          pos: [wx, wy, wz],
          scale: [sz, sz * 0.92, sz],
          rot: [rot * 0.3, rot, rot * 0.2],
          color: ripeColor(m.months, (rnd() - 0.5) * 6),
        });
      }
      // one heavy apple for folders with big files
      if (m.folder.bytes >= 1.7 * GB) {
        const sz = 0.55 + m.norm * 0.4;
        out.push({
          pos: [px + (rnd() - 0.5) * m.canopyR, m.canopyY - m.canopyR * 0.3, pz + (rnd() - 0.5) * m.canopyR],
          scale: [sz, sz * 0.92, sz],
          rot: [0, rnd() * 6.28, 0],
          color: ripeColor(m.months, 0),
        });
      }
    }
    return out;
  }, [layout]);

  if (!apples.length) return null;

  return (
    <Instances limit={apples.length} castShadow>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial roughness={0.38} metalness={0} />
      {apples.map((a, i) => (
        <Instance key={i} position={a.pos} scale={a.scale} rotation={a.rot} color={a.color} />
      ))}
    </Instances>
  );
}
