import { MeshStandardMaterial, type Color } from "three";

// A single shared time uniform; every canopy material references this exact
// object, so advancing it once in <Orchard>'s useFrame sways the whole orchard.
export const windTime = { value: 0 };

/**
 * A MeshStandardMaterial whose vertices sway in the wind, weighted by height,
 * injected via onBeforeCompile so it keeps full PBR lighting.
 */
export function makeWindMaterial(color: Color): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windTime;
    shader.vertexShader = "uniform float uTime;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      [
        "#include <begin_vertex>",
        "float wh = clamp(position.y * 0.14 + 0.25, 0.0, 1.0);",
        "float sway = sin(uTime * 1.25 + position.x * 0.4 + position.z * 0.35) * 0.55;",
        "sway += sin(uTime * 2.3 + position.y * 0.3) * 0.18;",
        "transformed.x += sway * wh;",
        "transformed.z += cos(uTime * 1.05 + position.z * 0.4) * 0.42 * wh;",
      ].join("\n")
    );
  };
  return mat;
}
