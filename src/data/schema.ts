// The data contract between OpenClaw's agents and the Orchard renderer.
// Agents emit these shapes; the dashboard only ever reads them.
// Keep this file as the single source of truth for both sides.

export interface FolderNode {
  id: string;
  name: string;
  bytes: number;
  fileCount: number;
  /** ISO date string of last modification; drives fruit ripeness. */
  lastTouchedISO: string;
  parentId: string | null;
}

export interface OrchardData {
  scannedAt: string;
  scope?: string;
  totalBytes: number;
  /** Bytes in files untouched 2yr+ — the "fallen fruit" pile. */
  staleBytes: number;
  heaviest?: { name: string; bytes: number; lastTouchedISO: string };
  folders: FolderNode[];
}

export type AgentStatus = "idle" | "flying" | "tending";

export interface Agent {
  id: string;
  name: string;
  /** CSS color for the bee glow + fleet swatch. */
  color: string;
  status: AgentStatus;
  /** Folder the agent is currently working on, or null when idle. */
  targetFolderId: string | null;
  /** 0..1 progress of the current task. */
  progress: number;
}

export interface FleetData {
  agents: Agent[];
}
