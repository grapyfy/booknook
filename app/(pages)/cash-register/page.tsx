import { getOrInitTodayRegisterMock, listRegisterHistoryMock } from "@/components/lib/cashRegisterMock";
import { CashRegisterPanel } from "@/components/CashRegisterPanel";

export default function CashRegisterPage() {
  const today = getOrInitTodayRegisterMock();
  const history = listRegisterHistoryMock().filter((d) => d.date !== today.date);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Cash register</h1>
        <p className="text-sm text-neutral-500">
          Today, {today.date}. &quot;Cash received&quot; is computed from real cash payments recorded on bookings today.
        </p>
      </div>

      <CashRegisterPanel today={today} />

      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-neutral-500 mb-3">History</h2>
          <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Opening</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Paid out</th>
                  <th className="px-4 py-3 font-medium">Expected</th>
                  <th className="px-4 py-3 font-medium">Actual</th>
                  <th className="px-4 py-3 font-medium">Variance</th>
                </tr>
              </thead>
              <tbody>
                {history.map((d) => (
                  <tr key={d.date} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-mono">{d.date}</td>
                    <td className="px-4 py-3 font-mono">₹{d.openingBalance.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono">₹{d.cashReceived.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono">₹{d.totalPaidOut.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono">₹{d.closingBalanceExpected.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono">
                      {typeof d.closingBalanceActual === "number" ? `₹${d.closingBalanceActual.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {typeof d.variance === "number" ? (
                        <span className={d.variance === 0 ? "text-green-600" : "text-red-600"}>
                          {d.variance > 0 ? "+" : ""}
                          {d.variance.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
