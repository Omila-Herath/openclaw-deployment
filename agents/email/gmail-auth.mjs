// One-time Gmail OAuth. Prints your GMAIL_REFRESH_TOKEN; paste it into .env.
// Needs GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET set first.
// Run: node email/gmail-auth.mjs  → open the printed URL → approve → done.

import "dotenv/config"; // loads .env from the current working directory
import http from "node:http";
import { google } from "googleapis";

const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}`;

if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env first (see README).");
  process.exit(1);
}

const oauth = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET, REDIRECT);
const url = oauth.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/gmail.readonly"],
});

console.log("\n1) Open this URL in your browser and approve access:\n\n" + url + "\n");

http
  .createServer(async (req, res) => {
    try {
      const u = new URL(req.url, REDIRECT);
      const code = u.searchParams.get("code");
      if (!code) {
        res.end("Waiting for Google redirect…");
        return;
      }
      const { tokens } = await oauth.getToken(code);
      res.end("Authorized. You can close this tab and return to the terminal.");
      if (tokens.refresh_token) {
        console.log("\n2) Add this line to agents/.env :\n\nGMAIL_REFRESH_TOKEN=" + tokens.refresh_token + "\n");
      } else {
        console.log("\nNo refresh_token returned. Remove the app's access at myaccount.google.com/permissions and run again.");
      }
      process.exit(0);
    } catch (e) {
      res.end("Error: " + (e.message || e));
      console.error(e);
      process.exit(1);
    }
  })
  .listen(PORT, () => console.log(`(listening on ${REDIRECT} for the redirect…)`));
