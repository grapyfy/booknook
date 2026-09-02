# BookNook

Front desk, billing, and guest messaging for independent Indian hotels.

Read **`CLAUDE.md`** first — project rules, folder ownership, the data contract convention, and current architecture decisions. Read **`STATUS.md`** for what's been done recently.

## Setup
```bash
npm install
npm run dev
```
Building UI against mock data? That's it — no `.env` needed. Need the real backend (login, real API data)? See "Getting started" in `CLAUDE.md` for how to get credentials from Abhay.

- `/login` — staff login (Supabase Auth)
- `/dashboard` — booking list, real data, requires login — bare-bones, not the real UI (see `CLAUDE.md`)
- `/api/bookings` — GET list, POST create
- `/api/bookings/:id/folio` — GET/POST the GST bill for a booking
- `/api/rooms` — GET list, POST create
- `/api/import/bookings` — POST a `.csv` file, get back the "Nothing Lost" report
