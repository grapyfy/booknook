import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faHandshake } from "@fortawesome/free-solid-svg-icons";
import { IllustrativeBanner } from "@/components/IllustrativeBanner";

const MOCK_COMPANIES = [
  { name: "Sarovar Textiles Pvt Ltd", gstin: "27ABCDE1234F1Z5", rate: "₹500 off list rate", creditLimit: 50000, outstanding: 12000 },
  { name: "Nimbus Consulting", gstin: "27PQRSX5678K1Z2", rate: "10% corporate discount", creditLimit: 30000, outstanding: 0 },
];

const MOCK_AGENTS = [
  { name: "Kumar Travels", contact: "+919845011000", commission: "8%", bookingsThisMonth: 3 },
  { name: "GoTrip Holidays", contact: "+919900112200", commission: "10%", bookingsThisMonth: 1 },
];

export default function CorporatePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Corporate & travel agents</h1>
        <p className="text-sm text-neutral-500">Company accounts, negotiated rates, and travel-agent bookings.</p>
      </div>

      <IllustrativeBanner>
        Sample data — there&apos;s no company/agent field on a real booking yet (would need a contract change once
        this is a real requirement), so nothing here is linked to actual bookings. Illustrative only.
      </IllustrativeBanner>

      <div>
        <h2 className="text-sm font-medium text-neutral-500 mb-3">Corporate accounts</h2>
        <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">GSTIN</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Credit limit</th>
                <th className="px-4 py-3 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_COMPANIES.map((c) => (
                <tr key={c.name} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <FontAwesomeIcon icon={faBuilding} className="h-3.5 w-3.5 text-neutral-400 mr-2" />
                    {c.name}
                  </td>
                  <td className="px-4 py-3 font-mono">{c.gstin}</td>
                  <td className="px-4 py-3">{c.rate}</td>
                  <td className="px-4 py-3 font-mono">₹{c.creditLimit.toLocaleString("en-IN")}</td>
                  <td className={`px-4 py-3 font-mono ${c.outstanding > 0 ? "text-red-600" : "text-neutral-400"}`}>
                    ₹{c.outstanding.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-500 mb-3">Travel agents</h2>
        <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Bookings this month</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_AGENTS.map((a) => (
                <tr key={a.name} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <FontAwesomeIcon icon={faHandshake} className="h-3.5 w-3.5 text-neutral-400 mr-2" />
                    {a.name}
                  </td>
                  <td className="px-4 py-3 font-mono">{a.contact}</td>
                  <td className="px-4 py-3">{a.commission}</td>
                  <td className="px-4 py-3 font-mono">{a.bookingsThisMonth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
