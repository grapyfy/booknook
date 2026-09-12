// Client-safe payment-method data — kept separate from
// components/lib/paymentsMock.ts because that file imports `fs`/`path` for its
// mock-store persistence, which can't be bundled into client components. Same
// split as constants/maintenance.ts; see that file's comment for the build
// failure this pattern exists to avoid.
export const PAYMENT_METHODS = ["cash", "upi", "card", "bank_transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Single source of truth for the method display label — was previously
// declared independently in PaymentPanel.tsx while PAYMENT_METHODS (the
// validation list) lived elsewhere, a real drift risk per RULES.md's "no
// hardcoded, single source of truth" rule (adding a method to one without
// the other would silently break either validation or the UI label).
export const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank transfer",
};
