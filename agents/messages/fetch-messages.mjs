// Messenger — gathers recent chat messages and writes messages.json, shown as
// birds circling the orchard (more unread, more birds).
//
// Source is configurable so you can bridge Slack / Discord / WhatsApp however you like:
//   MESSAGES_URL   — an endpoint returning JSON (an array, or { items: [...] })
//   MESSAGES_FILE  — a local JSON file (same shape) that some bridge keeps updated
// Each item should have: from, preview (and optionally platform, receivedISO, id).

import "dotenv/config";
import { readFileSync } from "node:fs";
import { writeData, setAgentStatus } from "../lib/fleet.mjs";

const AGENT = { id: "messages", name: "Messenger", color: "#5ad1a0" };
const MAX = 12;

function normalize(raw) {
  const arr = Array.isArray(raw) ? raw : raw?.items ?? [];
  return arr.slice(0, MAX).map((m, i) => ({
    id: String(m.id ?? i),
    from: String(m.from ?? m.sender ?? m.author ?? "Unknown"),
    platform: m.platform ?? m.source ?? "chat",
    preview: String(m.preview ?? m.text ?? m.message ?? "").slice(0, 160),
    receivedISO: m.receivedISO ?? m.ts ?? new Date().toISOString(),
  }));
}

async function main() {
  setAgentStatus({ ...AGENT, status: "flying", targetFolderId: null, progress: 0.3 });

  let raw = [];
  if (process.env.MESSAGES_URL) {
    const res = await fetch(process.env.MESSAGES_URL);
    if (!res.ok) throw new Error(`messages source ${res.status}`);
    raw = await res.json();
  } else if (process.env.MESSAGES_FILE) {
    raw = JSON.parse(readFileSync(process.env.MESSAGES_FILE, "utf8"));
  } else {
    console.warn("No MESSAGES_URL or MESSAGES_FILE set — writing an empty messages.json.");
  }

  const items = normalize(raw);
  writeData("messages.json", { updatedAt: new Date().toISOString(), unread: items.length, items });
  setAgentStatus({ ...AGENT, status: "tending", targetFolderId: null, progress: 1 });
  console.log(`messages.json written — ${items.length} messages`);
}

main().catch((e) => {
  console.error(e.message || e);
  setAgentStatus({ ...AGENT, status: "idle", targetFolderId: null, progress: 0 });
  process.exit(1);
});
