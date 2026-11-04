/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional override: URL (or base path) the live orchard.json / fleet.json are served from. */
  readonly VITE_DATA_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
