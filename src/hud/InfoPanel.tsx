import { useState } from "react";
import type { InboxData, NewsData } from "../data/schema";

function ago(iso: string): string {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (Number.isNaN(s)) return "";
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export default function InfoPanel({ inbox, news }: { inbox: InboxData | null; news: NewsData | null }) {
  const [tab, setTab] = useState<"inbox" | "news">("inbox");
  const [open, setOpen] = useState(true);

  // Nothing to show yet (agents haven't written their files).
  if (!inbox && !news) return null;

  const unread = inbox?.unread ?? 0;

  return (
    <div id="info" className="hud">
      <div className="panel">
        <div className="itabs">
          <button className={`itab ${tab === "inbox" ? "on" : ""}`} onClick={() => { setTab("inbox"); setOpen(true); }}>
            Inbox{unread ? ` · ${unread}` : ""}
          </button>
          <button className={`itab ${tab === "news" ? "on" : ""}`} onClick={() => { setTab("news"); setOpen(true); }}>
            News{news?.items.length ? ` · ${news.items.length}` : ""}
          </button>
          <button className="itog" onClick={() => setOpen((o) => !o)} aria-label="toggle panel">
            {open ? "–" : "+"}
          </button>
        </div>

        {open && tab === "inbox" && (
          <div className="ilist">
            {!inbox || inbox.messages.length === 0 ? (
              <div className="iempty">Inbox Scout hasn't reported unread mail.</div>
            ) : (
              inbox.messages.map((m) => (
                <div className={`irow ${m.importance === "high" ? "hi" : ""}`} key={m.id}>
                  <div className="itop">
                    <span className="ifrom">{m.from}</span>
                    <span className="iwhen">{ago(m.receivedISO)}</span>
                  </div>
                  <div className="isub">{m.subject}</div>
                  <div className="isnip">{m.snippet}</div>
                </div>
              ))
            )}
          </div>
        )}

        {open && tab === "news" && (
          <div className="ilist">
            {!news || news.items.length === 0 ? (
              <div className="iempty">News Forager hasn't brought headlines yet.</div>
            ) : (
              news.items.map((n) => (
                <a className="irow nrow" key={n.id} href={n.url} target="_blank" rel="noreferrer">
                  <div className="itop">
                    <span className="isrc">{n.source}</span>
                    <span className="iwhen">{ago(n.publishedISO)}</span>
                  </div>
                  <div className="isub">{n.title}</div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
