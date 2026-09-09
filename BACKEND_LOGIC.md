# GRAP — Backend Logic Reference

Living document, same convention as `LOGIC.md` (the UI's equivalent) — every service function and API route described here: what it does, what it enforces, and exactly how any stored number is computed. **Update this file in the same commit/session as any behavior change.**

All of this is real — a real Postgres database via Supabase, real Prisma migrations, no mock layer. Read `CLAUDE.md` first for the overall architecture/rules; this file is the detail underneath it.

---

## Booking (`services/bookingService.ts`)

### Status lifecycle
```
confirmed ──check-in──> checked-in ──check-out──> checked-out   (terminal)
    │                                                   
    ├──cancel──> cancelled          (terminal)
    └──no-show──> no-show           (terminal)

waitlisted ──confirm──> confirmed
waitlisted ──cancel──> cancelled   (terminal)
```
Enforced in `updateBookingStatus`'s `ALLOWED_TRANSITIONS` table — an illegal transition throws, the route (`PATCH /api/bookings/:id/status`) turns that into a 400, not a 500. The UI is expected to only render legal actions, but this is the real enforcement point regardless of what the UI does.

### Pricing (`createBooking`)
```
roomRate      = getActiveRoomRate(roomNumber)     — throws if the room doesn't exist or is inactive
effectiveRate = rateOverride if given and > 0, else roomRate
nights        = max(1, round((checkOut - checkIn) / 1 day))
subtotal      = effectiveRate * nights
discount      = clamp(discountAmount ?? 0, 0, subtotal)   — never negative, never exceeds subtotal
amount        = subtotal - discount
```
`amount` is **never** accepted from the caller — always this formula. `roomRatePerNight` is stored on the booking as `effectiveRate` (the rate actually charged, override or not) — this is what the GST folio keys off later, so an override or a later room-rate change never retroactively changes an existing booking's tax bracket. `rateOverride`/`discountAmount` themselves aren't currently role-gated (any caller of `createBooking` can propose them) — worth deciding if that should be OWNER-only before this is exposed to real front-desk users broadly; flagged, not decided.

### Reschedule (`rescheduleBooking`)
Same formula, re-run against the (possibly new) room and dates. Throws if the booking is already `checked-out`/`cancelled`/`no-show`. An existing discount is preserved in absolute rupees but clamped to the new subtotal (so shortening a stay can't push `amount` negative).

### Group bookings (`createGroupBooking`)
Real Prisma `$transaction` — creates a `BookingGroup` row plus one `Booking` per room, all inside the transaction. If any room in the list fails validation (doesn't exist / inactive), **none** of the bookings are created — no partial group. Needs at least 2 room numbers.

### Alerts (`findOverbookingConflicts`, `findPossibleNoShows`)
- **Overbooking**: scans `CONFIRMED`/`CHECKED_IN` bookings grouped by room, flags any pair whose `[checkIn, checkOut)` ranges intersect (`a.checkIn < b.checkOut && b.checkIn < a.checkOut`, the standard interval-overlap test).
- **Possible no-show**: `CONFIRMED` bookings whose `checkIn` is before today, with no check-in recorded. Computed fresh every call.

Both surfaced via `GET /api/bookings/alerts`.

---

## GST Folio (`services/billingService.ts`) — unchanged by this pass, still correct
```
gstRate = booking.roomRatePerNight > ₹7,500 ? 18% : 12%
```
Keys off `booking.roomRatePerNight` (the rate actually charged, stored at booking time) — **not** a live lookup of the room's current rate. This was a real correctness bug the UI branch's mock layer had to fix (using the room's live list rate instead of the rate actually charged); the real backend never had that bug, because `roomRatePerNight` was always the per-booking stored value, and `createBooking`'s pricing control (above) sets it to the *effective* rate including any override.

`extraServices` and `discountAmount` are captured on the booking but **not yet folded into the folio's tax calculation** — same explicit deferral the UI branch flagged, not silently skipped. Revisit when billing-depth work (split billing, service-charge invoicing) happens.

---

## Rooms (`services/roomService.ts`)
Unchanged core logic. `getActiveRoomRate` now accepts an optional transaction client so it can run inside `createGroupBooking`'s `$transaction` and see uncommitted writes from earlier in the same transaction.

---

## Guests & Customers

- **`services/guestService.ts`** — `getBookingsByGuestPhone(phone)`: every booking for that phone number, newest first. There's no stable guest identity across bookings (each booking creates its own `Guest` row) — phone is the matching key, same limitation the UI branch flagged. `GET /api/guests?phone=...` (query param, not a path segment — phone numbers contain `+`, which is easy to mis-encode in a URL path).
- **`services/customerService.ts`** — `listCustomers(search?)`: aggregates the guest directory from `Booking`/`Guest`, grouped by phone in application code (not a Prisma `groupBy`, which can't easily express "most recent name per group" without a window function). `totalSpend` excludes cancelled bookings. `GET /api/customers?search=...` matches name or phone, case-insensitive.

---

## Reports (`services/reportsService.ts`)
```
roomNightsAvailable = activeRoomCount * daysInRange
roomNightsSold       = sum of each booking's nights that actually overlap the range
                        (a booking spanning outside the range only contributes its
                        overlapping nights, not its full length)
occupancyRate         = roomNightsSold / roomNightsAvailable * 100
roomRevenue            = sum of each booking's `amount`, attributed proportionally
                        to the nights that fall inside the range
adr (Average Daily Rate)      = roomRevenue / roomNightsSold           (0 if nothing sold)
revPAR (Revenue Per Avail. Room) = roomRevenue / roomNightsAvailable
```
`GET /api/reports/occupancy?start=YYYY-MM-DD&end=YYYY-MM-DD` (defaults to the last 7 days if omitted) — add `&format=csv` for a downloadable report instead of JSON.

---

## Channels (`services/channelService.ts`) — real CRUD, NOT a live OTA sync
`status` (`NOT_CONNECTED` / `IN_PROGRESS` / `CONNECTED`) is a manually-set flag tracking outreach/negotiation — see CLAUDE.md's "OTA integration" section. **Never wire this to a real MakeMyTrip/Goibibo API call** without direct API access actually confirmed first; that's a business-development track, not an engineering one. `GET`/`POST /api/channels`.

---

## Halls & Events (`services/hallService.ts`)
A `Hall` is priced per-event (`ratePerEvent`), not per-night like a `Room`, and doesn't participate in GST accommodation billing — deliberately a separate concept from `Booking`. `createHallEvent` checks for a time-overlap on the same hall before creating (same interval-overlap logic as room overbooking) and throws if found. `amount` is always `hall.ratePerEvent` at booking time, never client-supplied. `GET`/`POST /api/halls`, `GET`/`POST /api/halls/events?hallId=...`.

---

## Housekeeping (`services/housekeepingService.ts`)
```
DIRTY ──> CLEANING ──> INSPECTED ──> READY   (linear, no skipping, terminal at READY)
```
One `HousekeepingTask` row per active room per day (`@@unique([roomId, date])` enforced at the database level, not just in code). `listTasksForDate(date)` auto-creates a `DIRTY` task for any active room that doesn't have one yet for that date — the real-database equivalent of the UI branch's mock "auto-reseed," except it never resets a task someone already started (get-or-create, not delete-and-regenerate). `GET /api/housekeeping?date=YYYY-MM-DD` (defaults to today). `PATCH /api/housekeeping/:id` with `{action: "advance"}` / `{action: "assign", staffId}` / `{action: "update-details", priority?, notes?}`.

---

## Maintenance (`services/maintenanceService.ts`)
```
OPEN ──assign──> ASSIGNED ──> IN_PROGRESS ──> WAITING <──> IN_PROGRESS
                                    │                │
                                    └────> RESOLVED <┘ ──> CLOSED (terminal)
```
Assigning a technician to an `OPEN` ticket auto-advances it to `ASSIGNED` (matches the UI branch's mock exactly). Resolving requires a real `repairCost` (rupees, ≥0) — never defaults to 0 or skips it. `GET /api/maintenance?status=...`, `POST /api/maintenance` (create), `PATCH /api/maintenance/:id` with `{action: "assign", staffId}` / `{action: "set-status", status, repairCost?}`.

---

## Staff (`services/staffService.ts`)
Real provisioning still only via `scripts/create-staff.js` (no public signup, see CLAUDE.md). `listStaff()` / `GET /api/staff` — read-only directory. `setStaffActive(id, active)` / `PATCH /api/staff/:id` — deactivates (not deletes), so a deactivated staffer's historical bookings/tasks keep a valid reference instead of orphaning.

---

## Property Settings (`services/settingsService.ts`)
Singleton — `getPropertySettings()` returns the one `PropertySettings` row, creating a blank one if none exists yet (never returns null, so the Settings screen always has something real to render). `GET`/`PATCH /api/settings/property`.

---

## What's still pending
- **The actual database migration for all of this hasn't been applied yet** — the Supabase project was paused (free-tier auto-pause after ~1 week idle) when this was written; schema is written and type-checked, `npx prisma migrate dev` needs to run once the project is restored. Don't assume any of the tables above exist in the real database until that's done and confirmed.
- Swapping the UI's mock-data calls (`components/lib/mockData.ts` etc.) for real `fetch()` calls against these endpoints — next real step once the migration is applied and both sides agree it's ready.
- Role-gating for `rateOverride`/`discountAmount` (see the Booking pricing section above) — flagged, not decided.
