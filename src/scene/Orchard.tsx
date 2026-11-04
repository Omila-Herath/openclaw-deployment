import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import type { OrchardData, FleetData, Agent } from "../data/schema";
import { computeLayout } from "./layout";
import { windTime } from "./wind";
import Sky from "./Sky";
import Ground from "./Ground";
import Tree from "./Tree";
import Apples from "./Apples";
import FallenFruit from "./FallenFruit";
import Bees from "./Bees";

const reduced =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const DEFAULT_AGENTS: Agent[] = [
  { id: "drive", name: "Drive Keeper", color: "#ffcf4d", status: "tending", targetFolderId: null, progress: 0.3 },
  { id: "inbox", name: "Inbox Scout", color: "#7fd0ff", status: "flying", targetFolderId: null, progress: 0 },
  { id: "news", name: "News Forager", color: "#b7f06a", status: "tending", targetFolderId: null, progress: 0.6 },
];

export default function Orchard({
  orchard,
  fleet,
  live,
}: {
  orchard: OrchardData;
  fleet: FleetData | null;
  live: boolean;
}) {
  const layout = useMemo(() => computeLayout(orchard), [orchard]);
  const agents = fleet?.agents?.length ? fleet.agents : DEFAULT_AGENTS;

  useFrame(({ clock }) => {
    windTime.value = reduced ? 0 : clock.getElapsedTime();
  });

  return (
    <>
      <color attach="background" args={["#cfe0f2"]} />
      <fogExp2 attach="fog" args={["#e7dcc3", 0.0075]} />

      <hemisphereLight args={["#cfe3ff", "#6a5a38", 0.85]} />
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[34, 48, 20]}
        intensity={1.65}
        color="#fff0d4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0006}
        shadow-normalBias={0.4}
      >
        <orthographicCamera attach="shadow-camera" args={[-70, 70, 70, -70, 1, 160]} />
      </directionalLight>

      <Sky />
      <Ground />

      {layout.map((m) => (
        <Tree key={m.folder.id} m={m} />
      ))}
      <Apples layout={layout} />
      <FallenFruit layout={layout} />
      <Bees layout={layout} agents={agents} live={live} />

      {!reduced && (
        <Sparkles count={160} scale={[70, 24, 70]} position={[0, 11, -6]} size={3} speed={0.3} color="#fff4d0" opacity={0.5} />
      )}

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={16}
        maxDistance={110}
        minPolarAngle={0.18}
        maxPolarAngle={1.45}
        target={[0, 5, 0]}
        autoRotate={!reduced}
        autoRotateSpeed={0.28}
      />
    </>
  );
}
