#!/usr/bin/env node
// Turn an OpenClaw Drive-scan export into the orchard.json the dashboard reads.
//
// Usage:
//   node tools/openclaw-adapter.mjs <input-scan.json> [output.json]
//
// Edit mapScan() to match whatever your OpenClaw agent actually emits.
// The OUTPUT shape is fixed — it must match src/data/schema.ts.

import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath = "public/sample/orchard.json"] = process.argv;
if (!inPath) {
  console.error("usage: node tools/openclaw-adapter.mjs <input-scan.json> [output.json]");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inPath, "utf8"));

function slug(name, i) {
  return (
    (name || `folder-${i}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `folder-${i}`
  );
}

function mapScan(scan) {
  // >>> ADAPT THIS to your OpenClaw output <<<
  // This assumes scan.folders[] with { name, sizeBytes, files, modifiedTime }.
  const src = scan.folders ?? scan.items ?? [];
  const folders = src.map((f, i) => ({
    id: f.id ?? slug(f.name, i),
    name: f.name ?? `Folder ${i}`,
    bytes: f.sizeBytes ?? f.bytes ?? 0,
    fileCount: f.files ?? f.fileCount ?? 0,
    lastTouchedISO: (f.modifiedTime ?? f.lastTouchedISO ?? new Date().toISOString()).slice(0, 10),
    parentId: f.parentId ?? null,
  }));

  const totalBytes = scan.totalBytes ?? folders.reduce((s, f) => s + f.bytes, 0);
  const TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;
  const now = Date.now();
  const staleBytes =
    scan.staleBytes ??
    folders
      .filter((f) => now - Date.parse(f.lastTouchedISO) > TWO_YEARS)
      .reduce((s, f) => s + f.bytes, 0);

  return {
    scannedAt: scan.scannedAt ?? new Date().toISOString(),
    scope: scan.scope ?? "My Drive",
    totalBytes,
    staleBytes,
    heaviest: scan.heaviest,
    folders,
  };
}

const out = mapScan(raw);
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`✓ wrote ${outPath} — ${out.folders.length} folders, ${(out.totalBytes / 1073741824).toFixed(1)} GB`);
