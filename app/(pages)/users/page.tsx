// UI-ONLY STUB. Real staff accounts are provisioned via scripts/create-staff.js
// (backend, no public signup — see CLAUDE.md). This screen shows what that
// data would look like in a management UI; "Invite user" is inert.
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { IllustrativeBanner } from "@/components/IllustrativeBanner";

const MOCK_STAFF = [
  { name: "Anjali Verma", email: "anjali@grandsarovar.in", role: "OWNER" },
  { name: "Ravi Kumar", email: "ravi@grandsarovar.in", role: "FRONT_DESK" },
  { name: "Deepak Bose", email: "deepak@grandsarovar.in", role: "ACCOUNTANT" },
  { name: "Sunita Rawat", email: "sunita@grandsarovar.in", role: "HOUSEKEEPING" },
];

const ROLE_STYLES: Record<string, string> = {
  OWNER: "bg-blue-100 text-blue-700",
  FRONT_DESK: "bg-green-100 text-green-700",
  ACCOUNTANT: "bg-amber-100 text-amber-700",
  HOUSEKEEPING: "bg-neutral-100 text-neutral-600",
};

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users & roles</h1>
          <p className="text-sm text-neutral-500">Staff accounts and their access scope.</p>
        </div>
        <Button
          disabled
          title="Real staff accounts are created via scripts/create-staff.js — no public/UI signup exists (CLAUDE.md, no accidental account creation)"
        >
          <FontAwesomeIcon icon={faUserPlus} className="h-3.5 w-3.5" />
          Invite user
        </Button>
      </div>

      <IllustrativeBanner>
        Sample data — real staff accounts are provisioned by Abhay via a backend script, not a UI flow. Only{" "}
        <span className="font-mono">OWNER</span> and <span className="font-mono">FRONT_DESK</span> roles are actually
        enforced today; <span className="font-mono">ACCOUNTANT</span>/<span className="font-mono">HOUSEKEEPING</span>{" "}
        exist in the schema but aren&apos;t wired to any screen yet.
      </IllustrativeBanner>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_STAFF.map((s) => (
              <tr key={s.email} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 font-mono">{s.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_STYLES[s.role]}`}>{s.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
