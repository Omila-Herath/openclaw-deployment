import { useMemo } from "react";
import {
  CylinderGeometry,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Vector3,
} from "three";
import type { TreeMetrics } from "./layout";
import { rngFor } from "./prng";
import { leafColor } from "./ripeness";
import { makeWindMaterial } from "./wind";
import { useHover } from "../store";

// Shared geometries (created once).
const trunkGeo = new CylinderGeometry(0.5, 0.85, 1, 7, 4, false);
const blobGeo = (() => {
  const g = new IcosahedronGeometry(1, 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new Vector3(p.getX(i), p.getY(i), p.getZ(i));
    const n =
      0.86 + 0.26 * Math.sin(v.x * 3.1) * Math.cos(v.y * 2.7) * Math.sin(v.z * 3.3);
    v.multiplyScalar(n);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
})();
const barkMat = new MeshStandardMaterial({
  color: "#5a4327",
  roughness: 0.95,
  metalness: 0,
  flatShading: true,
});

export default function Tree({ m }: { m: TreeMetrics }) {
  const setHovered = useHover((s) => s.setHovered);

  const canopyMat = useMemo(() => makeWindMaterial(leafColor(m.months)), [m.folder.id, m.months]);

  const { limbs, blobs } = useMemo(() => {
    const rnd = rngFor(`${m.folder.id}|parts`);
    const limbs: { pos: [number, number, number]; rot: [number, number, number]; scl: [number, number, number] }[] = [];
    for (let l = 0; l < m.limbN; l++) {
      const a = rnd() * Math.PI * 2;
      const h = m.trunkH * (0.45 + rnd() * 0.4);
      limbs.push({
        pos: [Math.cos(a) * m.trunkR * 0.8, h, Math.sin(a) * m.trunkR * 0.8],
        rot: [Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7],
        scl: [m.trunkR * 0.4, m.trunkH * 0.5, m.trunkR * 0.4],
      });
    }
    const blobs: { pos: [number, number, number]; scl: [number, number, number] }[] = [];
    for (let b = 0; b < m.blobN; b++) {
      const a = rnd() * Math.PI * 2;
      const rr = m.canopyR * 0.45 * rnd();
      const s = m.canopyR * (0.55 + rnd() * 0.5);
      blobs.push({
        pos: [Math.cos(a) * rr, m.canopyY + (rnd() - 0.4) * m.canopyR * 0.5, Math.sin(a) * rr],
        scl: [s, s * 0.92, s],
      });
    }
    return { limbs, blobs };
  }, [m]);

  return (
    <group
      position={m.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(m.folder);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = "grab";
      }}
    >
      <mesh
        geometry={trunkGeo}
        material={barkMat}
        position={[0, m.trunkH / 2, 0]}
        rotation-z={m.lean}
        scale={[m.trunkR, m.trunkH, m.trunkR]}
        castShadow
        receiveShadow
      />
      {limbs.map((l, i) => (
        <mesh
          key={`l${i}`}
          geometry={trunkGeo}
          material={barkMat}
          position={l.pos}
          rotation={l.rot}
          scale={l.scl}
          castShadow
        />
      ))}
      {blobs.map((b, i) => (
        <mesh key={`b${i}`} geometry={blobGeo} material={canopyMat} position={b.pos} scale={b.scl} castShadow />
      ))}
    </group>
  );
}
