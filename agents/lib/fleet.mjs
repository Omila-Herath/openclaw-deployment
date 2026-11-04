// Shared helpers: where agents write data, and how they report "I'm working"
// into fleet.json (which the Orchard's bees + fleet bar read).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const HOME = process.env.HOME || process.env.USERPROFILE || ".";
export const DATA_DIR = process.env.DATA_DIR || join(HOME, ".openclaw", "data");

export function dataPath(name) {
  return join(DATA_DIR, name);
}

function readJSON(p, fallback) {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJSON(p, obj) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(obj, null, 2));
}

/** Write one of the data files the dashboard polls (inbox.json, news.json, …). */
export function writeData(name, obj) {
  writeJSON(dataPath(name), obj);
}

/**
 * Upsert this agent's live status into fleet.json so the dashboard shows it
 * working. { id, name, color, status: 'idle'|'flying'|'tending', targetFolderId, progress }
 */
export function setAgentStatus(agent) {
  const p = dataPath("fleet.json");
  const fleet = readJSON(p, { agents: [] });
  const i = fleet.agents.findIndex((a) => a.id === agent.id);
  const merged = { ...(i >= 0 ? fleet.agents[i] : {}), ...agent };
  if (i >= 0) fleet.agents[i] = merged;
  else fleet.agents.push(merged);
  writeJSON(p, fleet);
}
