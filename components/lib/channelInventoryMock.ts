// Per-room-type, per-OTA-channel availability control (stop-sell / open-sell).
// This is real, functional, mock-persisted state — the toggle genuinely
// switches and survives a reload — but it never reaches any actual OTA, since
// no real channel connection exists (see /channels' IllustrativeBanner and
// CLAUDE.md's v1 scope, which explicitly defers OTA engineering). Think of it
// as "this app's own record of what it *would* tell each channel," not a live
// control surface.
import fs from "fs";
import path from "path";
import { OTA_PARTNER_NAMES } from "@/constants/channels";

export interface ChannelInventoryEntry {
  roomType: string;
  channel: string;
  stopSell: boolean;
}

interface ChannelInventoryStore {
  entries: Record<string, ChannelInventoryEntry>; // keyed by "roomType|channel"
}

const STORE_PATH = path.join(process.cwd(), ".mock-store-channel-inventory.json");

function key(roomType: string, channel: string): string {
  return `${roomType}|${channel}`;
}

function loadStore(): ChannelInventoryStore {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw) as ChannelInventoryStore;
  } catch {
    return { entries: {} };
  }
}

function saveStore(store: ChannelInventoryStore): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// Every roomType x channel combination, defaulting to open (not stopped) for
// any pair that's never been touched — a fresh property sells everywhere by
// default, same as a real hotel would start.
export function listChannelInventoryMock(roomTypes: string[]): ChannelInventoryEntry[] {
  const store = loadStore();
  const entries: ChannelInventoryEntry[] = [];
  for (const roomType of roomTypes) {
    for (const channel of OTA_PARTNER_NAMES) {
      const existing = store.entries[key(roomType, channel)];
      entries.push(existing ?? { roomType, channel, stopSell: false });
    }
  }
  return entries;
}

export function setStopSellMock(roomType: string, channel: string, stopSell: boolean): ChannelInventoryEntry {
  if (!OTA_PARTNER_NAMES.includes(channel)) throw new Error("Unknown channel");
  const store = loadStore();
  const entry: ChannelInventoryEntry = { roomType, channel, stopSell };
  store.entries[key(roomType, channel)] = entry;
  saveStore(store);
  return entry;
}

// "Pause everything" — stop-sell (or reopen) every room type across every
// channel in one action, e.g. for a full-property closure or an emergency.
export function setAllChannelsStopSellMock(roomTypes: string[], stopSell: boolean): void {
  const store = loadStore();
  for (const roomType of roomTypes) {
    for (const channel of OTA_PARTNER_NAMES) {
      store.entries[key(roomType, channel)] = { roomType, channel, stopSell };
    }
  }
  saveStore(store);
}

// Stop-sell (or reopen) one whole channel across every room type — e.g.
// pulling out of one OTA entirely without touching the others.
export function setChannelStopSellMock(channel: string, roomTypes: string[], stopSell: boolean): void {
  if (!OTA_PARTNER_NAMES.includes(channel)) throw new Error("Unknown channel");
  const store = loadStore();
  for (const roomType of roomTypes) {
    store.entries[key(roomType, channel)] = { roomType, channel, stopSell };
  }
  saveStore(store);
}
