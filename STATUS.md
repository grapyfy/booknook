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

## 2026-09-08 — Teammate
Built the real dashboard UI on `feature/dashboard-ui` (backend files untouched — `app/api/`, `services/`, `lib/`, `prisma/` all unchanged). Covers all 5 screens from CLAUDE.md's "what the UI needs to build" list, built against the real `types/booking.ts`/`types/room.ts` contracts and mock data (no `.env` needed): bookings list + new-booking form, room management + add-room form, GST folio/invoice view, and the CSV import screen with the "Nothing Lost" report. Restyled `/login` in place (auth logic untouched). Rebuilt `/dashboard` as a real overview screen (stat tiles + recent bookings) — this replaces the old backend-verification version, now runs against mock data with no Supabase dependency in the page itself.

Added shared UI: `AppShell` (sidebar nav), `Button`/`Input`/`Select`/`StatusBadge` primitives, an `OnlineStatusBadge` stub for the v1 offline-sync-queue requirement (real online/offline detection only — the actual local queue is a separate, larger effort). Icon library: Font Awesome (`@fortawesome/react-fontawesome` + free-solid + free-brands, the last one just for the WhatsApp icon) — the teammate's explicit choice.

Mock data layer (`components/lib/mockData.ts`, UI-owned, doesn't touch `lib/db.ts`) mirrors the real services' logic on purpose — same GST slab/threshold (12%/18% at ₹7,500), same SAC code, same CSV header-alias matching — so swapping to real `fetch()` calls later should be close to a one-line change per call site. **Gotcha worth knowing:** a plain module-level array for this didn't work — Next.js dev mode doesn't guarantee a Server Action call and a page's Server Component render share the same module instance, so a booking created via the form silently never showed up on the list (verified with Playwright before catching it). Fixed by persisting to a small gitignored JSON file (`.mock-store.json`) instead, read/written on every call.

Extended `MOCK_BOOKINGS`/`MOCK_ROOMS` with a few more realistic rows (no shape change) so screens have enough variety to preview — including a room above the GST threshold and an inactive one.

**Flagged, not built:** v1's guest-profile/digital-KYC capture needs fields the `Guest` contract doesn't have yet (id type/number) — didn't add them unilaterally per the contract rule; needs a quick sign-off on the exact shape before either side builds against it. UPI-pay button and WhatsApp-confirmation preview are visible on the folio screen but fully inert (disabled / clearly labeled preview-only), per the "never wire a live send" rule.

**For Abhay:** `/dashboard` is still gated by `middleware.ts`'s matcher (`/dashboard/:path*`), so it 500s locally without real Supabase env vars, same as `/login` — the page itself no longer needs Supabase, but the middleware runs first. Didn't touch `middleware.ts` (backend/auth lane) — flagging in case that's worth a matcher exception for local preview, or if it's fine as-is since a hotel would always have real credentials in production.

Verified end-to-end with a headless-browser pass (Playwright, scratch install — not added as a project dependency): all 6 mock-data screens render correctly, and all three interactive flows (create booking, duplicate-room rejection, CSV import against a deliberately messy 4-row file) work end-to-end with the fix above in place.

## 2026-09-08 — Teammate (part 2)
Design pass + three more front-desk features, still on `feature/dashboard-ui`.

**Design:** added Geist (`geist` package) as the site font, monospace for data-dense values (amounts, dates, room numbers, invoice/SAC codes) across all screens, tactile press-down feedback on buttons, a composed empty state for the bookings table, row-hover on data tables. Pulled these from the design-taste skills the teammate had installed, but deliberately skipped everything landing-page-specific in them (GSAP scroll effects, bento grids, marquees, hero rules) — doesn't fit a front-desk tool, and those skills say so themselves.

**Booking lifecycle actions:** confirmed → checked-in → checked-out, or confirmed → cancelled, as icon buttons on each bookings-list row (`updateBookingStatusMock`/`updateBookingStatusAction`, transition table enforced mock-side same as a real endpoint would).

**Calendar view:** `/bookings/calendar` — a room × next-14-days grid, color-coded by status, click a cell to jump to that booking's folio. Toggle between it and the list view (`BookingsViewToggle`, shared by both).

**Guest profile + digital KYC:** proposed and got sign-off on extending the shared `Guest` contract (`types/booking.ts`) with optional `idType`/`idNumber` — both optional, nothing existing breaks. New-booking form now has an optional ID-type/ID-number capture pair. New `/bookings/[id]/guest` page shows the guest's KYC info (or "not captured yet") plus their booking history — matched by phone number since there's no stable cross-booking guest identity in the schema yet (each booking still creates its own `Guest` row; a repeat guest isn't deduplicated). Worth a look if guest dedup ever becomes a real requirement.

Verified the same way as part 1 — real headless-browser pass (fill/click/submit, not just static screenshots) for check-in/check-out, the calendar grid, and both the with-KYC and without-KYC guest profile states. Zero console errors on actual interaction across all of it.

## 2026-09-08 — Teammate (part 3)
Full visual re-skin against a hotel-PMS dashboard reference the teammate provided (screenshots of 4 SaaS dashboards; closest match was a hotel-management one — sidebar, stat tiles, revenue chart, room-status summary, recent activity, quick actions). Design system distilled into `context.md` — read that before touching UI styling so it doesn't drift.

**Color:** switched the accent from near-black to a single blue (`blue-600`) across primary buttons, active nav/tabs, focus rings, links, stat-tile icon badges, and the revenue chart. Status colors (booking/room states) unchanged.

**New dashboard home:** 4 stat tiles (bookings/revenue/guests over the last 7 days + current occupancy) — every number and delta is computed from real mock data (period-over-period from `createdAt`), never invented; a delta is omitted rather than shown as a fake 0%/∞ when the comparison period is empty. A revenue-over-time line chart and a room-status breakdown, both hand-rolled SVG (no charting library needed for two simple charts). Recent-bookings list (icon block instead of fake room photos — no real asset pipeline) and a quick-actions grid linking to the real screens.

**Used the `dataviz` skill** for the two charts — worth knowing for whoever touches charts next: it flags pie/donut as the wrong default for a part-to-whole job like room-status; used a horizontal stacked bar instead, even though the reference screenshot used a donut. Line chart follows its mark specs (2px line, rounded caps, hairline gridlines, hover crosshair+tooltip, no legend for a single series).

**Verification gotcha worth knowing:** `/dashboard` is real-Supabase-gated by `middleware.ts`, so it can't be screenshotted directly without env vars (same known limitation as `/login`). Verified by temporarily re-exporting the same page component at a throwaway route outside the middleware's matcher and outside the `(pages)` route group (inside that group it double-wraps in `AppShell`, since both the component and the group's layout add one) — screenshotted, confirmed, then deleted the throwaway route. Nothing from that workaround is in the working tree.

Same verification standard as parts 1-2: real headless-browser pass, not just a clean build.

Note: `/dashboard-preview` (the throwaway verification route from this entry) is now a **permanent** fixture, not deleted — the teammate asked to actually see `/dashboard` rendered in a browser and couldn't without real Supabase credentials, so it stays as a standing local-dev convenience. Safe to delete once real auth is wired up locally, or worth a conversation about keeping it as a permanent local-preview pattern.

## 2026-09-08 — Teammate (part 4) — ⚠️ explicit v1-scope override, please read

The teammate asked me to replicate a full competing hotel-management product's feature set (reference: a live demo at a different hotel-software company, screenshotted from several of its screens) and add a dashboard Minimal/Detailed toggle. Several of the reference's screens **directly conflict with CLAUDE.md's locked v1 scope** — I flagged this explicitly before building anything (OTA channel manager, WhatsApp/SMS marketing campaigns, a banquet/events module, and a staff-management UI are all either explicitly excluded from v1 or new territory CLAUDE.md never scoped). The teammate's explicit answer, after seeing that flag: **build all of it anyway, as UI-only stubs** — no real OTA sync, no real messaging sends, matching how the reference itself is framed ("demo — sample data only, nothing saved to a server").

I built it that way. Every stub screen carries a visible `IllustrativeBanner` saying so in-app, and `LOGIC.md` has a "Scope note (2026-09-08, part 4)" section marking exactly which screens below that line are stubs vs. real. **This is a deliberate, informed decision by the teammate, not something I decided unilaterally** — flagging clearly here since it's a real deviation from the documented plan and you should know it happened before merging anything from this branch.

**New screens, in the nav now**: Calendar (top-level, was already reachable via Bookings), Halls & events (new `Venue`/`HallEvent` mock concept, entirely separate from Booking/Room — read-only, no create/edit), Customers (guest directory aggregated from bookings, real search filter, inert message-template preview), Channels (OTA partner list, all "not connected — illustrative"), Reports (real occupancy/ADR/RevPAR from mock data + a working CSV export + an inert "Email" button), Users & roles (hardcoded mock staff list, "Invite user" disabled — real provisioning stays on `scripts/create-staff.js`), Settings (Property/Room categories/Rooms/Channels tabs — Room categories and Rooms tabs use real room data, Property and Channels tabs are stubs).

**Also added**: a real (functional, not decorative) topbar search — calls a new `searchMockAction` Server Action in `components/lib/actions.ts` rather than a new `app/api/` route, since that folder stays off-limits; a notification bell that honestly shows "No notifications yet" instead of fabricating alerts; week navigation + guest/status filtering on the bookings calendar; the dashboard Minimal/Detailed toggle (`?view=detailed`), which also introduces two new real metrics — ADR and RevPAR, both computed from actual mock booking data, formulas in `LOGIC.md`.

**Didn't fabricate**: booking "source/channel" field (Booking has none, so Reports shows revenue-by-room instead of the reference's OTA-vs-Direct split, until/unless that's a real contract addition), fake room photos, a fake logged-in staff name, real multi-property switching (the reference has one; BookNook's schema has no property/tenant concept at all — building that would mean inventing an entire data model with zero grounding, so it was skipped rather than faked).

Verified the same way as parts 1-3 — real headless-browser pass across every new screen plus the interactive bits (search, filters, tab switching, CSV export, message-preview modal). One assertion in my own test script flaked on timing (customer search looked like it failed a check that a re-run confirmed works fine) — noting only so nobody rediscovers the same false alarm.

## 2026-09-08 — Teammate (part 5) — Front Desk depth

Phase 1 of a priority-ordered pass through a much larger feature list the teammate provided (39-module reference), agreed on scope with them first: build in ordered passes rather than one flat pile of stubs, and skip backend/infra/security items entirely (multi-tenancy, PCI-DSS, 2FA, encryption, audit persistence, webhook retry, rate limiting — not screens, and several explicitly out of v1 scope) rather than faking UI for them. Still on `feature/dashboard-ui`, backend folders untouched.

**Contract change** (flagged, additive/optional, sign-off given directly this session): `Booking.status` gained `"waitlisted"`/`"no-show"`; `Booking` gained optional `source`, `notes`, `groupId`, `groupName`. Nothing existing breaks — every `Record<Booking["status"], ...>` in the codebase is exhaustive by construction, so the TypeScript compiler forced every consumer to handle the two new statuses (`StatusBadge`, `CalendarGrid`, the transition table) rather than silently missing one.

**Built, all real (not stubs) — recomputes amounts server-mock-side from actual room rates, never trusts a client-sent number, same rule as booking creation:**
- Extend/shorten stay and move-room, unified into one `rescheduleBookingMock`/`rescheduleBookingAction`.
- **Drag-and-drop on the calendar** — grab a booking cell, drop it on a different room/date, it reschedules for real (native HTML5 drag events, no library).
- **Walk-in booking flow** (`/bookings/walk-in`) — creates a booking already checked-in, skips the confirm step.
- **Group bookings** (`/bookings/groups`, `/bookings/groups/new`) — N rooms under one contact and one `groupId`, all-or-nothing validation (no partial group creation), grouped view with per-group totals.
- **Waitlist** — a real status (`waitlisted`), filterable on the bookings list, with Confirm/Cancel row actions.
- **Possible-no-show detection** — a banner surfacing confirmed bookings whose check-in date already passed, computed fresh every render; marking it no-show stays a manual action.
- **Overbooking detection** — scans for overlapping bookings on the same room, surfaces a banner naming both guests/dates. Seeded one real conflict in the mock data (room 301) on purpose so this isn't a banner that can never fire.
- **Calendar day/week/month views** (`?range=`), plain search param, server-rendered.
- **Notes/special-requests field** on the booking form, shown as a hover-icon on the list and inline on the guest profile.

Verified with a real headless-browser interaction pass (not just a clean build): walk-in flow end-to-end, group-booking creation end-to-end, waitlist filter + confirm action, drag-and-drop (moved a real booking to a different room, confirmed the calendar reflects it), and both alert banners firing off the real seeded conflict/no-show data. Zero console errors. Reset `.mock-store.json` afterward so the test-created rows ("Test Walkin Guest", "Test Group Co") don't linger for whoever looks at this next — mock data is back to the seeded baseline in `types/booking.ts`.

**Not yet built** (later phases, per the agreed order): Housekeeping + Maintenance as new modules, Billing/Payments depth (split billing, reconciliation, cash register), Reports depth + custom report builder, remaining stubs (Marketing, Corporate/Travel-agent, Vendor, Reviews, etc).

## 2026-09-08 — Teammate (part 6) — calendar redesign, feedback pass

Teammate feedback: the calendar looked flat/pale and had low utility (one small badge per day, even for a multi-night stay), wanted real guest detail (price, nights, prepaid/postpaid, service charges) reachable from it, and asked for a single bar spanning a whole stay instead of one segment per day.

Rebuilt `CalendarGrid` as a proper Gantt timeline: consecutive days of the same booking now collapse into one spanning `colSpan` bar instead of repeating per day, using bold solid status colors (a deliberate, documented exception to the soft `StatusBadge` pill style used elsewhere — a timeline needs more contrast). Clicking a bar opens a new slide-over (`BookingDetailPanel`) with the full stay breakdown instead of a plain browser tooltip: nights, per-night rate, itemized service charges + total, payment status, notes, and a link to the folio.

**Contract change** (flagged, additive/optional, signed off this session): `Booking` gained `paymentStatus` (`prepaid`/`postpaid`/`partial`) and `extraServices` (`{name, amount}[]`). Seeded a few real examples (Priya Sharma: prepaid + room-service + laundry charges; Arvind Rao: postpaid + minibar; Fatima Sheikh: partial). **Explicitly not wired into the GST folio yet** — service charges show in the detail panel and sum into its total, but `generateFolioMock` still only taxes `amount` (room charges). Flagged both in the panel UI itself and here — real invoice-line-item integration is billing-depth work, a later phase, not skipped silently.

Verified with a headless-browser pass: bar collapsing (3-night stay shows as one "3n" bar), detail panel opening with the right payment-status badge and both service-charge lines. Zero console errors. Reset `.mock-store.json` to the seeded baseline afterward.

## 2026-09-08 — Teammate (part 7) — full pricing control + invoice generation

Teammate feedback (screenshot of the New Booking form): wanted full control over price — rate override, prepaid/postpaid, service charges — and wanted invoice generation to follow naturally from creating a booking.

Added a "Pricing" section to the New Booking form: a List-rate/Custom-rate toggle (staff can charge something other than the room's list rate — negotiated/corporate rate, walk-in haggle), a flat ₹ discount, additional service-charge rows, a payment-status selector (prepaid/postpaid/partial), and an optional note explaining a manual override (audit trail, not used in any calculation). A live running total updates as front desk types.

**Important: this is still "never trust a client-sent amount," not an exception to it.** The form sends a *proposed* rate and discount; `createBookingMock` still computes `amount` from a formula server-(mock)-side and clamps both inputs to sane, non-negative ranges — it never accepts a final total directly from the client. Same contract-change pattern as before (flagged, additive): `Booking` gained `discountAmount` and `priceNote`.

**Real correctness fix while in there**: GST slab determination (`generateFolioMock`) now uses the actual per-night rate charged (`amount / nights`) instead of the room's static list rate — matches how GST on accommodation actually works (tax follows the declared tariff charged, not a nominal list price), and now matters since a booking's rate can genuinely diverge from the room's listed rate.

**Booking creation now redirects straight into the generated invoice** (`/bookings/[id]/folio`) instead of back to the list — "create booking" and "generate invoice" are one flow now, per the ask. Folio page extended to show payment status, the actual rate charged, the discount line, the price note, and (when services exist) a second card with an itemized services list and a grand total — clearly labeled that service charges aren't run through GST in this invoice yet (real billing-logic work, a later phase).

Verified with a real headless-browser pass: filled the pricing section end-to-end (custom rate ₹3,000/night, ₹500 discount, one ₹600 service, prepaid, a price note), confirmed the live estimate matched, submitted, confirmed it landed on the folio page with every field reflected correctly — including the GST slab correctly following the discounted per-night rate (₹2,750, still under the ₹7,500 threshold → 12%, not 18%). Zero console errors. Reset `.mock-store.json` afterward.

## 2026-09-08 — Teammate (part 8) — Housekeeping + Maintenance (phase 2)

Phase 2 of the priority-ordered build (agreed order: Front Desk depth, then Housekeeping + Maintenance, then Billing depth, then Reports depth, then remaining stubs). Still on `feature/dashboard-ui`, backend untouched.

Two new modules, both new mock domains rather than changes to `types/room.ts` — a room's cleanliness/repair history is a sequence of tasks over time, not a static property, so `HousekeepingTask` and `MaintenanceTicket` live in their own files (`components/lib/housekeepingMock.ts`, `maintenanceMock.ts`), file-persisted the same way bookings are, loosely referencing a room number as a string rather than a hard contract relation. No `types/` contract change this round.

**Housekeeping** (`/housekeeping`): a 4-column board (Dirty → Cleaning → Inspected → Ready), one task per active room per day, real fixed-transition enforcement (a room can't skip from dirty straight to ready), staff assignment from a shared mock staff list, priority + notes per task. Auto-reseeds with a fresh varied mix whenever the stored date isn't "today."

**Maintenance** (`/maintenance`): ticket list with status-filter pills, a real create-ticket form (room/category/priority/description), and a real status workflow (open → assigned → in-progress → waiting/resolved → closed) — assigning a technician auto-advances an open ticket to assigned, resolving prompts for an actual repair cost.

**Shared staff list extracted**: `constants/staff.ts` now holds `MOCK_STAFF` (previously a private array inline on the Users & roles page) — Housekeeping and Maintenance's "assign to" dropdowns pull from the same names instead of inventing separate fake staff per screen.

Verified with a real headless-browser pass: housekeeping status advance + staff assignment, maintenance technician assignment (confirmed the auto-transition to "assigned"), and full new-ticket creation end to end. Zero console errors. Reset both new mock-store files afterward.

**Not yet built** (remaining phases): Billing/Payments depth (split billing, reconciliation, cash register), Reports depth + custom report builder, remaining stubs (Marketing, Corporate/Travel-agent, Vendor, Reviews, etc).

## 2026-09-08 — Teammate (part 9) — Billing/Payments depth (phase 3)

Phase 3 of the priority-ordered build. Still on `feature/dashboard-ui`, backend untouched.

Two new mock domains (`components/lib/paymentsMock.ts`, `cashRegisterMock.ts`) plus one contract addition (flagged, additive): `Folio` gained `voided`/`voidReason`.

**Not a payment gateway integration** — recording a payment is front-desk bookkeeping (money was received, note it down), never a real Razorpay call. The BYOG "Pay via UPI" button stays a disabled stub, unchanged.

**Built, real:**
- Payment recording against any booking (cash/UPI/card/bank transfer, advance/partial/full), with a derived (never stored) balance shown as a colored pill on the folio.
- Refunds — recording a refund also auto-issues a credit note in the same action (legally required alongside a GST invoice reduction in India, so it's not a step someone could forget).
- Void invoice — voiding lets the next page load auto-generate a fresh, correctly-numbered invoice; the voided one stays visible as audit history with its reason.
- **GSTR-1 CSV export** on Reports — this is explicitly *in* CLAUDE.md's locked v1 scope (unlike e-invoice/IRN, which stays excluded), so it's real functionality, not a stub: every active (non-voided) invoice's SAC code, taxable value, CGST/SGST, total.
- Outstanding-balance stat + a "Payments due" list on Reports, computed from real recorded payments across every non-cancelled booking.
- Cash register (`/cash-register`) — one entry per day, "cash received" computed for real from that day's actual cash payments (not entered manually), opening-balance continuity from the prior closed day, cash-paid-out logging, and a close-register flow with a real actual-vs-expected variance.

**Deliberately not built** (flagged, not silently skipped): multi-guest bill-splitting (a booking's total split across several guests each paying separately — what got built instead is multiple payment *methods* on one bill), OTA/gateway/bank reconciliation (no real OTA or gateway data exists to reconcile against), auto-settlement, corporate/credit billing (belongs to the future Corporate/Travel-agent phase).

Verified with a real headless-browser pass: recorded a payment to clear a partial balance to "Paid in full," voided that invoice with a reason and confirmed a new invoice number was issued automatically, processed a partial refund on a different booking and confirmed both the balance and the auto-issued credit note appeared, confirmed the cash register's "cash received" figure exactly matched the net of the real payments/refund just recorded (seed ₹9,000 + payment ₹12,240 − refund ₹1,000 = ₹20,240, matched exactly), and confirmed Reports shows both the Outstanding total and the GSTR-1 export. Zero console errors. Reset all mock-store files afterward.

**Remaining phase**: the rest of the original 39-module stub list (Marketing/CRM, Corporate & Travel Agent accounts, Vendor management, Reviews & reputation, etc).

## 2026-09-08 — Teammate (part 10) — final reference-list stub screens

Last phase of the priority-ordered build through the original 39-module reference list. Still on `feature/dashboard-ui`, backend untouched, no contract changes this round.

Four more honest UI-only stubs (`IllustrativeBanner` on each, matching the pattern from part 4): **Marketing & CRM** (`/marketing` — guest segment tiles are real, computed from actual customer data; campaign templates are static, "Launch" always disabled), **Corporate & travel agents** (`/corporate` — sample companies/agents, not linked to real bookings), **Vendors** (`/vendors` — sample suppliers), **Reviews & reputation** (`/reviews` — sample review cards, deliberately not attributed to any real mock guest name or a real platform, to avoid a fabricated review reading as authentic).

**Also regrouped the sidebar** (`constants/nav.ts`, `AppShell.tsx`) into 5 labeled sections (Front desk / Guests / Distribution / Finance / Admin) — it had crossed 18 flat items, which is a real usability problem on its own, not just cosmetic.

`LOGIC.md` now has a closing section listing everything from the original reference list that's deliberately *not* built and why — either explicitly excluded from v1, no real data to build against honestly, or a real future phase (Guest Requests task tracking is flagged as the strongest future candidate, since it'd be genuinely buildable the same way Housekeeping/Maintenance were rather than another stub).

Verified: clean production build (33 routes), headless-browser pass across all 4 new screens plus a screenshot of the regrouped nav. Zero console errors. Reset all mock-store files afterward.

**A note for whoever reviews this branch**: it has grown to 10 STATUS.md entries / 5 commits over one continuous session, which is exactly the "PR grown large" signal CLAUDE.md's own engineering standards call out as worth splitting up in the future. Recommend reviewing and merging what's here before more gets piled on, rather than continuing to grow it further.
