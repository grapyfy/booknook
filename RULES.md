# RULES.md — Standing rules from the user (UI work)

Living checklist of rules/principles the user has given directly, across sessions, for
building BookNook's UI. Append new ones here as they're said — don't wait to be asked
to update this file. These sit **alongside** `CLAUDE.md` (the shared repo-wide doc with
Abhay), not instead of it — where a rule overlaps, both should stay consistent.

## Scope & ownership
- UI-only work. Never touch `app/api/`, `services/`, `lib/`, `prisma/` — Abhay's lane.
- `types/` is a shared contract. Never change it without explicit sign-off first — even
  additive/optional fields need a stated reason and confirmation before editing.
- Never wire a live WhatsApp/email/payment-gateway send. Build the UI/plumbing freely;
  the actual trigger stays gated/mocked until explicitly reviewed and approved.
- Never trust a client-sent amount. Any price, discount, or total shown in the UI is
  always recomputed by the server/mock layer from source data — the client only
  *proposes* a rate; it never dictates the final number.

## Git & process
- Never commit to `main`. All work happens on a `feature/<name>` branch.
- Industry-level git practice: short-lived branches, real PR review before merge
  (GitHub Flow, per `CLAUDE.md`) — don't let one branch balloon indefinitely; get it
  reviewed/merged, then start the next piece of work clean.
- Keep `LOGIC.md` (exact behavior of every button/link/computed number), `STATUS.md`
  (dated build log), and `CLAUDE.md`'s "Current build status" snapshot updated
  continuously, alongside the code — not as an afterthought at the end.

## Design & consistency
- UI consistency is non-negotiable: colors, fonts, spacing, corner radius, animation,
  and theme must stay identical across every screen — no per-page one-offs.
- Don't ship bland/low-utility UI. If a screen is central to daily use (e.g. the
  calendar), it should surface the real detail that matters (guest info, price,
  nights, prepaid/postpaid, service charges) and use bold, legible color — not pale
  placeholder styling.
- Where a booking/entity spans multiple days or units, represent it as one continuous
  element (e.g. a single spanning bar), not repeated fragments per day/row.
- Booking/pricing UI should give full control (rate override, discount, itemized
  extra charges) rather than a fixed, take-it-or-leave-it number — and that control
  should flow straight into whatever document depends on it (e.g. invoice
  generation follows naturally from a booking's final price). **Current status:**
  extra services/discounts don't flow into the GST folio's tax calc yet — this is
  the target, not a claim that it's done; see CLAUDE.md's status section and
  `BACKEND_LOGIC.md` for the flagged gap.

## Dynamic data — no hardcoding, single source of truth
**The most important rule.** Nothing that a hotel/user could reasonably change should
be hardcoded or duplicated across files. If a value can change (a room's price, a
status label, a channel name, a role, a threshold), it must live in exactly **one**
place, and every screen that displays or computes from it reads that same place.

- Example: if the price of a property/room is changed from one screen, every other
  screen that shows or derives from that price (calendar, folio, booking form,
  reports) must reflect the change automatically — never a second copy of the number.
- Practical pattern already used in this codebase: shared constants/mock-data modules
  (`constants/*.ts`, `components/lib/*Mock.ts`) are the single source of truth;
  components and pages import from them, they never redefine their own local copy of
  the same data.
- Before adding any new literal (a label, a rate, a list of options) used in more than
  one place, check whether it already exists in a shared constant/mock module first —
  extend that, don't fork a second version.

## Abuse/spam protection
- Rate-limit anywhere a user can trigger a repeated action (form submissions, booking
  creation, status changes, search) to prevent spam — even in the mock/UI layer, this
  should be visibly designed for, matching `CLAUDE.md`'s fixed-window, fail-open
  pattern (never let a limiter bug block a legitimate action).

## Mobile responsiveness
- All pages and components must be mobile responsive — every screen usable on a phone
  viewport, not just desktop. No fixed-width layouts, no content that requires
  horizontal scrolling to read (tables/wide grids get their own scroll container, not
  the whole page), no controls that become unreachable when the sidebar/nav doesn't
  fit.

## Claude's suggested additions (flagged for approval, not silently binding)
These aren't things the user has said yet — added because they follow naturally from
the rules above. Tell me to drop any of these if they don't fit.
- **Consistent empty/loading/error states** across every list/table (no screen with a
  silent blank instead of an explicit "no data yet" state).
- **Accessible by default**: real semantic elements/labels, visible focus states,
  sufficient color contrast — especially since bold color is now a deliberate design
  choice (see calendar rule above).
- **No orphaned illustrative stubs**: any screen that exceeds locked v1 scope stays
  visibly labeled (`IllustrativeBanner` pattern already in use) — never silently looks
  real.
- **Verify before calling done**: every feature gets a real interactive check (e.g. via
  Playwright) before being reported complete — a clean build isn't proof it works.

---
*Last updated: 2026-09-09*
