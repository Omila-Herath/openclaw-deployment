import { create } from "zustand";
import type { FolderNode } from "./data/schema";

interface HoverState {
  hovered: FolderNode | null;
  tendedBy: string | null; // agent name currently tending the hovered folder
  setHovered: (f: FolderNode | null, tendedBy?: string | null) => void;
}

export const useHover = create<HoverState>((set) => ({
  hovered: null,
  tendedBy: null,
  setHovered: (f, tendedBy = null) => set({ hovered: f, tendedBy }),
}));

// Live per-agent task state, written every frame by <Bees> and read a few
// times per second by <FleetBar>. Kept out of React state to avoid re-rendering
// the whole tree 60x/second.
export interface LiveAgent {
  id: string;
  name: string;
  color: string;
  taskLabel: string;
  progress: number;
  tending: boolean;
}
export const fleetLive: { current: Record<string, LiveAgent> } = { current: {} };
