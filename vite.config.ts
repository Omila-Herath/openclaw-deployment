import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// If you deploy to GitHub Pages under a sub-path (https://user.github.io/openclaw-orchard/),
// set base to "/openclaw-orchard/". For Vercel / Netlify / a custom domain, leave it "/".
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Where OpenClaw serves its JSON. Only used by the dev proxy below.
  const openclaw = env.OPENCLAW_URL || "http://localhost:8787";

  return {
    base: "/",
    plugins: [react()],
    server: {
      // Dev-only proxy so the browser can poll OpenClaw without CORS headaches.
      // Set VITE_DATA_URL="/api" in .env.local to route through this.
      // Requests to /api/orchard.json -> ${openclaw}/orchard.json
      proxy: {
        "/api": {
          target: openclaw,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
      },
    },
  };
});
