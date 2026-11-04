import { useMemo } from "react";
import { CircleGeometry, Color, Float32BufferAttribute } from "three";

/** Grassy ground with a subtle warm radial falloff baked into vertex colors. */
export default function Ground() {
  const geo = useMemo(() => {
    const g = new CircleGeometry(150, 64);
    const pos = g.attributes.position;
    const base = new Color("#768f42");
    const edge = new Color("#8f7a3c");
    const col: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const d = Math.min(1, Math.hypot(pos.getX(i), pos.getY(i)) / 150);
      const c = base.clone().lerp(edge, d * d);
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new Float32BufferAttribute(col, 3));
    return g;
  }, []);

  return (
    <mesh geometry={geo} rotation-x={-Math.PI / 2} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} metalness={0} />
    </mesh>
  );
}
