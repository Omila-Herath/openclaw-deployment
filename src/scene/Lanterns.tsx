import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, CatmullRomCurve3, Vector3 } from "three";
import { Line } from "@react-three/drei";
import type { CalendarData } from "../data/schema";

// A string of lanterns across the sky, one per upcoming event.
// Soonest event = brightest & largest; later events fade back.
const MAX = 7;

function arcPoint(t: number): [number, number, number] {
  const x = -22 + 44 * t;
  const baseY = 15 + 2 * t;
  const sag = 4 * (1 - Math.pow(2 * t - 1, 2)); // lowest in the middle
  return [x, baseY - sag, 6];
}

export default function Lanterns({ calendar }: { calendar: CalendarData | null }) {
  const events = (calendar?.events ?? []).slice(0, MAX);

  const wire = useMemo(() => {
    const pts = Array.from({ length: 40 }, (_, i) => new Vector3(...arcPoint(i / 39)));
    return new CatmullRomCurve3(pts).getPoints(60);
  }, []);

  if (!events.length) return null;

  const n = events.length;
  return (
    <group>
      <Line points={wire} color="#5a4a30" lineWidth={1.4} transparent opacity={0.5} />
      {events.map((e, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const soonest = i === 0;
        return <Lantern key={e.id} pos={arcPoint(t)} soonest={soonest} phase={i * 1.7} />;
      })}
    </group>
  );
}

function Lantern({ pos, soonest, phase }: { pos: [number, number, number]; soonest: boolean; phase: number }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.8 + phase) * 0.12;
  });
  const color = soonest ? "#fff0b0" : "#ffcf6a";
  const glow = soonest ? 3.2 : 1.8;
  const size = soonest ? 0.9 : 0.62;
  return (
    <group position={pos}>
      <group ref={ref}>
        {/* stem up to the wire */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
          <meshStandardMaterial color="#4a3c26" />
        </mesh>
        {/* lantern body */}
        <mesh position={[0, -0.6, 0]}>
          <sphereGeometry args={[size, 14, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.6 + size * 0.95, 0]}>
          <cylinderGeometry args={[size * 0.4, size * 0.5, 0.18, 8]} />
          <meshStandardMaterial color="#4a3c26" />
        </mesh>
        {soonest && <pointLight position={[0, -0.6, 0]} color={color} intensity={5} distance={14} decay={2} />}
      </group>
    </group>
  );
}
