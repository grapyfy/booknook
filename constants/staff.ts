// Shared mock staff directory — same sample data the Users & roles screen
// shows, reused here so Housekeeping/Maintenance "assign to" dropdowns pick
// from the same names instead of inventing a second, inconsistent staff list.
// Not a real contract (no staff/user entity exists in types/) — see CLAUDE.md,
// real staff accounts are provisioned via scripts/create-staff.js.
export interface StaffMember {
  name: string;
  email: string;
  role: "OWNER" | "FRONT_DESK" | "ACCOUNTANT" | "HOUSEKEEPING";
}

export const MOCK_STAFF: StaffMember[] = [
  { name: "Anjali Verma", email: "anjali@grandsarovar.in", role: "OWNER" },
  { name: "Ravi Kumar", email: "ravi@grandsarovar.in", role: "FRONT_DESK" },
  { name: "Deepak Bose", email: "deepak@grandsarovar.in", role: "ACCOUNTANT" },
  { name: "Sunita Rawat", email: "sunita@grandsarovar.in", role: "HOUSEKEEPING" },
  { name: "Manoj Tiwari", email: "manoj@grandsarovar.in", role: "HOUSEKEEPING" },
];

export const ROLE_STYLES: Record<StaffMember["role"], string> = {
  OWNER: "bg-blue-100 text-blue-700",
  FRONT_DESK: "bg-green-100 text-green-700",
  ACCOUNTANT: "bg-amber-100 text-amber-700",
  HOUSEKEEPING: "bg-neutral-100 text-neutral-600",
};
