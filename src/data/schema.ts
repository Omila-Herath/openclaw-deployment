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

// --- Inbox Scout output (inbox.json) ---
export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  receivedISO: string;
  importance: "high" | "normal";
}
export interface InboxData {
  updatedAt: string;
  unread: number;
  messages: EmailMessage[];
}

// --- News Forager output (news.json) ---
export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedISO: string;
  sentiment?: string;
}
export interface NewsData {
  updatedAt: string;
  topics: string[];
  items: NewsItem[];
}

// --- Weather agent output (weather.json) ---
export type WeatherCondition = "clear" | "partly" | "cloudy" | "rain" | "storm" | "snow";
export interface WeatherData {
  updatedAt: string;
  location?: string;
  tempC?: number;
  isDay?: boolean;
  condition: WeatherCondition;
}

// --- Calendar agent output (calendar.json) ---
export interface CalendarEvent {
  id: string;
  title: string;
  startISO: string;
  allDay?: boolean;
}
export interface CalendarData {
  updatedAt: string;
  events: CalendarEvent[];
}

// --- Messages agent output (messages.json) ---
export interface Message {
  id: string;
  from: string;
  platform?: string;
  preview: string;
  receivedISO: string;
}
export interface MessagesData {
  updatedAt: string;
  unread: number;
  items: Message[];
}
