import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter, DB-backed — same pattern proven on the last project
 * (see CLAUDE.md). Fails OPEN on any infra error: a rate-limiter bug should never
 * block a legitimate request.
 * @returns true = rate limited (block), false = allowed
 */
export async function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const key = identifier.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
  try {
    const now = Date.now();
    const existing = await db.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.windowEnd.getTime() < now) {
      await db.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowEnd: new Date(now + windowMs) },
        update: { count: 1, windowEnd: new Date(now + windowMs) },
      });
      return false;
    }

    if (existing.count >= maxRequests) return true;

    await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return false;
  } catch {
    return false; // fail open — never block on infra error
  }
}
