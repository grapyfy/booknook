// PREVIEW ROUTE — not part of the real app, exists only so the dashboard can be
// viewed locally without real Supabase credentials. The real /dashboard route is
// gated by middleware.ts's matcher (/dashboard/:path*), which requires a real
// logged-in session — that's backend/auth territory (Abhay's lane), intentionally
// left untouched. This file just re-exports the exact same page component at a
// path the middleware doesn't gate, so it renders the identical UI.
//
// Delete this file once either (a) real Supabase credentials are available
// locally, or (b) this is decided to be worth keeping as a permanent local
// preview convention — don't ship it into a PR without that conversation.
export { default } from "@/app/dashboard/page";
