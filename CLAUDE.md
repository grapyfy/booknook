# BookNook — Project Rules

Working name as of 2026-08-31 (provisional, may change again). Everywhere below that says "StayGrid" refers to the same product — the original PRD and early planning docs use that name, not renamed throughout yet.

Shared source of truth for anyone (or any AI tool — Claude, Cursor, Copilot, whatever) working on this repo — Abhay (backend/logic) and teammate (UI), currently 2 people. This file lives at the repo root and is meant to be read start-to-finish by a new person/AI picking up the project for the first time.

## What this is
StayGrid India — WhatsApp-first, UPI-first hotel PMS + channel manager for independent Indian hotels (10–200 rooms). Full PRD: `StayGrid_India_PRD_v1_1.md` in this folder — treat it as the north star vision, not the v1 spec (see scope below).

## Getting started (read this first, whoever you are)

Repo: `https://github.com/abhayyy-singh/booknook` (private).

```bash
git clone https://github.com/abhayyy-singh/booknook.git
cd booknook
npm install
npm run dev   # http://localhost:3000
```

**If you're only building UI (screens/components):** you don't need any database credentials at all. Screens should be built against the mock data already in `types/booking.ts` (`MOCK_BOOKINGS`) and `types/room.ts` (`MOCK_ROOMS`) — those are the "contracts," see below. You can run the dev server and build/preview screens with zero `.env` setup. `/login` will error without real Supabase config, but every other screen works fine against mock data.

**If you need the real backend running** (testing the actual login/API, not just UI): ask Abhay directly for the Supabase values (never share these in a commit or a public place) — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SECRET_KEY`. Copy `.env.example` to `.env.local` (Next.js) and also to `.env` (Prisma CLI reads this one separately — see the gotchas note further down) and fill them in.

**Stack, in one line:** Next.js 15 (App Router, React, TypeScript) for a web app — not a native mobile app, not React Native. `.tsx` files and the `app/` folder are Next.js conventions for building web pages; see "Platform" below for why this isn't a native app.

## Current build status (snapshot — keep this section updated, don't rely only on the dated log in STATUS.md for "what exists right now")

`feature/dashboard-ui` is merged to `main` (2026-09-08). UI (all screens) is real against mock data; backend has been extended to cover the same ground for real. **Full detail: `LOGIC.md` (UI, every button/computed number) and `BACKEND_LOGIC.md` (backend, every service/endpoint) — this section is only a summary, don't treat it as the source of truth for exact behavior.**

**Backend — schema written, code type-checks and builds clean, migration NOT YET APPLIED** (Supabase project was paused when this was written — free-tier auto-pause after ~1 week idle; restore it, then run `npx prisma migrate dev`, before assuming any of this exists in the real database):
- Login + roles — `OWNER`/`FRONT_DESK` enforced, `HOUSEKEEPING_SUPERVISOR`/`HOUSEKEEPING_STAFF` now real too (Housekeeping module built), `ACCOUNTANT` still reserved
- Bookings — full front-desk depth: pricing control (rate override/discount/service charges), reschedule (extend/shorten/move room), status lifecycle (confirmed/checked-in/checked-out/cancelled/waitlisted/no-show, transitions enforced), group bookings (all-or-nothing transaction), overbooking + possible-no-show detection
- GST billing (Folio) — unchanged, already correct (keys off the per-booking rate actually charged, not a live room-rate lookup — the real backend never had the bug the mock layer had to fix)
- Rooms, Excel/CSV import — unchanged from before this pass
- Guests & Customers — guest history by phone, aggregated customer directory with search
- Reports — real occupancy/ADR/RevPAR, CSV export
- Channels — real CRUD; `status` is a manual outreach flag, **not** a live OTA sync (see "OTA integration" below)
- Halls & Events — real CRUD with time-overlap conflict checking
- Settings — real property-details singleton
- Housekeeping — real 4-stage task board (one task per active room per day, DB-enforced), staff assignment
- Maintenance — real ticket workflow, technician assignment, resolve requires a real repair cost

**Also built on the UI side, deliberately exceeding this doc's locked v1 scope below** — an explicit, flagged decision made between Abhay and the teammate (Gautam) mid-build, not a unilateral scope change (see `STATUS.md`'s part-4 entry): Channels/OTA, Users & roles, Halls & events, Settings tabs, and the final reference-list stubs (Marketing & CRM, Corporate & travel agents, Vendors, Reviews) — all honest UI-only stubs (visibly labeled in-app), never wired to a real OTA sync or message send. Housekeeping (`/housekeeping`) and Maintenance (`/maintenance`) are new, fully real (not stubs) modules — not in the original 5-screen list and not in the locked scope below, but genuinely functional. **Backend for all of the above (real tables/services/routes, not stubs) has been built to match — see the bullet list above and `BACKEND_LOGIC.md`; migration not yet applied, per the note at the top of this section.**

**Billing/Payments depth (UI, 2026-09-08, part 9) — real, and this one IS in locked v1 scope, not creep:** payment recording (multi-method, derived balance), refunds with auto-issued credit notes, void-and-reissue invoicing, a cash register with a real computed daily cash-received figure, and a **GSTR-1 CSV export** on `/reports`. **Backend for this is NOT built yet** — this landed on the UI branch after the backend catch-up pass above; next backend session should extend `BACKEND_LOGIC.md`/the schema to cover Payment/CreditNote/CashRegister, matching this the same way the rest of the backend now matches the UI. Not built (either side): a live payment gateway call (still BYOG-stub only, per the payments rule below), OTA/gateway/bank reconciliation (no real data to reconcile against).

**Not built (either side):** offline check-in/sync queue, any real WhatsApp send (deferred, per this doc's "never wire a live send" rule). Extra services/discounts don't flow into the GST folio's tax calc yet (deferred, flagged in `BACKEND_LOGIC.md`, not silently skipped).

**Branch size note (from the teammate, worth keeping in mind going forward):** the UI branch grew to 10 STATUS.md entries / 5 commits from one continuous session before this merge — the "grown large, ship in smaller pieces" signal this doc's own engineering standards call out. Already merged now, but worth both sides watching branch size going forward rather than treating this as the new normal.

**Scope note:** Channels/Users/Halls/Settings/Marketing/Corporate/Vendors/Reviews (as UI stubs), Housekeeping/Maintenance (as real modules), and Billing/Payments depth all exceed or extend this doc's "locked v1 scope" below — explicit decisions made between Abhay and Gautam, not unilateral expansion. The locked-scope section hasn't been rewritten to match yet; treat the bullet list above as more current than "v1 scope — locked" for "what are we actually building."

## What's next
Once the database migration is applied (see above) and verified end-to-end, the real step is swapping the UI's mock-data calls (`components/lib/mockData.ts` and friends) for real `fetch()` calls against the endpoints in `BACKEND_LOGIC.md` — the contract workflow below was designed for exactly this handoff.

## v1 scope — locked
**Build:** front desk (calendar, walk-in, guest profile, digital KYC), GST folio + billing + GSTR-1 export, UPI payments (BYOG model — see below), WhatsApp booking confirmation + missed-call recovery, Excel/CSV importer with "Nothing Lost" report, offline check-in with a sync queue.

**Explicitly NOT v1** — don't build unless a paying hotel specifically asks: OTA channel manager (MakeMyTrip/Goibibo sync), booking widget/promo engine, e-invoice/IRN, PCI-DSS/Kubernetes infra, TCS/police C-form, smart pricing assistant, guest self-service portal.

## Team split
| Owns | Folders |
|---|---|
| Backend/logic (Abhay) | `app/api/`, `services/`, `lib/`, `prisma/` — endpoints, booking/GST logic, DB schema |
| UI (teammate) | `app/(pages)/`, `components/`, `constants/` — screens, design system |

`types/` (the data contracts, e.g. `types/booking.ts`) is shared — either person can read it freely, but changing it needs the other person's sign-off first (see the contract rule below).

If a task crosses both, agree on the data contract (below) before either side starts.

## The contract rule — non-negotiable
Before UI work starts on any screen, write down the exact data shape it needs (a short markdown snippet is enough — see example below). UI builds against mock data matching that shape; backend builds the real thing to match it; plug together once both are ready. Never assume a shape and build against it — a prior project lost real functionality for months because two sides assumed different field names for the same thing.

```
// example — agree on this BEFORE the screen gets built
Booking {
  id: string
  guestName: string
  checkIn: string      // "2026-09-01"
  checkOut: string
  roomNumber: string
  status: "confirmed" | "checked-in" | "checked-out"
}
```

## Payments
**BYOG (Bring Your Own Gateway) for v1** — each hotel connects its own Razorpay account; this platform triggers checkout using their credentials and never pools guest payments into its own account. Do not build a pooled-payment/marketplace-settlement flow — that crosses into RBI Payment Aggregator territory and needs authorization this project doesn't have. Revisit only as a deliberate architecture decision, not incrementally.

## Git workflow
GitHub Flow, short-lived branches: `git pull origin main` daily → `feature/<name>` per task (hours to 1-2 days, not weeks) → PR, real diff review even at 2 people → merge → delete branch. Commit format: `type(scope): short description` (`feat`/`fix`/`refactor`/`chore`).

Deploy sequencing: backend changes go straight to `main` if purely additive/backward-compatible; UI/frontend changes go through a preview deploy first, reviewed live, before merging to `main`.

**AI-assistant rule:** never run two AI coding sessions against the same repo checkout at the same time — this caused real conflicts on a prior project (a session's file got reverted out from under it). If both people use AI assistants, merge one AI-written branch at a time, not two simultaneously.

**Tool-agnostic on purpose.** The teammate may be using a different AI tool (or none) — this file plus `STATUS.md` plus normal git is the whole collaboration mechanism, and it's deliberately kept plain-markdown so it works regardless of tool. If the teammate ever also moves to Claude Code specifically, it's worth revisiting whether anything tighter is useful then — not before.

## Engineering standards (every change)
- DB rules restrict reads/writes to authenticated users only; never expose API keys client-side
- Validate all input at boundaries — this project touches money and tax data
- No hardcoded data — anything a hotel would configure (rates, room types, message templates) comes from the database
- Real icon library, not emoji, for UI icons
- TypeScript with real types, avoid `any`
- Every schema change is a tracked migration, never a one-off script run directly against production data — guard any `===` match on a field that could be `undefined` on both sides with a truthy check first
- **Never wire an automated WhatsApp/email send to a real guest or hotel** (booking confirmation, missed-call recovery, abandoned-booking nudge) until the message content has been explicitly reviewed — code the plumbing freely, gate the live trigger

## OTA integration (channel manager)
Two separate tracks: **outreach/application** (talking to AxisRooms/Staah, applying for OTA API access) can start anytime, costs no engineering time. **Engineering** (actually writing the sync code) stays deferred until access is confirmed — don't build this speculatively.

## Platform: web app (PWA), not a native mobile app — for v1
Decided 2026-08-31. A prior project (Haristhenics, React Native/Expo) lost real time to native-app-specific problems that don't exist for a web app: Apple rejected a build over In-App Purchase policy (had to redesign the whole purchase flow), and its OTA update mechanism was broken for the app's entire lifetime due to a missing config, undiagnosed for weeks — meaning every fix needed a new native build + App Store review (1-2 days) instead of an instant deploy. StayGrid's users (hotel front-desk staff, owners) use it on an existing device at a fixed location, not browsing an app store — a PWA (installable to home screen, works offline via service worker) gets the "app" feel without any of that deployment risk. Guest-facing booking page is web regardless (SEO, embeddable). Revisit native only if a specific capability truly needs it later (e.g. reliable push notifications, a digital room key).

## Security & reliability patterns — proven on Haristhenics, reuse directly

**Never trust an amount/price from the client.** Any booking price, GST amount, or payment total gets computed/verified server-side from the database, never accepted as a number the frontend sends. This is the single most important rule for a system that touches real money and tax — a client-supplied amount is trivially tamperable.

**Rate limiting — fixed-window, fail-open.** Proven pattern from Haristhenics' `_utils/rateLimit.js`: a DB collection keyed by a sanitized identifier (e.g. `booking_<ip>` or `otp_<phone>`), storing `{count, windowEnd}`; increment within the window, block once `count >= max`, and **fail open on any infra error** (never let a rate-limiter bug block a legitimate request). Apply to: booking creation, OTP/login requests, WhatsApp-trigger endpoints, payment order creation.

**DB security rules — real gate is server-side, client rules are the backstop.** Backend (using an admin/service-role SDK) bypasses client-facing security rules entirely — those rules only constrain the frontend/mobile client's direct DB access. Structure: public read for genuinely public config (room types, published rates), authenticated-only for anything guest-specific, owner-only read/write for a hotel's own data, admin bypass for staff roles. **Before ever rewriting security rules, read the existing deployed version from the console first** — a prior incident overwrote a working admin-access fallback by assuming the repo was the source of truth when the real rules were console-only.

**Real-time delivery over polling.** Payment webhook → backend verifies signature → writes to DB → client reads via a real-time listener (Firestore `onSnapshot` or equivalent), not a polling loop. Never call a payment gateway's SDK directly from a guest-facing client for anything beyond initiating checkout — verification and record-writing stay server-side.

**Caching: skip it for v1.** Haristhenics ran with real users and real revenue with no dedicated cache layer (no Redis) — just the database directly. Don't add caching infrastructure speculatively; revisit only if a specific read path becomes a measured bottleneck.

## Shared status log — automatic, not manual
Keep a `STATUS.md` at the repo root. Whenever an AI session (either person's) finishes a meaningful chunk of work or a real decision gets made, it appends a short dated entry itself — the human doesn't type it in. This rides on the git pull/push that already has to happen for code, so both people stay caught up on "what did the other side do" with zero extra manual step. Format:

```
## 2026-08-31 — Abhay
Booking API done, matches the contract. Payment model confirmed as BYOG.

## 2026-08-31 — Teammate
Calendar screen UI built against mock data, ready to plug into real API.
```

Whoever's session starts work should read `STATUS.md` first (same habit as checking Obsidian memory) before proposing what to do next — don't assume, check what the other side actually landed since last pull.

## Tech stack (decided 2026-08-31)
Next.js 15 (App Router) + TypeScript + Tailwind — the "boring, proven" default for SaaS in 2026, not Firebase/Firestore (which the last project used). **Database: PostgreSQL via Supabase, with Prisma as the ORM** — chosen specifically over Firestore because this product's data (rooms, bookings, guests, GST line items) is genuinely relational, and Prisma's migration system (`npm run db:migrate`) gives real, tracked, versioned schema changes — the direct fix for the last project's worst recurring problem (schema patched live in prod via one-off scripts, which once caused permanent data loss). Supabase also provides Auth and Storage built in, so no separate auth provider is needed. Hosting: Vercel. Payments: Razorpay, BYOG model (see above).

**Supabase + Prisma gotchas hit during setup (2026-08-31), don't rediscover these:**
- `DATABASE_URL` (the Transaction pooler string) must end with `?pgbouncer=true`, or writes intermittently fail with `prepared statement "sX" already exists`.
- `DIRECT_URL` (used only for migrations) needs the "Direct connection" string, but that requires IPv6 — on an IPv4-only network (most home/office wifi) it fails with "Can't reach database server." Use the "Session pooler" string instead (same pooler host as Transaction pooler, port 5432).
- The Prisma CLI only reads a file literally named `.env` — Next.js reads `.env.local`. Both files need `DATABASE_URL`/`DIRECT_URL`, or migrations silently can't find them.

Dependency versions get checked against `npm audit` before adding — a package with an open critical/high vulnerability doesn't go in without a specific reason logged here. (2026-08-31: accepted one open moderate/high PostCSS vulnerability nested inside Next.js's own build toolchain — fixing it requires an early, likely-unstable Next 16 major bump; revisit when 16 is more established. Nothing else open as of this date.)

## Known failure patterns in AI-assisted ("vibe coded") code — checklist for every session
Pulled from 2026 industry research on AI-generated code (Veracode, Cloud Security Alliance, GitHub CVE data) — these are measured, common patterns, not hypothetical:

**Security — check these on every new endpoint/form:**
- SQL/query injection — never build a raw query by string-concatenating user input; Prisma's query builder parameterizes automatically, so hand-written raw SQL is the one place this can sneak back in — avoid `$queryRawUnsafe` entirely
- XSS (cross-site scripting) — React escapes output by default; the danger is `dangerouslySetInnerHTML` or rendering raw HTML from user/guest input — don't do either without sanitizing
- Log injection — never write raw, unescaped user input directly into logs
- Auth bypass — every API route that touches a specific hotel's data checks that the logged-in user actually belongs to that hotel, not just that they're logged in at all
- Command injection — never pass user input to a shell command
- SSRF — never let server code fetch a URL that came from user input without validating/allow-listing it
- Hardcoded secrets — checked before every commit, not just at setup

**The "false sense of security" trap:** AI-generated code that looks clean and secure often isn't — research found assistant-written code gets rated "secure" by its own author at a high rate while actually failing real security tests. Treat "the code looks fine" as insufficient — validate against the checklist above explicitly, don't rely on a read-through feeling right.

**Code quality / scalability — check these over time, not just per-PR:**
- Inconsistent naming/style drifting across sessions — this is exactly what CLAUDE.md's conventions exist to prevent; if a new pattern conflicts with an existing one, match the existing one or flag it, don't silently introduce a third style
- Unnecessary dependencies added ad-hoc — before adding a package, check whether something already in the stack does the job
- The same mistake repeated in multiple places — if a bug pattern is found once (e.g. an unguarded `===` on a possibly-undefined field), grep for the same pattern elsewhere rather than fixing only the one instance found
- A `feature/` branch or PR that's grown large and hard to review is a signal to have shipped it in smaller pieces — not a reason to skip review on this one

## Explaining before coding
For any non-trivial change: read the relevant file(s) first, explain the problem and the proposed fix in plain language, then act — especially relevant since not everyone on this team is deeply technical.
