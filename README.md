# GRAP

Front desk, billing, and guest messaging for independent Indian hotels.

Read **`CLAUDE.md`** first — project rules, folder ownership, the data contract convention, and current architecture decisions. Read **`STATUS.md`** for what's been done recently, **`LOGIC.md`** for exact behavior of every button/link/computed number, and **`RULES.md`** for the standing UI rules/principles to follow.

## Setup
```bash
npm install
npm run dev
```
Building UI against mock data? That's it — no `.env` needed; every screen below except `/dashboard` (real, gated) works fully against mock data. Need the real backend (login, real API data)? See "Getting started" in `CLAUDE.md` for how to get credentials from Abhay.

## UI (mock data, no `.env` needed)
Built on `feature/dashboard-ui` (PR #1, not yet merged) — see `CLAUDE.md`'s "Current build status" for the full picture. Key screens, grouped the same way as the sidebar:

- `/dashboard-preview` — dashboard home (Minimal/Detailed toggle); use this instead of `/dashboard` to view it without real Supabase credentials
- `/bookings`, `/bookings/calendar`, `/bookings/new`, `/bookings/walk-in`, `/bookings/groups` — booking list/calendar/creation, incl. walk-in & group bookings
- `/rooms`, `/housekeeping`, `/maintenance` — inventory + real day-to-day status workflows (not stubs)
- `/customers`, `/marketing`, `/corporate`, `/reviews` — guest-related screens (some are honest UI-only stubs, labeled in-app)
- `/channels`, `/halls`, `/users`, `/settings` — distribution/admin, mostly UI-only stubs beyond the locked v1 scope (flagged in `CLAUDE.md`)
- `/cash-register`, `/reports` — billing/payments depth: payments, refunds, credit notes, GSTR-1 CSV export
- `/import` — CSV import + "Nothing Lost" report

## Backend (real, needs Supabase credentials — see `CLAUDE.md`)
- `/login` — staff login (Supabase Auth)
- `/dashboard` — the original real, gated dashboard (requires login; crashes without env vars — use `/dashboard-preview` for UI work)
- `/api/bookings` — GET list, POST create
- `/api/bookings/:id/folio` — GET/POST the GST bill for a booking
- `/api/rooms` — GET list, POST create
- `/api/import/bookings` — POST a `.csv` file, get back the "Nothing Lost" report
