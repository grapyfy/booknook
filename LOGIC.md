# BookNook — UI Logic Reference

Living document. Every button, link, computed number, and chart in the UI is described here — what it does, which function it calls, and exactly how any displayed number is calculated. **Update this file in the same commit/session as any change to behavior** — a stale entry here is worse than no entry, so if you change a formula or a button's action, fix its description here too.

All data currently comes from the mock layer (`components/lib/mockData.ts`), persisted to a local gitignored file (`.mock-store.json`) rather than a real database — see `STATUS.md` for why (module-state gotcha in Next.js dev mode) and CLAUDE.md's contract workflow for the plan to swap this for real `fetch()` calls later.

---

## Mock data layer (`components/lib/mockData.ts`)

Core functions everything else calls. Nothing in the UI computes business logic on its own — it all routes through here (or `components/lib/actions.ts`, which wraps these with validation for form submissions).

| Function | What it does |
|---|---|
| `listBookingsMock()` | Returns all bookings, sorted newest-`createdAt`-first. |
| `getBookingMock(id)` | Finds one booking by id. |
| `createBookingMock(input)` | Looks up the room's real rate (`getActiveRoomRate` — throws if the room doesn't exist or `active: false`), computes `nights = max(1, round((checkOut - checkIn) / 1 day))`, `amount = ratePerNight * nights`. The amount is **never** taken from the caller. |
| `updateBookingStatusMock(id, next)` | Enforces the lifecycle table below; throws if the transition isn't allowed. |
| `listRoomsMock()` | Returns all rooms, sorted by room number. |
| `createRoomMock(input)` | Throws if `roomNumber` already exists. New rooms default `active: true`. |
| `getGuestBookingsByPhoneMock(phone)` | Every booking with that phone number, newest first — the "guest history" list. There's no stable guest identity across bookings yet (each booking creates its own `Guest` row), so phone number is the matching key. |
| `generateFolioMock(bookingId)` | Idempotent — returns the existing folio if one was already generated for this booking, otherwise computes a new one (GST math below). |
| `importCsvMock(csvText)` | Parses with PapaParse, matches flexible column headers, produces the "Nothing Lost" report. |
| `getDashboardStatsMock()` | Computes every number on the dashboard — see that section below. |

### Booking status lifecycle

```
confirmed ──check-in──> checked-in ──check-out──> checked-out
    │
    └──cancel──> cancelled
```
`checked-out` and `cancelled` are terminal — no further transitions. Enforced in `updateBookingStatusMock`'s `ALLOWED_TRANSITIONS` table; the UI only renders the buttons that are currently legal (see Bookings List below), and the mock layer would throw anyway if one were called illegally.

### GST folio math (`generateFolioMock`)

```
gstRate   = roomRatePerNight > ₹7,500 ? 18% : 12%     (GST_THRESHOLD, matches services/billingService.ts)
taxAmount = round(baseAmount * gstRate / 100)
cgst      = round(taxAmount / 2)
sgst      = taxAmount - cgst                           (so rounding never drops a rupee)
igst      = 0                                           (v1 assumes intra-state — see CLAUDE.md)
total     = baseAmount + taxAmount
sacCode   = "996311" (fixed, hotel accommodation)
invoiceNumber = "BN-{year}-{00001, sequential}"
```
`roomRatePerNight` here is looked up fresh from the room's *current* rate, not stored on the booking — if a room's rate changes after a booking was made, the folio reflects the rate at generation time.

---

## Dashboard (`app/dashboard/page.tsx`)

All figures come from `getDashboardStatsMock()`. **Every delta is real, period-over-period — never invented.** If a comparison period has zero of something, the delta is omitted entirely (not shown as a fake `0%` or `∞`).

| Element | Calculation |
|---|---|
| **Bookings (7d)** stat | Count of non-cancelled bookings whose `createdAt` falls in the last 7 days (today back through day-6). |
| **Bookings delta** | `% change` vs. the *previous* 7-day window (day-13 through day-7). Undefined (hidden) if the previous window had 0 bookings. |
| **Revenue (7d)** stat | Sum of `amount` for non-cancelled bookings created in the last 7 days. |
| **Revenue delta** | Same period-over-period comparison as bookings. |
| **Guests (7d)** stat | Count of *unique phone numbers* among bookings created in the last 7 days (a rough proxy for unique guests — see the guest-identity note above). |
| **Guests delta** | Same period-over-period comparison. |
| **Occupancy %** | `round(occupiedActiveRooms / totalActiveRooms * 100)`. A room counts as occupied if it's `active` **and** has a booking with status `checked-in` whose stay covers today (`checkIn <= today < checkOut`). No delta shown (no historical occupancy snapshots exist to compare against — showing one would mean inventing a number). |
| **Revenue chart** (`components/charts/RevenueLineChart.tsx`) | X-axis: last 7 calendar days. Y-value per day: sum of `amount` for non-cancelled bookings whose `checkIn` date equals that day (i.e., revenue attributed to check-in date, not booking-creation date). Hover shows a crosshair + exact ₹ tooltip for that day. |
| **Room status bar** (`components/charts/RoomStatusBar.tsx`) | Three segments, widths proportional to counts: **Available** = active rooms currently unoccupied; **Occupied** = active rooms with a current `checked-in` booking (same definition as the occupancy stat); **Maintenance** = rooms with `active: false`. Rendered as a horizontal stacked bar, not a donut — see `context.md` for why. |
| **Recent bookings** list | Last 4 bookings from `listBookingsMock()` (already newest-first). Each row links to `/bookings/{id}/folio`. |
| **Quick actions** | Static links: New booking → `/bookings/new`, Check in/out → `/bookings`, Add room → `/rooms/new`, Import CSV → `/import`. No logic — plain navigation. |

---

## Bookings List (`app/(pages)/bookings/page.tsx`)

| Element | Logic |
|---|---|
| **List / Calendar toggle** | `BookingsViewToggle` — plain links to `/bookings` vs `/bookings/calendar`, `active` prop just controls which tab is highlighted. No state, no data change. |
| **"New booking" button** | Links to `/bookings/new`. |
| Guest name (per row) | Links to `/bookings/{id}/guest` (guest profile). |
| **Row action icons** (`components/forms/BookingRowActions.tsx`) | Rendered conditionally by current status: `confirmed` → shows "check in" (→ `updateBookingStatusAction(id, "checked-in")`) and "cancel" (→ `"cancelled"`) icons. `checked-in` → shows "check out" icon (→ `"checked-out"`). `checked-out`/`cancelled` → no icons (terminal). Each click calls the Server Action, then `router.refresh()` to re-render the list with the new data — no full page reload. |
| **Folio link** (per row) | Links to `/bookings/{id}/folio`. |
| Amount column | Directly `booking.amount` — already computed at creation time (rate × nights), not recalculated on display. |

---

## Bookings Calendar (`app/(pages)/bookings/calendar/page.tsx`)

- Date range: today through today+13 (14 columns, `VISIBLE_DAYS = 14`), computed fresh on every render from `new Date()`.
- Rows: every room from `listRoomsMock()`, including inactive ones (labeled "(inactive)").
- Cell content: for a given (room, date) pair, finds a non-cancelled booking where `roomNumber` matches and `date >= checkIn && date < checkOut` (i.e., check-out day itself shows as free). If found, renders the guest's name in a status-colored pill linking to that booking's folio; otherwise the cell is empty.
- No interactivity beyond the link — this is a read-only grid, not a drag-to-book calendar.

---

## New Booking Form (`components/forms/NewBookingForm.tsx` + `components/lib/actions.ts`)

| Field | Behavior |
|---|---|
| Guest name / phone / email | Plain controlled inputs. Phone is validated server-side (`^\+?[0-9]{10,15}$`) in `createBookingAction`'s zod schema before it ever reaches the mock layer. |
| ID type / ID number (KYC) | Both optional. ID number input is disabled until an ID type is chosen (`disabled={!idType}`) — a number with no declared type isn't meaningful. |
| Check-in / check-out | Native `<input type="date">`. |
| Room `<select>` | Populated from `listRoomsMock()` (fetched server-side in `app/(pages)/bookings/new/page.tsx`, passed down as a prop — not fetched client-side, so it reflects the same data the server would use). Inactive rooms appear but are `disabled` in the dropdown. |
| **"X nights × ₹Y ≈ ₹Z" estimate line** | Client-side-only preview: `nights = max(1, round((checkOut - checkIn) / 1 day))`, `estimate = nights × selectedRoom.ratePerNight`. Explicitly labeled "estimate" because the real amount is always recomputed server-side in `createBookingMock` from the room's actual current rate — this line exists purely so the user isn't guessing before they submit, and is never itself sent anywhere. |
| **"Create booking" button** | Calls `createBookingAction`, which validates (zod) then calls `createBookingMock`. On success, the action calls `redirect("/bookings")` (server-side redirect — the browser never sees the intermediate state). On failure (validation error, room doesn't exist, room inactive), returns `{ok: false, error}` and the form shows it inline without navigating away. |

---

## Rooms List & Add Room (`app/(pages)/rooms/page.tsx`, `components/forms/NewRoomForm.tsx`)

- List: `listRoomsMock()`, sorted by room number. Status pill: green "Active" / gray "Inactive" from the `active` boolean directly.
- Add-room form: validates `roomNumber` (1-20 chars), `roomType` (1-60 chars), `ratePerNight` (positive integer, max 1,000,000) via zod in `createRoomAction`, then `createRoomMock` — which itself throws (surfaced as "Room number already exists") if the room number is a duplicate. New rooms are always created `active: true` — there's no "create as inactive" path in the UI yet.

---

## Folio / Invoice (`app/(pages)/bookings/[id]/folio/page.tsx`)

- Calls `generateFolioMock(id)` on every page load — idempotent, so repeated visits never create duplicate invoices or change the invoice number.
- Every displayed number (base amount, CGST, SGST, total) comes straight from the `Folio` object — no recalculation in the component itself.
- **"Pay via UPI" button** — permanently `disabled`. This is intentionally inert: BYOG (Bring Your Own Gateway) means a real hotel's own Razorpay account would be wired in later; there's no pooled-payment flow per CLAUDE.md's explicit rule against that. Clicking it does nothing.
- **WhatsApp confirmation preview** — the message text is built client-side from the booking/folio data (guest name, room, dates, total, invoice number) purely for display in a `<pre>` block. **Nothing is ever sent** — no WhatsApp API call exists anywhere in this code path, per CLAUDE.md's rule that a live message send needs explicit content review first.

---

## Guest Profile (`app/(pages)/bookings/[id]/guest/page.tsx`)

- Loads the one booking by id, reads its `guest` object directly (name, phone, email, idType, idNumber).
- If `idType`/`idNumber` are both absent: shows "KYC not captured yet" instead of blank fields.
- "Booking history": `getGuestBookingsByPhoneMock(guest.phone)`, excluding the current booking — i.e., every *other* booking made with the same phone number, newest first. This is a phone-number match, not a true guest-id match (see the mock-layer note above) — two different people sharing a number would incorrectly appear as the same guest here; flagged in `STATUS.md` as a gap to revisit if guest deduplication ever becomes a real requirement.

---

## CSV Import (`app/(pages)/import/page.tsx` + `importCsvMock`)

1. File picked → read as text client-side → sent to `importCsvAction` (a Server Action, so parsing happens server-side even though the UI is a client component).
2. Header matching is alias-based and case-insensitive (e.g., "Mobile Number", "Contact", "Phone" all map to the `phone` field) — see `HEADER_ALIASES` in `mockData.ts`.
3. Dates accepted in ISO (`YYYY-MM-DD`) or `D-M-YYYY`/`D/M/YYYY` form, normalized to ISO.
4. Per row, exactly one of three outcomes (never silently dropped):
   - **Imported** — all required fields present, room exists (or gets auto-created if a rate was given), booking created via `createBookingMock`.
   - **Flagged** — missing a required field, unparseable date, or an unknown room with no rate given. Each flagged row carries a specific `reason` string, shown in the report table.
   - **Room auto-created** — if the room number doesn't exist yet but the row supplies a rate, a new room is created on the fly (type `"Imported"`) and the row proceeds to import; the room number is added to the report's `roomsCreated` list.
5. The three summary tiles (**Total rows / Imported / Flagged**) are exact counts from the report object — `totalRows` always equals `imported.length + flagged.length`.

---

## Scope note (2026-09-08, part 4)

Everything from here down was built at the user's **explicit override** of CLAUDE.md's locked v1 scope, after I flagged the conflict (see `STATUS.md`'s part-4 entry). These screens are UI-only stubs unless noted otherwise — no real OTA sync, no real WhatsApp/SMS/email sends, no real staff provisioning. Each is labeled in-app via `IllustrativeBanner` where it's a stub.

## Dashboard Minimal / Detailed toggle

Driven by `?view=detailed` on `/dashboard` (and `/dashboard-preview`) — plain search param, no client state. **Minimal** (default): the 4 headline stat cards + recent bookings only. **Detailed** adds: ADR and RevPAR stat cards, the revenue chart + room-status bar, and Arrivals-today / Departures-today lists, plus the quick-actions grid.

- **ADR (Average Daily Rate)** = `revenue(7d) / roomNightsSold(7d)`, where room-nights sold = sum of `nights` across all non-cancelled bookings created in the last 7 days.
- **RevPAR (Revenue per Available Room)** = `revenue(7d) / (activeRoomCount × 7)`.
- **Arrivals/Departures today** = bookings (any non-cancelled status) whose `checkIn`/`checkOut` equals today's date, respectively.

## Reports (`app/(pages)/reports/page.tsx`)

- Occupancy / ADR / RevPAR: same `getDashboardStatsMock()` values as the dashboard (last 7 days).
- **"Revenue by room"**: sum of `amount` for non-cancelled bookings, grouped by `roomNumber`, across *all* bookings (not just 7 days) — an honest substitute for the reference's "OTA vs Direct" channel-mix chart, since `Booking` has no "source/channel" field to split by.
- **"Export CSV" button** (`components/ExportCsvButton.tsx`) — genuinely functional: builds a real CSV blob client-side from the current booking list and triggers a browser download. Labeled "CSV" not "XLSX" — real `.xlsx` generation would need a new dependency; a CSV blob needs none.
- **"Email" button** — permanently disabled. No email-sending capability exists anywhere in this codebase.

## Customers (`app/(pages)/customers/page.tsx` + `CustomersTable.tsx`)

- `listCustomersMock()` aggregates all bookings **by phone number** into one row per unique phone (same guest-identity caveat as the booking-history feature — see above). Tracks: stays count, total spend (excludes cancelled bookings' amounts), first non-empty email/idType seen.
- Search box filters client-side on name/phone/email — real filtering, not decoration.
- **"Message" button** opens `MessagePreviewModal` — picks a template (`pre-arrival`/`post-stay`/`special-offer`), renders the interpolated text in a `<pre>` block. **Nothing is ever sent** — there is no WhatsApp/SMS/email API call in this component at all, by design.
- **"Export CSV"** — same real `ExportCsvButton` component as Reports.

## Channels & integrations (`app/(pages)/channels/page.tsx`) — STUB

Static list of OTA/metasearch partner names with illustrative descriptions, each marked "Not connected — illustrative only." **"Sync now (demo)"** button just toggles a 900ms fake spinner (`setTimeout`) — no network call, no real sync exists. Conflicts with CLAUDE.md's v1 scope by design (see Scope note above).

## Users & roles (`app/(pages)/users/page.tsx`) — STUB

Hardcoded `MOCK_STAFF` array (not derived from any real data — there's no staff/user contract in `types/`). **"Invite user"** is permanently disabled — real staff accounts are created via `scripts/create-staff.js` (a backend CLI script per CLAUDE.md), not a UI flow, and this page doesn't attempt to replicate that.

## Settings (`app/(pages)/settings/page.tsx`) — mostly STUB

Tabs driven by `?tab=` search param (`property` default, `categories`, `rooms`, `channels`).
- **Property tab**: a form with `disabled` inputs and a `disabled` "Save property" button — labeled "Saves are disabled in this preview."
- **Room categories tab**: real data — groups `listRoomsMock()` by `roomType`, shows count + rate range per type. Not a stub.
- **Rooms tab**: real data — same room list as `/rooms`, read-only here, links out to `/rooms/new` to actually add one.
- **Channels tab**: illustrative mapping table (room type → fake "MMT-N-ILLUSTRATIVE" code) — purely cosmetic, no real channel codes exist.

## Halls & events (`app/(pages)/halls/page.tsx` + `HallsGrid.tsx`, `components/lib/hallsMock.ts`) — STUB, read-only

New mock concept (`Venue`, `HallEvent`) — not in `types/`, not part of the Booking/Room contracts, entirely separate. Static data in `hallsMock.ts`, no create/edit flow (unlike bookings/rooms). Day tabs (`?date=`) show a fixed week starting 2026-09-07; the hourly grid (8:00-19:00) renders each event as an absolutely-positioned block spanning its `startHour`-`endHour` range, colored by status.

## Calendar enhancements (`app/(pages)/bookings/calendar/page.tsx` + `CalendarGrid.tsx`)

- **Week navigation**: `?start=YYYY-MM-DD` search param, prev/next buttons shift by 7 days. Server-rendered, shareable URL.
- **Guest-name search** and **status filter**: real client-side filtering in `CalendarGrid` (a client component) — narrows which bookings can occupy a cell; doesn't refetch, just filters the already-loaded list.

## Topbar search (`components/TopbarSearch.tsx` + `searchMockAction`)

Real, functional search — not decoration. Calls `searchMockAction(query)` (a Server Action in `components/lib/actions.ts`, deliberately **not** a new `app/api/` route, since that folder is Abhay's lane). Matches bookings by guest name/phone/room number, and rooms by number/type; returns up to 8 combined results with links (booking → its folio, room → `/rooms`). Click-outside closes the dropdown.

## Notification bell (`components/NotificationBell.tsx`)

Deliberately inert beyond opening/closing — always shows "No notifications yet," since no real notification system exists. Chosen over fabricating fake notification content, unlike the reference's decorative unread-dot bell.

## Login (`app/login/page.tsx`)

- Real Supabase auth (`signInWithPassword`) — **not mocked**, unlike everything else in this document. Requires real `.env` credentials to actually authenticate; without them the whole route 500s at the `middleware.ts` layer before this page's own code even runs (a known, accepted limitation — see CLAUDE.md and `STATUS.md`).
- On success: `router.push("/dashboard")` + `router.refresh()`. On failure: shows a fixed Hindi-friendly error string ("Email ya password galat hai"), not the raw Supabase error (avoids leaking whether the account exists).

---

## Front Desk depth (2026-09-08, phase 1 of the priority-ordered build)

Contract change (flagged, additive/optional only — sign-off given directly by the teammate in this session): `Booking.status` gained `"waitlisted"` and `"no-show"`; `Booking` gained optional `source`, `notes`, `groupId`, `groupName`. Nothing existing breaks — every consumer of `Booking["status"]` is a `Record` keyed by the full union, so the compiler forced every switch/style-map to be updated (`StatusBadge`, `CalendarGrid`, `mockData.ts`'s `ALLOWED_TRANSITIONS`).

### Reservation lifecycle (`mockData.ts`'s `ALLOWED_TRANSITIONS`)
`confirmed → checked-in | cancelled | no-show`, `waitlisted → confirmed | cancelled`, `checked-in → checked-out`. `checked-out`/`cancelled`/`no-show` are terminal. Enforced the same way as before (throws if an invalid transition is attempted), mirroring what a real status-update endpoint would check server-side.

### Reschedule — extend/shorten stay, move room, drag-and-drop (`rescheduleBookingMock` / `rescheduleBookingAction`)
One function underlies all three, since they're the same operation: update `roomNumber`/`checkIn`/`checkOut` (whichever changed) and **recompute `amount` from the room's real rate × nights** — never trust a client-sent amount, same rule as booking creation. Refuses to reschedule a `checked-out`/`cancelled`/`no-show` booking (history, not editable) and refuses `checkOut <= checkIn`.
- **"Extend stay +1 night"** button (bookings list row, confirmed/checked-in only) — calls this with `checkOut` shifted forward one day.
- **Drag-and-drop on the calendar** (`CalendarGrid.tsx`) — dragging a booking cell to a different room/date cell calls this with the new `roomNumber` and a `checkIn` shifted to the drop date (`checkOut` shifts by the same number of nights, preserving stay length). Only `confirmed`/`checked-in`/`waitlisted` bookings are draggable — checked-out/cancelled/no-show are history. Dropping onto an inactive room is rejected client-side before the action even runs.

### Walk-in bookings (`/bookings/walk-in`, `createWalkInBookingAction`)
Same shape as the regular new-booking form but simpler (no advance-KYC fields, check-in defaults to today) and creates the booking **already `checked-in`** (`initialStatus: "checked-in"`, `source: "walk-in"`) — skips the separate "confirm then check in" steps since the guest is standing at the desk.

### Group bookings (`/bookings/groups`, `/bookings/groups/new`, `createGroupBookingMock`/`listGroupBookingsMock`)
A group booking is **N ordinary `Booking` rows sharing a generated `groupId`/`groupName`** — not a separate entity in the contract. The form takes one contact (name/phone/email) and a dynamic list of `{room, checkIn, checkOut}` rows (minimum 2); every room is validated (exists, active, `checkOut > checkIn`) *before* any row is created, so a group booking either fully succeeds or fully fails — never half-created. Each room's `amount` is computed independently from that room's real rate × its own nights. The groups list page sums `totalAmount` (excluding any cancelled row) and `totalRooms` per group.

### Waitlist (`listWaitlistMock`, `?status=waitlisted` filter on `/bookings`)
Bookings with `status === "waitlisted"` — a guest who wants a specific room but isn't promised it yet. Row actions: **Confirm** (→ `confirmed`) or **Cancel**. No separate nav item — reached via the status filter dropdown on the bookings list, same pattern as filtering to any other status.

### Possible no-shows (`findPossibleNoShowsMock`)
A **suggestion, not an automatic status change**: any `confirmed` booking whose `checkIn` date is already in the past. Surfaced as a banner at the top of `/bookings` ("N possible no-shows... Mark as no-show below if the guest never arrived") listing the guest names — computed fresh from real mock data every render, not a stored flag. Marking it `no-show` is still a manual row action (`confirmed → no-show`).

### Overbooking detection (`findOverbookingConflictsMock`)
There's still no availability check on booking creation (a real endpoint would reject an overlapping booking outright) — this instead scans all non-cancelled/non-checked-out/non-no-show bookings, groups by `roomNumber`, and flags any pair whose `[checkIn, checkOut)` ranges overlap. Surfaced as a red banner on `/bookings` naming both guests, both date ranges, and the room — resolved by dragging one booking to a different room/date on the calendar (uses the reschedule logic above). The seeded mock data deliberately includes one real conflict (room 301: Fatima Sheikh vs. the Malhotra Family Trip group) so this banner has something genuine to show, not a fabricated count.

### Calendar day/week/month views (`/bookings/calendar?range=`)
`range` is `day` (1 day), `week` (7 days, default), or `month` (30 days) — same room × date grid component at any width, prev/next navigation shifts by exactly the visible range's length. Plain search params (`?start=&range=`), server-rendered, shareable URL — no client state for the range itself.

### Notes / special requests
Optional free-text field on `Booking`, captured on the new-booking and walk-in forms. Shown as a small note icon (hover for the text) next to the guest's name on the bookings list, and as an italicized line on the guest-profile page's "This booking" card. Never required, never validated beyond a 500-char cap.

---

## Calendar redesign (2026-09-08, feedback pass)

Replaced the "one badge per day" calendar with a proper Gantt-style timeline. Contract change (flagged, additive/optional): `Booking` gained `paymentStatus?: "prepaid" | "postpaid" | "partial"` and `extraServices?: ExtraService[]` (`{name, amount}`).

- **Spanning bars, not repeated badges**: `CalendarGrid`'s `segmentsFor()` walks each room's visible days and collapses consecutive days covered by the *same* booking into one `<td colSpan={n}>` — a 4-night stay renders as one continuous bar 4 columns wide (with a small "4n" night-count label), not four separate day cells. Filtering (search/status) recomputes segments from the filtered booking set, so a filtered-out booking's days just show as empty again.
- **Bold status colors on the bars** (`STATUS_BAR_STYLES` — solid `bg-blue-600`/`bg-green-600`/etc with white text), a deliberate departure from the soft `StatusBadge` pill palette used in tables — a timeline needs more contrast at a glance. See `context.md`.
- **Click a bar → `BookingDetailPanel`** (slide-over, replaces relying on a browser tooltip): guest name/phone, status + payment-status badges, room, check-in→check-out, nights, per-night rate, an itemized charges breakdown (room charges + each `extraServices` line + total), notes if present, and a link to the full GST folio.
  - **Payment status** (`paymentStatus`): `prepaid` (green), `postpaid` (neutral — the default shown when the field is absent, since that's the front-desk norm), `partial` (amber).
  - **Service charges** (`extraServices`): informational only right now — summed into the panel's "Total" for display, but **not** added to `booking.amount` and **not** included in the GST folio calculation yet. Flagged explicitly in the panel itself ("don't flow into the GST folio yet") — that wiring is billing-depth work (a later phase), not fabricated here.

---

## Full pricing control on the New Booking form (2026-09-08, feedback pass)

Teammate feedback: wanted "full control" over price on the New Booking screen, plus generating the invoice as the natural next step. Contract change (flagged, additive): `Booking` gained `discountAmount?: number` and `priceNote?: string`.

**This is not "trusting a client-sent amount"** (CLAUDE.md's core money rule): the form sends a *proposed* rate/discount, `createBookingMock` still derives `amount` from a formula and clamps every input server-side — it never accepts a final total directly.

- **Rate override** — a "List rate ⇄ Custom rate" toggle on the form. Off: uses the room's real `ratePerNight` (unchanged behavior). On: front desk types a per-night rate (negotiated/corporate/walk-in haggle); `createBookingMock` uses `rateOverride` only if it's a positive number, otherwise silently falls back to the room's real rate — never trusts a non-positive or missing value.
- **Discount** — a flat ₹ amount, clamped server-side to `[0, subtotal]` (`discountAmount` in `createBookingMock`) — can't go negative or exceed the room subtotal itself. Stored on the booking (`Booking.discountAmount`) purely so the folio can show it as a line item.
- **Additional services** — same `ExtraService[]` shape as the calendar detail panel, now captured at booking-creation time instead of only after the fact.
- **Payment status** — prepaid/postpaid/partial, same field the calendar panel already reads.
- **Price note** — free-text audit trail for *why* a rate was overridden/discounted (e.g. "Corporate rate agreed by GM"). Never used in any calculation — display-only.
- **Live estimate** — the form shows nights × effective rate, discount, services, and a running "Estimated total" as the front desk types, computed identically to the server formula (still just a client preview — the real `amount` is always recomputed on save).

**GST slab now follows the actual charged rate, not the room's list rate**: `generateFolioMock` determines the 12%/18% slab from `booking.amount / nights` (the real per-night value charged after any override/discount) instead of the room's static `ratePerNight`. This is the more correct real-world behavior — GST on accommodation is based on the declared tariff actually charged, not a nominal list price — and it now matters because a booking's charged rate can genuinely differ from the room's listed rate.

**Create booking now redirects straight to its folio** (`/bookings/[id]/folio`) instead of back to the bookings list — `createBookingAction` returns the created booking's id and redirects there, so "create booking" and "generate invoice" are one continuous action, matching what was asked for. The folio page now also shows: a payment-status badge, the rate actually charged (vs. list rate implied by the discount line), the discount as its own line item, the price note if present, and — when services exist — a second card ("Additional services") with an itemized list and a "Grand total (room + services)" beneath the GST-taxed room total. **Service charges are explicitly not run through GST in this invoice yet** — labeled as such on the page — that's real billing-logic work for a later phase, not silently skipped.

---

## Housekeeping (2026-09-08, phase 2) — `/housekeeping`

New mock domain (`components/lib/housekeepingMock.ts`), file-persisted to `.mock-store-housekeeping.json` (gitignored, same pattern as `.mock-store.json`). **Not a field on `Room`** — deliberately kept separate, since cleanliness is a daily task sequence, not a static room property, and this avoids a `types/room.ts` contract change for something that's arguably not the shared contract's concern yet.

- One `HousekeepingTask` per active room per day, seeded fresh (varied statuses, not all "ready") whenever the stored data's date isn't today — so the board always reflects "today," matching what front desk would actually see each morning.
- **Status sequence**: `dirty → cleaning → inspected → ready`, enforced by `HK_TRANSITIONS` (same fixed-transition-table pattern as booking statuses). The one non-linear step: `inspected → dirty` (a failed inspection sends the room back), and `ready → dirty` (room gets used again / needs re-cleaning).
- Board is 4 columns (one per status), each task a card with priority, notes, a staff-assign dropdown (filtered to `MOCK_STAFF` with role `HOUSEKEEPING`), and a button to advance to the next status.
- Top stat tiles are exact counts of tasks in each column — not separately computed, same source of truth as the board itself.

## Maintenance (2026-09-08, phase 2) — `/maintenance`

New mock domain (`components/lib/maintenanceMock.ts`), file-persisted to `.mock-store-maintenance.json`. Also deliberately separate from `Room` — a room can accumulate many tickets over its life, so this doesn't fit as a single field.

- **Status sequence**: `open → assigned → in-progress → (waiting | resolved)`, `waiting → in-progress`, `resolved → closed`. `closed` is terminal — enforced by `MAINT_TRANSITIONS`. Assigning a technician to an `open` ticket auto-advances it to `assigned` (`assignMaintenanceTechnicianMock`) — matches how this actually works at a front desk (assigning *is* the "this is being handled" signal).
- **Resolving** a ticket prompts for an actual cost (₹, optional, defaults to 0) — stored on `ticket.cost`, shown on the card once set.
- Category icons (electrical/plumbing/AC/furniture/bathroom/internet/appliance/other) and status/priority pills follow the same badge-styling convention as bookings elsewhere.
- `/maintenance/new` — real create form (room, category, priority, description) via `createMaintenanceTicketAction`, always starts at `open`.
- Status-filter pills at the top (`?status=`) — same search-param pattern as the bookings list filter.

Both modules share `constants/staff.ts` (`MOCK_STAFF`) — extracted from what was previously an inline array on the Users & roles page, so "assign to" dropdowns everywhere pick from the same sample names instead of three screens inventing three different fake staff lists.
