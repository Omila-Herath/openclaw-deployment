import type { FolderNode, OrchardData } from "../data/schema";
import { rngFor } from "./prng";

export interface TreeMetrics {
  folder: FolderNode;
  position: [number, number, number];
  /** 0..1 size of this folder relative to the largest. */
  norm: number;
  trunkH: number;
  trunkR: number;
  canopyR: number;
  canopyY: number;
  lean: number;
  blobN: number;
  limbN: number;
  months: number;
  /** World-space canopy centre, where bees fly to. */
  center: [number, number, number];
}

/**
 * Deterministic orchard layout. Biggest folders become the biggest trees and
 * are placed first near the centre; everything spirals out with a golden angle.
 * Both <Tree> and <Bees> read these metrics so trees and bees always agree.
 */
export function computeLayout(data: OrchardData): TreeMetrics[] {
  const folders = [...data.folders].sort((a, b) => b.bytes - a.bytes);
  const logs = folders.map((f) => Math.log(Math.max(1, f.bytes)));
  const bMin = Math.min(...logs);
  const bMax = Math.max(...logs);
  const norm = (b: number) =>
    bMax === bMin ? 0.5 : (Math.log(Math.max(1, b)) - bMin) / (bMax - bMin);

  const MONTH = 1000 * 60 * 60 * 24 * 30.44;
  const now = Date.now();

  return folders.map((f, i) => {
    const rnd = rngFor(`${f.id}|tree`);
    const n = norm(f.bytes);
    const months = Math.max(0, (now - Date.parse(f.lastTouchedISO)) / MONTH);

    const ga = i * 2.39996;
    const rad = 4 + 6.4 * Math.sqrt(i) + rnd() * 2.2;
    const px = Math.cos(ga) * rad;
    const pz = Math.sin(ga) * rad - 6;

    const trunkH = 3.0 + 4.8 * n + rnd() * 0.8;
    const trunkR = 0.6 + 1.5 * n;
    const canopyR = 2.6 + 3.9 * n + rnd() * 0.6;
    const canopyY = trunkH + canopyR * 0.35;
    const lean = (rnd() - 0.5) * 0.12 * (1 + (months > 24 ? 1 : 0));
    const blobN = 3 + Math.round(n * 4);
    const limbN = Math.round(1 + n * 3);

    return {
      folder: f,
      position: [px, 0, pz],
      norm: n,
      trunkH,
      trunkR,
      canopyR,
      canopyY,
      lean,
      blobN,
      limbN,
      months,
      center: [px, canopyY, pz],
    };
  });
}
