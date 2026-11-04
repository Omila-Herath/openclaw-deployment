import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { useOrchardData } from "./data/useOrchardData";
import Orchard from "./scene/Orchard";
import Hud from "./hud/Hud";

export default function App() {
  const { orchard, fleet, inbox, news, weather, calendar, messages, error, isLive } = useOrchardData();

  if (error) {
    return (
      <div id="loading">
        <div className="m">Orchard unreachable</div>
        <div className="s">{error}</div>
      </div>
    );
  }
  if (!orchard) {
    return (
      <div id="loading">
        <div className="m">Growing the orchard…</div>
        <div className="s">reading your Drive scan</div>
      </div>
    );
  }

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.02 }}
        camera={{ fov: 46, near: 0.1, far: 500, position: [44, 26, 44] }}
        style={{ position: "fixed", inset: 0 }}
      >
        <Orchard orchard={orchard} fleet={fleet} live={isLive} weather={weather} calendar={calendar} messages={messages} />
      </Canvas>
      <Hud orchard={orchard} inbox={inbox} news={news} />
    </>
  );
}
