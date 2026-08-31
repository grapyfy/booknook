# BookNook

Front desk, billing, and guest messaging for independent Indian hotels.

Read **`CLAUDE.md`** first — project rules, folder ownership, the data contract convention, and current architecture decisions. Read **`STATUS.md`** for what's been done recently.

## Setup
```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

- `/` — placeholder home page
- `/dashboard` — booking list (currently mock data — see `types/booking.ts`)
- `/api/bookings` — booking API (GET list, POST create)
