import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruck } from "@fortawesome/free-solid-svg-icons";
import { IllustrativeBanner } from "@/components/IllustrativeBanner";

const MOCK_VENDORS = [
  { name: "Sri Lakshmi Linen Suppliers", category: "Linen & housekeeping", contact: "+919845098001", outstanding: 8500 },
  { name: "FreshFarm Produce Co.", category: "Kitchen & food", contact: "+919900112233", outstanding: 0 },
  { name: "CoolTech AC Services", category: "Maintenance & AMC", contact: "+919812345000", outstanding: 4200 },
  { name: "Bright Electrical Works", category: "Maintenance & AMC", contact: "+919876501234", outstanding: 0 },
];

export default function VendorsPage() {
  const totalOutstanding = MOCK_VENDORS.reduce((sum, v) => sum + v.outstanding, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Vendors</h1>
        <p className="text-sm text-neutral-500">Suppliers and their outstanding payments.</p>
      </div>

      <IllustrativeBanner>
        Sample data — no vendor/purchase-order entity exists yet in the real backend. Illustrative only, nothing here
        is linked to real expenses.
      </IllustrativeBanner>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">Vendors</div>
          <div className="text-2xl font-semibold font-mono">{MOCK_VENDORS.length}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">Total outstanding</div>
          <div className={`text-2xl font-semibold font-mono ${totalOutstanding > 0 ? "text-red-600" : ""}`}>
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_VENDORS.map((v) => (
              <tr key={v.name} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium">
                  <FontAwesomeIcon icon={faTruck} className="h-3.5 w-3.5 text-neutral-400 mr-2" />
                  {v.name}
                </td>
                <td className="px-4 py-3 text-neutral-500">{v.category}</td>
                <td className="px-4 py-3 font-mono">{v.contact}</td>
                <td className={`px-4 py-3 font-mono ${v.outstanding > 0 ? "text-red-600" : "text-neutral-400"}`}>
                  ₹{v.outstanding.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
