import { useMemo } from "react";
import { BackSide, Color, ShaderMaterial, SphereGeometry } from "three";

/** A soft vertical gradient sky dome (warm horizon, cool zenith). */
export default function Sky() {
  const geo = useMemo(() => new SphereGeometry(300, 32, 16), []);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new Color("#8fb8ec") },
          bot: { value: new Color("#fbe6c8") },
        },
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bot;
          void main(){ float h = clamp(normalize(vP).y * 0.5 + 0.5, 0.0, 1.0); h = pow(h, 0.8); gl_FragColor = vec4(mix(bot, top, h), 1.0); }`,
      }),
    []
  );
  return <mesh geometry={geo} material={mat} />;
}
