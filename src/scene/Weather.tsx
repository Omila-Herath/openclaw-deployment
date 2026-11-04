import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, BufferGeometry, Color, Float32BufferAttribute, Points, ShaderMaterial, SphereGeometry } from "three";
import type { WeatherData, WeatherCondition } from "../data/schema";

// A full lighting/sky preset per weather condition (day + night variants).
interface Preset {
  top: string; bot: string; bg: string; fog: string; fogDensity: number;
  sun: string; sunI: number; sunPos: [number, number, number];
  hemiSky: string; hemiGround: string; hemiI: number; ambI: number;
  precip: "none" | "rain" | "storm" | "snow";
}

function presetFor(w: WeatherData | null): Preset {
  const cond: WeatherCondition = w?.condition ?? "clear";
  const day = w?.isDay ?? true;

  if (!day) {
    // Night — darker, cooler; lanterns & bees pop.
    const base: Preset = {
      top: "#0f1830", bot: "#2a3350", bg: "#141d33", fog: "#24304a", fogDensity: 0.009,
      sun: "#9fb4e0", sunI: 0.25, sunPos: [-30, 40, -20],
      hemiSky: "#2b3a5c", hemiGround: "#1a1a22", hemiI: 0.4, ambI: 0.1, precip: "none",
    };
    if (cond === "rain" || cond === "storm") return { ...base, top: "#0a1120", bot: "#1c2438", fog: "#1c2438", fogDensity: 0.016, hemiI: 0.3, precip: cond === "storm" ? "storm" : "rain" };
    if (cond === "snow") return { ...base, top: "#14203a", bot: "#394768", precip: "snow" };
    return base;
  }

  switch (cond) {
    case "cloudy":
      return { top: "#9fb0bf", bot: "#d9dde0", bg: "#c3cace", fog: "#cfd4d8", fogDensity: 0.009, sun: "#e8ebf0", sunI: 0.75, sunPos: [34, 48, 20], hemiSky: "#c4ccd4", hemiGround: "#6a5f50", hemiI: 0.9, ambI: 0.25, precip: "none" };
    case "partly":
      return { top: "#86b0e0", bot: "#eef0ea", bg: "#cdd9e4", fog: "#dde1dc", fogDensity: 0.008, sun: "#fff0d8", sunI: 1.3, sunPos: [34, 48, 20], hemiSky: "#cfe0f0", hemiGround: "#6a5f48", hemiI: 0.85, ambI: 0.18, precip: "none" };
    case "rain":
      return { top: "#6b7682", bot: "#9aa3ab", bg: "#8b949c", fog: "#9aa3ab", fogDensity: 0.015, sun: "#b9c2cb", sunI: 0.4, sunPos: [20, 44, 16], hemiSky: "#9aa6b0", hemiGround: "#5a5348", hemiI: 0.8, ambI: 0.3, precip: "rain" };
    case "storm":
      return { top: "#4a515c", bot: "#6f757d", bg: "#5c626b", fog: "#6f757d", fogDensity: 0.022, sun: "#9aa2ac", sunI: 0.3, sunPos: [20, 44, 16], hemiSky: "#7a828c", hemiGround: "#4a4740", hemiI: 0.75, ambI: 0.32, precip: "storm" };
    case "snow":
      return { top: "#aebccb", bot: "#eef1f4", bg: "#d6dde3", fog: "#e2e7eb", fogDensity: 0.013, sun: "#eef3f8", sunI: 0.8, sunPos: [28, 46, 18], hemiSky: "#d6e0ea", hemiGround: "#7a766e", hemiI: 0.95, ambI: 0.3, precip: "snow" };
    default: // clear
      return { top: "#8fb8ec", bot: "#fbe6c8", bg: "#cfe0f2", fog: "#e7dcc3", fogDensity: 0.0075, sun: "#fff0d4", sunI: 1.65, sunPos: [34, 48, 20], hemiSky: "#cfe3ff", hemiGround: "#6a5a38", hemiI: 0.85, ambI: 0.12, precip: "none" };
  }
}

function GradientSky({ top, bot }: { top: string; bot: string }) {
  const geo = useMemo(() => new SphereGeometry(300, 32, 16), []);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        uniforms: { top: { value: new Color(top) }, bot: { value: new Color(bot) } },
        vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bot; void main(){ float h=clamp(normalize(vP).y*0.5+0.5,0.0,1.0); h=pow(h,0.8); gl_FragColor=vec4(mix(bot,top,h),1.0);} `,
      }),
    []
  );
  useEffect(() => {
    (mat.uniforms.top.value as Color).set(top);
    (mat.uniforms.bot.value as Color).set(bot);
  }, [top, bot, mat]);
  return <mesh geometry={geo} material={mat} />;
}

function Precip({ type }: { type: "rain" | "storm" | "snow" }) {
  const ref = useRef<Points>(null);
  const snow = type === "snow";
  const N = snow ? 500 : type === "storm" ? 1100 : 700;
  const { geo, speeds } = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(N * 3);
    const spd: number[] = [];
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 90 - 6;
      spd.push((snow ? 2.5 : 22) * (0.7 + Math.random() * 0.6));
    }
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    return { geo: g, speeds: spd };
  }, [N, snow]);

  useFrame((_, dt) => {
    const d = Math.min(0.05, dt);
    const arr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] -= speeds[i] * d;
      if (snow) arr[i * 3] += Math.sin((arr[i * 3 + 1] + i) * 0.5) * 0.02;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 40;
        arr[i * 3] = (Math.random() - 0.5) * 90;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 90 - 6;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={snow ? "#ffffff" : "#aebccb"} size={snow ? 0.45 : 0.28} transparent opacity={snow ? 0.9 : 0.55} depthWrite={false} />
    </points>
  );
}

export default function Weather({ weather }: { weather: WeatherData | null }) {
  const p = useMemo(() => presetFor(weather), [weather]);
  const reduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <>
      <color attach="background" args={[p.bg]} />
      <fogExp2 attach="fog" args={[p.fog, p.fogDensity]} />
      <hemisphereLight args={[p.hemiSky, p.hemiGround, p.hemiI]} />
      <ambientLight intensity={p.ambI} />
      <directionalLight
        position={p.sunPos}
        intensity={p.sunI}
        color={p.sun}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0006}
        shadow-normalBias={0.4}
      >
        <orthographicCamera attach="shadow-camera" args={[-70, 70, 70, -70, 1, 160]} />
      </directionalLight>
      <GradientSky top={p.top} bot={p.bot} />
      {p.precip !== "none" && !reduced && <Precip type={p.precip} />}
    </>
  );
}
