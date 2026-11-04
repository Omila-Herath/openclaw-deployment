// News Forager — pulls RSS feeds, writes news.json, and reports its status.
// Run: node news/fetch-news.mjs   (reads RSS_FEEDS / NEWS_TOPICS from env)

import Parser from "rss-parser";
import { writeData, setAgentStatus } from "../lib/fleet.mjs";

const AGENT = { id: "news", name: "News Forager", color: "#b7f06a" };

const FEEDS = (
  process.env.RSS_FEEDS ||
  "https://feeds.bbci.co.uk/news/world/rss.xml,https://feeds.arstechnica.com/arstechnica/index"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const TOPICS = (process.env.NEWS_TOPICS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const parser = new Parser({ timeout: 15000 });

async function main() {
  setAgentStatus({ ...AGENT, status: "flying", targetFolderId: null, progress: 0.1 });

  const items = [];
  for (let i = 0; i < FEEDS.length; i++) {
    try {
      const feed = await parser.parseURL(FEEDS[i]);
      const source = feed.title || new URL(FEEDS[i]).hostname;
      for (const e of (feed.items || []).slice(0, 8)) {
        const title = e.title || "";
        if (TOPICS.length && !TOPICS.some((t) => title.toLowerCase().includes(t.toLowerCase()))) continue;
        items.push({
          id: e.guid || e.link || title,
          title,
          source,
          url: e.link || "",
          publishedISO: e.isoDate || new Date().toISOString(),
          sentiment: "neutral", // let an OpenClaw agent enrich this later
        });
      }
    } catch (err) {
      console.error("feed failed:", FEEDS[i], err.message);
    }
    setAgentStatus({ ...AGENT, status: "tending", targetFolderId: null, progress: (i + 1) / FEEDS.length });
  }

  items.sort((a, b) => Date.parse(b.publishedISO) - Date.parse(a.publishedISO));

  writeData("news.json", {
    updatedAt: new Date().toISOString(),
    topics: TOPICS,
    items: items.slice(0, 20),
  });

  setAgentStatus({ ...AGENT, status: "tending", targetFolderId: null, progress: 1 });
  console.log(`news.json written — ${Math.min(items.length, 20)} headlines from ${FEEDS.length} feeds`);
}

main().catch((e) => {
  console.error(e);
  setAgentStatus({ ...AGENT, status: "idle", targetFolderId: null, progress: 0 });
  process.exit(1);
});
