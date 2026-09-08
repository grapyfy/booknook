# BookNook — UI Design System

Distilled 2026-09-08 from a hotel-PMS/SaaS-dashboard reference set the teammate provided (four dashboard screenshots — an HR/absence calendar, a project-management dashboard, a credit-dispute dashboard, and a hotel-management dashboard). The closest match to this product is the hotel one: sidebar nav, stat tiles with icon badges, a revenue chart, a room-status summary, a recent-activity list, and quick actions. This file documents what was actually built so it stays consistent — update it if the direction changes, don't let it drift from the real components.

## Stack

Font: **Geist** (`geist` package, `GeistSans`/`GeistMono`), wired in `app/layout.tsx`. Monospace (`font-mono`, Geist Mono) for anything data-dense: amounts, dates, room numbers, phone numbers, invoice/SAC codes, stat-tile values. Everything else stays `font-sans`.

Icons: Font Awesome (`@fortawesome/react-fontawesome` + `free-solid-svg-icons` + `free-brands-svg-icons` for the WhatsApp glyph only). One family, no mixing.

## Color

**One accent: blue** (Tailwind `blue-600` / hover `blue-700`). Used for: primary buttons, active nav item (solid fill), active tab, focus rings (`blue-600/20`), links, stat-tile icon badges (`blue-50` circle + `blue-600` icon), chart line/area.

Neutral base: Tailwind `neutral-*` for text, borders, backgrounds (`neutral-50` page background, white cards, `neutral-200` borders).

Status colors (booking lifecycle + room state) — functional, not decorative, always paired with a text label, never color alone:
- `confirmed` → blue
- `checked-in` / `available` → green
- `checked-out` → neutral/gray
- `cancelled` → red
- `maintenance` → amber

## Layout pattern

`AppShell` (`components/AppShell.tsx`): fixed sidebar (logo mark + nav) + topbar (online-status badge, logout) + content area, `max-w-6xl` centered. Every authenticated screen uses this — either via `app/(pages)/layout.tsx` (screens inside that route group) or by wrapping itself directly (`/dashboard`, which sits outside the group because it's a pre-existing file with real auth wiring — see STATUS.md).

Page header pattern: `<h1 className="text-xl font-semibold">` + a one-line `text-sm text-neutral-500` subtitle underneath. No "Welcome, {name}" personalization — there's no real logged-in identity in mock mode, so the copy stays generic rather than inventing one.

## Components

- `StatCard` (`components/StatCard.tsx`) — icon badge (blue-50 circle) + big mono value + label + optional signed delta (`↑/↓ N% vs last week`). **Deltas are always computed from real mock data** (period-over-period from `createdAt`/`checkIn`), never invented — if the comparison period is zero, the delta is omitted rather than shown as a fake 0% or ∞.
- `RevenueLineChart` (`components/charts/RevenueLineChart.tsx`) — single-series line, hand-rolled SVG (no charting library needed for one line): 2px line, rounded caps, 10% opacity area wash, hairline gridlines, hover crosshair + tooltip. No legend (single series — the panel title already names it).
- `RoomStatusBar` (`components/charts/RoomStatusBar.tsx`) — **a horizontal stacked bar, not a donut/pie.** Room status is a part-to-whole composition, and the [dataviz skill](https://www.anthropic.com) flags pie/donut as the wrong default for that job — a stacked bar reads faster and scales better. Each segment is a status color + icon + label + count (never color alone).
- `Button` / `Input` / `Select` / `FormField` / `StatusBadge` (`components/ui/`) — shared primitives, one corner-radius scale (`rounded-lg`), one focus-ring treatment.
- `BookingsViewToggle` — List/Calendar tab pattern, reused wherever a screen needs two views of the same data.

## What was deliberately *not* copied from the reference images

- No fake room-photo thumbnails in the recent-bookings list (no real asset pipeline yet) — used an icon block instead of inventing stock imagery.
- No "Welcome, {name}" / fake staff identity — no real session in mock mode.
- No notification bell / search bar — both reference dashboards have them, but neither would be functional here yet, and a decorative non-working control is worse than not having one.
- No donut/pie chart for room status, despite the hotel reference using one — see `RoomStatusBar` note above.

## Landing-page design skills (installed, mostly not applicable)

`.agents/skills/` / `.claude/skills/` (installed via `Leonxlnx/taste-skill`) has ~13 skills for Awwwards-style marketing landing pages (GSAP scroll-hijacking, bento grids, hero copy rules). This dashboard pulled only the parts that generalize to any UI (typography discipline, tactile interactive states, contrast/consistency rules) and skipped everything landing-page-specific — those skills say themselves they're "not for dashboards, not data tables, not multi-step product UI."
