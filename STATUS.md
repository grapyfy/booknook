# BookNook — Status Log

Append-only. Whichever AI session (either person's) does meaningful work or lands a decision writes its own dated entry here — not the human. Read this before starting work, alongside CLAUDE.md.

## 2026-08-31 — Abhay
Locked v1 scope, payment model (BYOG), team workflow, week 1-8 plan (all in Abhay's Obsidian memory; this file is the shared/repo-visible summary).

Project scaffolded: Next.js 15 + TypeScript + Tailwind, PostgreSQL via Supabase + Prisma (switched from Firebase — see CLAUDE.md "Tech stack" for why). First data contract (`types/booking.ts`) + matching Prisma schema (`prisma/schema.prisma`) written. Stub booking API (`app/api/bookings/route.ts`, zod-validated) and a mock-data dashboard screen (`app/dashboard/page.tsx`) both build clean (`npm run build` passes, no TypeScript errors). No real Supabase project connected yet — `.env.example` lists what's needed.

Working name: BookNook (was "StayGrid" in early planning — provisional).
