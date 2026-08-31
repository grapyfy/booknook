# BookNook — Status Log

Append-only. Whichever AI session (either person's) does meaningful work or lands a decision writes its own dated entry here — not the human. Read this before starting work, alongside CLAUDE.md.

## 2026-08-31 — Abhay
Locked v1 scope, payment model (BYOG), team workflow, week 1-8 plan (all in Abhay's Obsidian memory; this file is the shared/repo-visible summary).

Project scaffolded: Next.js 15 + TypeScript + Tailwind, PostgreSQL via Supabase + Prisma (switched from Firebase — see CLAUDE.md "Tech stack" for why). First data contract (`types/booking.ts`) + matching Prisma schema (`prisma/schema.prisma`) written. Stub booking API (`app/api/bookings/route.ts`, zod-validated) and a mock-data dashboard screen (`app/dashboard/page.tsx`) both build clean (`npm run build` passes, no TypeScript errors). No real Supabase project connected yet — `.env.example` lists what's needed.

Working name: BookNook (was "StayGrid" in early planning — provisional).

## 2026-08-31 — Abhay
Real Supabase project connected (Mumbai/ap-south-1 region). First migration applied (`prisma/migrations/20260831083531_init`) — `Booking` and `Guest` tables now exist for real. Verified end-to-end: `GET`/`POST /api/bookings` tested against the live database, both work. Repo pushed to GitHub (`github.com/abhayyy-singh/booknook`, private).

Two Supabase+Prisma gotchas hit and documented in CLAUDE.md — worth reading before touching `.env`: the pooler connection needs `?pgbouncer=true`, and `DIRECT_URL` needs the Session pooler (not true Direct connection) on an IPv4 network.

## 2026-08-31 — Abhay
Login built (Supabase Auth + a `Staff` table with roles). Two roles actually enforced for v1 — `OWNER` and `FRONT_DESK` — the other 4 PRD roles (accountant, housekeeping) exist in the schema but aren't wired to any screen yet, since those features aren't built. No public signup — staff logins are provisioned via `scripts/create-staff.js`. Dashboard is now behind `middleware.ts` (redirects to `/login` if not authenticated) and shows the real logged-in staff member's name/role instead of mock data. Verified end-to-end with a real browser (Playwright): login → redirect → dashboard renders correctly, screenshotted.

Installed the `@supabase/server` skill (`.agents/skills/`) — mostly for Supabase Edge Functions, which BookNook doesn't use, but it flagged our Supabase key env-var names were the old "anon"/"service_role" style; renamed to current "publishable"/"secret" naming.

## 2026-08-31 — Abhay
GST billing done (backend-only — no UI work today, staying in the backend/logic lane per the team split, see CLAUDE.md). New `Folio` table: 12%/18% GST slab based on the room's per-night rate (not the total), CGST+SGST split (assumes intra-state for v1 — IGST for inter-state guests is deferred, needs guest billing-state capture which isn't built), fixed SAC code 996311, auto invoice numbering (`BN-2026-00001`), idempotent (calling it twice on the same booking never double-bills). `Booking` now stores `roomRatePerNight` separately from the total `amount` — needed because the GST slab depends on the nightly rate, not the total.

Verified end-to-end: created a real booking (₹3,500/night × 2 nights = ₹7,000), generated its folio (12% GST → ₹420 CGST + ₹420 SGST → ₹7,840 total), confirmed a second call returns the same folio instead of creating a duplicate.

**For the teammate:** UI can now build against `types/booking.ts`'s `Folio` type + `GET`/`POST /api/bookings/:id/folio` whenever ready — nothing UI-side blocking here.

## 2026-08-31 — Abhay
Rooms are real now — new `Room` table (`roomNumber`, `roomType`, `ratePerNight`, `active`). Bookings used to hardcode ₹3,500/night for every room; now `bookingService` looks up the actual rate via `roomService.getActiveRoomRate`, which also rejects a booking cleanly (400, not a crash) if the room doesn't exist or is inactive (maintenance). New `GET`/`POST /api/rooms`.

Verified end-to-end: created a ₹8,000/night room, confirmed booking it correctly triggers the 18% GST slab (vs. 12% for the earlier ₹3,500 test) — both slabs now proven against real data, not just reasoned about. Booking a nonexistent room number fails with a clear error instead of a 500.

WhatsApp confirmation explicitly deferred by Abhay for now (real cost/time from Haristhenics experience) — not forgotten, just not next. `types/room.ts` contract is ready whenever the teammate wants to build a room-management screen.

## 2026-08-31 — Abhay
Excel/CSV importer done (backend-only) — `POST /api/import/bookings`, a `.csv` file upload. This is the "Nothing Lost" migration feature from the PRD (Module J) — every row gets a fate: imported, or flagged with a specific reason, nothing silently dropped. Handles real messy-spreadsheet variation on purpose: flexible header matching (e.g. "Mobile Number"/"Contact"/"Phone" all map to phone), mixed date formats (DD-MM-YYYY, DD/MM/YYYY, ISO), and unknown rooms auto-create themselves if the row gives a rate (never guesses one — a room with no rate and no existing record gets flagged, not silently defaulted).

Verified against a deliberately messy 6-row test CSV (mixed headers/date formats, one missing phone, one same-day checkout, one unknown room with no rate): 3 imported correctly, 3 flagged with the right reasons, all 6 accounted for.

Added `papaparse` (CSV parsing) as a real dependency — hand-rolling CSV parsing (quoted commas, escaped quotes) is exactly the kind of thing worth a proven library instead of reinventing, per the "no unnecessary deps, but do the job right" standard.

.xlsx (actual Excel binary format) isn't supported yet, only .csv — most spreadsheet tools export CSV fine, revisit if a real hotel's export turns out to be .xlsx-only.
