// Inbox Scout — pulls unread Gmail, writes inbox.json, and reports its status.
// Needs GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN (see README).
// Run: node email/fetch-inbox.mjs

import { google } from "googleapis";
import { writeData, setAgentStatus } from "../lib/fleet.mjs";

const AGENT = { id: "inbox", name: "Inbox Scout", color: "#7fd0ff" };
const MAX = 12;

function sender(from = "") {
  // "Jane Doe <jane@x.com>" -> "Jane Doe"; "jane@x.com" -> "jane@x.com"
  const m = from.match(/^\s*"?([^"<]+?)"?\s*<.*>\s*$/);
  return (m ? m[1] : from).trim();
}

async function main() {
  if (!process.env.GMAIL_REFRESH_TOKEN) {
    throw new Error("No GMAIL_REFRESH_TOKEN — run `npm run auth:gmail` first (see agents/README.md).");
  }
  setAgentStatus({ ...AGENT, status: "flying", targetFolderId: null, progress: 0.1 });

  const oauth = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET);
  oauth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  const gmail = google.gmail({ version: "v1", auth: oauth });

  const list = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread -category:promotions -category:social",
    maxResults: MAX,
  });
  const ids = (list.data.messages || []).map((m) => m.id);

  const messages = [];
  for (let i = 0; i < ids.length; i++) {
    const r = await gmail.users.messages.get({
      userId: "me",
      id: ids[i],
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });
    const h = Object.fromEntries((r.data.payload?.headers || []).map((x) => [x.name, x.value]));
    messages.push({
      id: ids[i],
      from: sender(h.From || ""),
      subject: h.Subject || "(no subject)",
      snippet: (r.data.snippet || "").slice(0, 140),
      receivedISO: new Date(Number(r.data.internalDate) || Date.now()).toISOString(),
      importance: (r.data.labelIds || []).includes("IMPORTANT") ? "high" : "normal",
    });
    setAgentStatus({ ...AGENT, status: "tending", targetFolderId: null, progress: (i + 1) / Math.max(1, ids.length) });
  }

  writeData("inbox.json", {
    updatedAt: new Date().toISOString(),
    unread: messages.length,
    messages,
  });

  setAgentStatus({ ...AGENT, status: "tending", targetFolderId: null, progress: 1 });
  console.log(`inbox.json written — ${messages.length} unread`);
}

main().catch((e) => {
  console.error(e.message || e);
  setAgentStatus({ ...AGENT, status: "idle", targetFolderId: null, progress: 0 });
  process.exit(1);
});
