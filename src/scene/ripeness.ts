import { Color } from "three";

const NOW = Date.now();
const MONTH = 1000 * 60 * 60 * 24 * 30.44;

/** Months since an ISO date (fruit ages with time-since-touched). */
export function monthsSince(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (NOW - t) / MONTH);
}

// Ripeness ramp: fresh (ripe red) -> stale (rotten brown).
const RAMP: { m: number; c: [number, number, number] }[] = [
  { m: 0, c: [0.85, 0.2, 0.16] },
  { m: 6, c: [0.91, 0.57, 0.23] },
  { m: 12, c: [0.85, 0.76, 0.23] },
  { m: 22, c: [0.54, 0.42, 0.22] },
  { m: 40, c: [0.41, 0.32, 0.18] },
];

export function ripeColor(months: number, jitter = 0): Color {
  const m = months + jitter;
  let a = RAMP[0];
  let b = RAMP[RAMP.length - 1];
  if (m <= RAMP[0].m) {
    a = b = RAMP[0];
  } else {
    for (let i = 0; i < RAMP.length - 1; i++) {
      if (m >= RAMP[i].m && m <= RAMP[i + 1].m) {
        a = RAMP[i];
        b = RAMP[i + 1];
        break;
      }
    }
  }
  const t = b.m === a.m ? 0 : Math.min(1, Math.max(0, (m - a.m) / (b.m - a.m)));
  return new Color(
    a.c[0] + (b.c[0] - a.c[0]) * t,
    a.c[1] + (b.c[1] - a.c[1]) * t,
    a.c[2] + (b.c[2] - a.c[2]) * t
  );
}

/** Canopy leaves yellow and thin as the folder ages. */
export function leafColor(months: number): Color {
  const t = Math.min(1, months / 30);
  return new Color().setHSL(0.27 - 0.1 * t, 0.52 - 0.15 * t, 0.3 + 0.08 * t);
}
