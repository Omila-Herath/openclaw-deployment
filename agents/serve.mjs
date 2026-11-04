// Tiny static server for the agents' data dir, so the Orchard dashboard can
// poll it over HTTP (with CORS + no-cache). Run: node serve.mjs
// Then set the dashboard's VITE_DATA_URL to http://localhost:8787

import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { DATA_DIR } from "./lib/fleet.mjs";

const PORT = Number(process.env.DATA_PORT || 8787);
const TYPES = { ".json": "application/json" };

http
  .createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    const name = normalize(decodeURIComponent((req.url || "/").split("?")[0])).replace(/^(\.\.(\/|\\|$))+/, "");
    if (name === "/" || name === "\\") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, serving: DATA_DIR, files: ["orchard.json", "inbox.json", "news.json", "fleet.json"] }));
      return;
    }
    try {
      const file = join(DATA_DIR, name);
      const body = await readFile(file);
      res.setHeader("Content-Type", TYPES[name.slice(name.lastIndexOf("."))] || "application/octet-stream");
      res.end(body);
    } catch {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "not found", name }));
    }
  })
  .listen(PORT, () => console.log(`Serving ${DATA_DIR} at http://localhost:${PORT}  (set VITE_DATA_URL to this)`));
