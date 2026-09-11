// Audit log viewer — mock domain mirroring services/auditLogService.ts's real
// AuditLogEntry contract. Unlike other *Mock.ts domains, this isn't a
// fs-persisted read/write store: a real audit log is generated as a side
// effect of every other action in the app (booking created, rate rule
// changed, etc. — see components/lib/actions.ts's real logAction() calls),
// and reproducing that here would mean hooking every mock action to append
// here too, well beyond what a "view the log" screen needs. This is a fixed
// sample of what listAuditLogs() already returns for real once this screen
// is wired to it — same "mock first" step as rateRulesMock.ts.
import { MOCK_STAFF } from "@/constants/staff";

export interface AuditLogEntry {
  id: string;
  staffName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

const [owner, frontDesk1, , , frontDesk2] = MOCK_STAFF;

const SEED_ENTRIES: AuditLogEntry[] = [
  {
    id: "al1",
    staffName: frontDesk1.name,
    action: "booking.create",
    entityType: "Booking",
    entityId: "bk-2031",
    details: { roomNumber: "204", amount: 8500 },
    createdAt: "2026-09-11T09:12:00.000Z",
  },
  {
    id: "al2",
    staffName: frontDesk1.name,
    action: "booking.status_change",
    entityType: "Booking",
    entityId: "bk-2028",
    details: { to: "checked-in" },
    createdAt: "2026-09-11T08:47:00.000Z",
  },
  {
    id: "al3",
    staffName: frontDesk2.name,
    action: "booking.create_walkin",
    entityType: "Booking",
    entityId: "bk-2030",
    details: { roomNumber: "112" },
    createdAt: "2026-09-11T07:55:00.000Z",
  },
  {
    id: "al4",
    staffName: owner.name,
    action: "rate_rule.create",
    entityType: "RateRule",
    entityId: "rr2",
    details: { name: "Diwali week", adjustmentType: "PERCENT", adjustmentValue: 25 },
    createdAt: "2026-09-10T18:20:00.000Z",
  },
  {
    id: "al5",
    staffName: owner.name,
    action: "settings.gst_config_change",
    entityType: "PropertySettings",
    entityId: "ps-1",
    details: { gstThresholdRupees: 7500, gstLowRatePercent: 12, gstHighRatePercent: 18 },
    createdAt: "2026-09-10T17:05:00.000Z",
  },
  {
    id: "al6",
    staffName: frontDesk1.name,
    action: "booking.reschedule",
    entityType: "Booking",
    entityId: "bk-2019",
    details: { roomNumber: "301", checkOut: "2026-09-14" },
    createdAt: "2026-09-10T14:32:00.000Z",
  },
  {
    id: "al7",
    staffName: frontDesk1.name,
    action: "booking.undo_status",
    entityType: "Booking",
    entityId: "bk-2019",
    details: { revertedTo: "confirmed" },
    createdAt: "2026-09-10T14:29:00.000Z",
  },
  {
    id: "al8",
    staffName: owner.name,
    action: "room.create",
    entityType: "Room",
    entityId: "rm-14",
    details: { roomNumber: "410" },
    createdAt: "2026-09-09T11:00:00.000Z",
  },
  {
    id: "al9",
    staffName: frontDesk2.name,
    action: "booking.create_group",
    entityType: "BookingGroup",
    entityId: "grp-88",
    details: { groupName: "Sharma wedding party", roomCount: 6 },
    createdAt: "2026-09-09T10:15:00.000Z",
  },
  {
    id: "al10",
    staffName: null,
    action: "booking.status_change",
    entityType: "Booking",
    entityId: "bk-1994",
    details: { to: "no-show" },
    createdAt: "2026-09-08T22:00:00.000Z",
  },
  {
    id: "al11",
    staffName: owner.name,
    action: "rate_rule.create",
    entityType: "RateRule",
    entityId: "rr1",
    details: { name: "Weekend surcharge", adjustmentType: "PERCENT", adjustmentValue: 15 },
    createdAt: "2026-09-08T09:30:00.000Z",
  },
];

export function listAuditLogsMock(filters?: { entityType?: string; limit?: number }): AuditLogEntry[] {
  let entries = [...SEED_ENTRIES].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filters?.entityType) entries = entries.filter((e) => e.entityType === filters.entityType);
  if (filters?.limit) entries = entries.slice(0, filters.limit);
  return entries;
}

// Distinct entity types present, for the filter dropdown — derived from the
// data rather than a second hardcoded list, so a new action's entityType
// shows up in the filter automatically.
export function listAuditLogEntityTypesMock(): string[] {
  return [...new Set(SEED_ENTRIES.map((e) => e.entityType))].sort();
}
