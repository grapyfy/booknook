import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// Called from inside the action that just happened (booking created, status
// changed, folio voided, etc.) — never blocks or throws into the caller's flow;
// an audit-log write failing shouldn't ever fail the real action it's logging.
// Fire-and-forget is deliberate here, same "never let a secondary concern break
// the primary one" principle as rate-limiting's fail-open behavior.
export async function logAction(input: {
  staffId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        staffId: input.staffId ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details,
      },
    });
  } catch (err) {
    console.error(JSON.stringify({ event: "audit_log_write_failed", action: input.action, error: String(err) }));
  }
}

export interface AuditLogEntry {
  id: string;
  staffId: string | null;
  staffName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: Prisma.JsonValue;
  createdAt: string;
}

export async function listAuditLogs(filters?: {
  entityType?: string;
  entityId?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const rows = await db.auditLog.findMany({
    where: {
      entityType: filters?.entityType,
      entityId: filters?.entityId,
    },
    include: { staff: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 100,
  });

  return rows.map((r) => ({
    id: r.id,
    staffId: r.staffId,
    staffName: r.staff?.name ?? null,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    details: r.details,
    createdAt: r.createdAt.toISOString(),
  }));
}
