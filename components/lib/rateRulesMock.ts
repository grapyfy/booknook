// Dynamic pricing (weekly/festival rate rules) — mock domain mirroring
// services/rateRuleService.ts's real contract as closely as possible on
// purpose (same field shapes, same sort order), per CLAUDE.md's contract
// workflow. The real backend + migration already exist and are live
// (BACKEND_LOGIC.md), but this UI hasn't been swapped over to it yet — same
// "mock first, swap once both sides agree" step every other screen went
// through. See RULES.md's single-source-of-truth rule for why the type/
// adjustment enums live in constants/rateRules.ts, not duplicated here.
import fs from "fs";
import path from "path";
import type { RateRuleType, AdjustmentType } from "@/constants/rateRules";
export type { RateRuleType, AdjustmentType };

export interface RateRule {
  id: string;
  name: string;
  type: RateRuleType;
  daysOfWeek: number[]; // 0=Sunday..6=Saturday, WEEKLY only
  startDate: string | null; // YYYY-MM-DD, DATE_RANGE only
  endDate: string | null;
  adjustmentType: AdjustmentType;
  adjustmentValue: number; // percent (0-100) or flat rupees, per adjustmentType
  active: boolean;
  priority: number; // higher wins when more than one rule matches the same night
}

interface StoredRateRule extends RateRule {
  createdAt: string;
}

interface Store {
  rules: StoredRateRule[];
  nextId: number;
}

const STORE_PATH = path.join(process.cwd(), ".mock-store-rate-rules.json");

const SEED_RULES: StoredRateRule[] = [
  {
    id: "rr1",
    name: "Weekend surcharge",
    type: "WEEKLY",
    daysOfWeek: [5, 6], // Fri, Sat
    startDate: null,
    endDate: null,
    adjustmentType: "PERCENT",
    adjustmentValue: 15,
    active: true,
    priority: 1,
    createdAt: "2026-09-01T09:00:00.000Z",
  },
  {
    id: "rr2",
    name: "Diwali week",
    type: "DATE_RANGE",
    daysOfWeek: [],
    startDate: "2026-11-06",
    endDate: "2026-11-12",
    adjustmentType: "PERCENT",
    adjustmentValue: 25,
    active: true,
    priority: 10,
    createdAt: "2026-09-05T12:00:00.000Z",
  },
];

function loadStore(): Store {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return { rules: [...SEED_RULES], nextId: 100 };
  }
}

function saveStore(store: Store): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function toContractShape({ createdAt: _createdAt, ...rule }: StoredRateRule): RateRule {
  return rule;
}

// Same order the real listRateRules() uses: highest priority first, then
// oldest-created first among ties.
export function listRateRulesMock(): RateRule[] {
  return [...loadStore().rules]
    .sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt))
    .map(toContractShape);
}

export function createRateRuleMock(input: {
  name: string;
  type: RateRuleType;
  daysOfWeek?: number[];
  startDate?: string;
  endDate?: string;
  adjustmentType: AdjustmentType;
  adjustmentValue: number;
  priority?: number;
}): RateRule {
  const store = loadStore();
  store.nextId += 1;
  const rule: StoredRateRule = {
    id: `rr${store.nextId}`,
    name: input.name,
    type: input.type,
    daysOfWeek: input.type === "WEEKLY" ? (input.daysOfWeek ?? []) : [],
    startDate: input.type === "DATE_RANGE" ? (input.startDate ?? null) : null,
    endDate: input.type === "DATE_RANGE" ? (input.endDate ?? null) : null,
    adjustmentType: input.adjustmentType,
    adjustmentValue: input.adjustmentValue,
    active: true,
    priority: input.priority ?? 0,
    createdAt: new Date().toISOString(),
  };
  store.rules.push(rule);
  saveStore(store);
  return toContractShape(rule);
}

export function setRateRuleActiveMock(id: string, active: boolean): RateRule {
  const store = loadStore();
  const rule = store.rules.find((r) => r.id === id);
  if (!rule) throw new Error("Rate rule not found");
  rule.active = active;
  saveStore(store);
  return toContractShape(rule);
}

export function deleteRateRuleMock(id: string): void {
  const store = loadStore();
  const next = store.rules.filter((r) => r.id !== id);
  if (next.length === store.rules.length) throw new Error("Rate rule not found");
  store.rules = next;
  saveStore(store);
}
