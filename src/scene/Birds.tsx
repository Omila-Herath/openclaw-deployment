import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import type { MessagesData } from "../data/schema";

// Birds circling over the orchard — more unread messages, more birds.
const MAX = 8;

const reduced =
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Birds({ messages }: { messages: MessagesData | null }) {
  const count = Math.min(MAX, messages ? Math.max(messages.unread || 0, messages.items.length) : 0);
  const birds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        r: 10 + (i % 4) * 6 + Math.random() * 3,
        h: 11 + (i % 3) * 3 + Math.random() * 2,
        speed: 0.25 + Math.random() * 0.25,
        dir: Math.random() > 0.5 ? 1 : -1,
        phase: Math.random() * 6.28,
        flap: 7 + Math.random() * 4,
      })),
    [count]
  );

  if (!count) return null;
  return (
    <>
      {birds.map((b, i) => (
        <Bird key={i} {...b} />
      ))}
    </>
  );
}

function Bird({ r, h, speed, dir, phase, flap }: { r: number; h: number; speed: number; dir: number; phase: number; flap: number }) {
  const ref = useRef<Group>(null);
  const lw = useRef<Group>(null);
  const rw = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const a = phase + t * speed * dir;
    const g = ref.current;
    if (!g) return;
    g.position.set(Math.cos(a) * r, h + Math.sin(t * 1.6 + phase) * 0.7, Math.sin(a) * r - 6);
    g.rotation.y = -a + (dir > 0 ? Math.PI : 0);
    const f = reduced ? 0.3 : Math.sin(t * flap + phase) * 0.7 + 0.2;
    if (lw.current) lw.current.rotation.z = f;
    if (rw.current) rw.current.rotation.z = -f;
  });

  return (
    <group ref={ref} scale={0.9}>
      {/* body */}
      <mesh rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.16, 0.9, 6]} />
        <meshStandardMaterial color="#2b2b33" roughness={0.8} />
      </mesh>
      {/* wings */}
      <group ref={lw}>
        <mesh position={[-0.65, 0, 0]}>
          <boxGeometry args={[1.3, 0.05, 0.5]} />
          <meshStandardMaterial color="#33333c" roughness={0.9} />
        </mesh>
      </group>
      <group ref={rw}>
        <mesh position={[0.65, 0, 0]}>
          <boxGeometry args={[1.3, 0.05, 0.5]} />
          <meshStandardMaterial color="#33333c" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
