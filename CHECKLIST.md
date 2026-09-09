# GRAP — Security & Polish Checklist

Source: 3 checklists the founder shared (generic "vibecoder" security/polish lists — not GRAP-specific by origin). Filtered and marked against what's actually true in this codebase, not assumed. **Update the status inline as items get done** — don't let this go stale like a to-do list nobody revisits.

Legend: ✅ Done · ⚠️ Partial / needs verification · ❌ Not done, real gap · ➖ Not applicable yet (explain why)

---

## Security — all genuinely relevant, this is a real product handling money + guest PII

| # | Item | Status | Note |
|---|---|---|---|
| 1 | Enable RLS | ➖ | We don't use Supabase's client-side DB access at all — Prisma connects directly (server-only) via connection string, bypassing PostgREST/RLS entirely. This is *safe as long as nothing ever queries Postgres from the browser* — if that ever changes (e.g. a future Supabase Realtime feature), RLS becomes mandatory then, not before. |
| 2 | Hide API keys | ✅ | Server-only in `.env`/`.env.local`, gitignored, never in a client bundle. |
| 3 | Test IDOR attacks | ➖ | No multi-tenant boundary exists yet (v1 is one property — every staff member is meant to see every booking). Becomes a real, must-fix item the moment multi-property support is built. |
| 4 | Scan for git secrets | ⚠️ | Believed clean (checked earlier in the project) — worth an explicit `git log -p | grep` sweep or a tool like `gitleaks` before this repo is ever made public. |
| 5 | Lock admin routes | ✅ | Just done (2026-09-09) — `requireOwner()` on staff management + property/GST settings. |
| 6 | Test user isolation | ➖ | Same as #3 — no isolation boundary needed until multi-property exists. |
| 7 | Rate limit APIs | ⚠️ | Applied (2026-09-09) to booking creation (30/min/staff) and CSV import (5/hour/staff) — the two highest-value targets. Same `lib/rate-limit.ts` helper (DB-backed, fixed-window, fail-open) can be added to other write routes as needed; not yet on every endpoint. |
| 8 | Lock storage buckets | ➖ | No file storage in use yet (CSV import reads the upload directly, doesn't store it). Becomes relevant when guest ID document upload (digital KYC) is built. |
| 9 | Validate all inputs | ✅ | Every API route uses zod schemas with explicit shape (extra/unexpected fields are rejected, not silently accepted). |
| 10 | Block unauthenticated routes | ✅ | Just done (2026-09-09) — every route requires `requireStaff()` at minimum. |
| 11 | Test SQL injection | ✅ | Prisma parameterizes all queries by default; no raw SQL (`$queryRawUnsafe`) used anywhere. |
| 12 | Remove sensitive logs | ⚠️ | No deliberate logging of phone numbers/ID numbers/payment data spotted, but never explicitly audited — worth a `grep -rn "console.log"` pass before this handles real guest data. |
| 13 | Block field tampering | ✅ | Zod's default behavior strips unknown fields — covered by the same validation as #9. |
| 14 | Restrict uploads | ✅ | CSV import now caps at 5MB (2026-09-09), on top of the existing extension check. |
| 15 | Secure server logic | ✅ | Amounts, GST, room-rate lookups all computed server-side — see CLAUDE.md's "never trust a client-sent amount" rule, actually enforced (verified by reading the code, not just the comment). |
| 16 | Trim API responses | ⚠️ | Not audited for over-fetching (e.g. does a booking response ever leak an internal field nobody needs?) — low risk right now, worth a pass later. |
| 17 | Secure auth sessions | ✅ | Supabase Auth + `@supabase/ssr`'s cookie-based session, refreshed via `middleware.ts`. |
| 18 | Scan dependencies | ✅ | `npm audit` checked after every dependency change (see CLAUDE.md's tech-stack section) — one pre-accepted PostCSS issue nested in Next.js's own toolchain, nothing else open. |
| 19 | Test record access | ➖ | Same as #3/#6. |
| 20 | Attack your own app | ❌ | No deliberate adversarial pass done yet — worth a real session trying to break auth/IDOR/rate limits once the database migration is applied and there's something real to attack. |

---

## UI polish ("16 things every vibecoder needs") — filtered for a staff dashboard, not a marketing site

| Item | Status | Note |
|---|---|---|
| Dark mode toggle | ❌ | Nice-to-have, low priority — a front desk usually isn't in a dark room. |
| Cookie banner | ➖ | No third-party tracking/cookies beyond the auth session — nothing to disclose. Revisit only if analytics/ads are ever added. |
| Back-to-top button | ➖ | Dashboard screens aren't long-scroll pages. |
| Mobile menu | ⚠️ | `AppShell` should be checked on an actual tablet — front desk staff commonly use tablets, per the PRD's own persona notes. |
| Keyboard shortcuts | ❌ | Genuinely useful for front-desk speed (e.g. a hotkey for "new booking") — worth it later, not urgent. |
| Hover states | ✅ | Part of Gautam's design system (`context.md`). |
| Scroll bar styling | ➖ | Cosmetic, skip. |
| Copy button | ❌ | Would be useful on invoice numbers/phone numbers — small, easy win later. |
| Skeleton loader | ⚠️ | Mentioned in the design system notes — verify it's actually used on real async loads once wired to the live API (mock data loads instantly, so this hasn't been meaningfully tested yet). |
| Sticky header | ✅ | `AppShell` sidebar/topbar. |
| Skip to content | ❌ | Real accessibility win, low effort — worth adding. |
| Opengraph preview | ➖ | No public-facing pages exist yet to be shared as links. |
| Empty states | ✅ | Built (e.g. bookings table empty state, per STATUS.md). |
| Expandable FAQs | ➖ | No public FAQ page. |
| Toast notifications | ⚠️ | Not clearly confirmed for action feedback (booking created, error, etc.) — verify once real API calls replace mock actions. |
| Password visibility toggle | ❌ | Small, easy UX win on the login form. |

---

## "Is your site fake" (20 items) — mostly public-marketing-site concerns, N/A for an internal tool

| Item | Status | Note |
|---|---|---|
| Custom 404 page | ❌ | Next.js default is fine for now; low priority. |
| CTA above the fold | ➖ | No marketing page exists (Module C — direct booking widget — is explicitly cut from v1). |
| Meta title per page | ➖ | Logged-in internal pages get zero SEO value from this. Relevant only if/when a public booking page ships. |
| Meta description per page | ➖ | Same as above. |
| Open Graph image | ➖ | Same as above. |
| **Favicon** | ✅ | Simple "G" mark added (2026-09-09, `app/icon.tsx`) — a placeholder until a real designed logo exists. |
| **robots.txt** | ✅ | Added (2026-09-09, `app/robots.ts`) — deliberately `disallow: "/"` for everything, since this is a private tool, not something to get indexed. |
| sitemap.xml | ➖ | Nothing public to index. |
| Alt text on every image | ⚠️ | Few real images exist yet (mostly icon-based UI, no real photo asset pipeline per Gautam's notes) — apply this rule once real images (room photos, etc.) are added. |
| Mobile breakpoints | ⚠️ | Same as the mobile-menu note above — verify on a real device. |
| Sticky mobile CTA | ➖ | Not a consumer conversion flow. |
| Loading states | ⚠️ | Same as skeleton-loader note — meaningfully testable once wired to the real (slower) API. |
| Form error states | ✅ | Zod validation produces real error messages; needs a UI-side check that they're surfaced clearly, not just returned as JSON. |
| Thank-you page | ➖ | No checkout/conversion flow in this product's UI. |
| **Privacy policy page** | ❌ | **Not fluff — actually needed before real hotels onboard.** This product handles real guest PII (phone, KYC ID numbers) on behalf of paying hotel customers; a privacy policy is a real compliance requirement, not a vibecoder checklist item. Flagging as a pre-launch requirement. |
| **Terms page** | ❌ | Same reasoning — needed before the first real (non-pilot) hotel signs up, not before. |
| Cookie banner | ➖ | (See UI-polish table above — same reasoning.) |
| Analytics installed | ❌ | Worth having eventually for understanding real usage; not urgent pre-launch. |
| **Real contact address** | ⚠️ | This maps directly to `PropertySettings` (already built) — but that's the *hotel's* address for their GST invoices, not GRAP-the-company's own contact info. GRAP itself will need a real business address/contact once it's a registered company facing real customers (ties to the budget/incorporation planning already in Obsidian memory). |

---

## Bottom line — what's left to act on
Done 2026-09-09: rate limiting (booking creation + CSV import), CSV file-size cap, favicon, `robots.txt`.

Still open, in rough priority order:
1. **Privacy policy + terms pages** — not urgent for pilot/design-partner hotels, but a real blocker before onboarding a hotel that isn't a personal favor.
2. **Toast notifications + skeleton loaders** — verify these once real API calls replace mock actions (can't meaningfully test loading states against instant mock data).
3. **Password visibility toggle, copy button, skip-to-content** — small, easy wins whenever there's a quiet moment.
4. Everything marked ➖ is correctly not-yet-relevant — don't build it speculatively, re-check this table when the thing that would make it relevant (a public booking page, multi-property support, file uploads) actually gets built.
