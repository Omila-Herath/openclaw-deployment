// Drive Keeper — scans your Google Drive, aggregates each top-level folder's
// total size / file count / last-modified, and writes orchard.json (the trees).
// Needs GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET (same OAuth app) + GDRIVE_REFRESH_TOKEN.
// Get the token once with: npm run auth:drive

import "dotenv/config";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";
import { writeData, setAgentStatus } from "../lib/fleet.mjs";

const AGENT = { id: "drive", name: "Drive Keeper", color: "#ffcf4d" };
const FOLDER_MIME = "application/vnd.google-apps.folder";
const TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;

function slug(name, i) {
  return (
    (name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `folder-${i}`
  );
}

// Pure aggregation (exported for testing): given a Map of id -> {name,size,parents,mime,mtime}
// and the root id, roll files up into their top-level folder and build the orchard object.
export function buildOrchard(files, root, now = Date.now()) {
  const memo = new Map();
  function topBucket(id, depth = 0) {
    if (memo.has(id)) return memo.get(id);
    const f = files.get(id);
    let res = null;
    if (f && depth < 60) {
      if ((f.parents || []).includes(root)) res = id;
      else {
        for (const p of f.parents || []) {
          const b = topBucket(p, depth + 1);
          if (b) { res = b; break; }
        }
      }
    }
    memo.set(id, res);
    return res;
  }

  const ROOT = "__root__";
  const ORPH = "__orphaned__";
  const buckets = new Map();
  let totalBytes = 0;
  let staleBytes = 0;

  for (const [id, f] of files) {
    if (f.mime === FOLDER_MIME || !f.size) continue;
    const top = topBucket(id);
    let bid, bname;
    if (top === null) { bid = ORPH; bname = "Orphaned"; }
    else if (top === id) { bid = ROOT; bname = "My Drive (loose files)"; }
    else { bid = top; bname = files.get(top)?.name || "Folder"; }

    const b = buckets.get(bid) || { name: bname, bytes: 0, fileCount: 0, latest: 0 };
    b.bytes += f.size;
    b.fileCount += 1;
    const t = Date.parse(f.mtime) || 0;
    if (t > b.latest) b.latest = t;
    buckets.set(bid, b);

    totalBytes += f.size;
    if (now - t > TWO_YEARS) staleBytes += f.size;
  }

  const folders = [...buckets.entries()]
    .map(([id, b], i) => ({
      id: id === ROOT ? "root" : id === ORPH ? "orphaned" : slug(b.name, i),
      name: b.name,
      bytes: b.bytes,
      fileCount: b.fileCount,
      lastTouchedISO: new Date(b.latest || now).toISOString().slice(0, 10),
      parentId: null,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return { scannedAt: new Date(now).toISOString(), scope: "My Drive", totalBytes, staleBytes, folders };
}

async function main() {
  if (!process.env.GDRIVE_REFRESH_TOKEN) {
    throw new Error("No GDRIVE_REFRESH_TOKEN — run `npm run auth:drive` first (see agents/README.md).");
  }
  setAgentStatus({ ...AGENT, status: "flying", targetFolderId: null, progress: 0.1 });

  const oauth = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET);
  oauth.setCredentials({ refresh_token: process.env.GDRIVE_REFRESH_TOKEN });
  const drive = google.drive({ version: "v3", auth: oauth });

  const root = (await drive.files.get({ fileId: "root", fields: "id" })).data.id;

  // 1) Pull metadata for every (non-trashed) file.
  const files = new Map(); // id -> { name, size, parents, mime, mtime }
  let pageToken;
  let fetched = 0;
  do {
    const r = await drive.files.list({
      q: "trashed=false",
      fields: "nextPageToken, files(id,name,size,mimeType,modifiedTime,parents)",
      pageSize: 1000,
      pageToken,
    });
    for (const f of r.data.files || []) {
      files.set(f.id, {
        name: f.name,
        size: Number(f.size || 0),
        parents: f.parents || [],
        mime: f.mimeType,
        mtime: f.modifiedTime,
      });
    }
    fetched += (r.data.files || []).length;
    pageToken = r.data.nextPageToken;
    setAgentStatus({ ...AGENT, status: "tending", targetFolderId: null, progress: Math.min(0.9, fetched / 5000) });
  } while (pageToken);

  // 2) Aggregate into top-level folders and write orchard.json.
  const orchard = buildOrchard(files, root);
  writeData("orchard.json", orchard);

  const folders = orchard.folders;
  setAgentStatus({ ...AGENT, status: "tending", targetFolderId: folders[0]?.id ?? null, progress: 1 });
  console.log(`orchard.json written — ${folders.length} folders, ${(orchard.totalBytes / 1073741824).toFixed(1)} GB (${files.size} items scanned)`);
}

// Only run the live scan when executed directly (not when imported for tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e.message || e);
    setAgentStatus({ ...AGENT, status: "idle", targetFolderId: null, progress: 0 });
    process.exit(1);
  });
}
