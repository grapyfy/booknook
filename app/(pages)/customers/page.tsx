import { faFileCsv } from "@fortawesome/free-solid-svg-icons";
import { listCustomers } from "@/services/customerService";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { CustomersTable } from "@/components/CustomersTable";

export default async function CustomersPage() {
  const apiCustomers = await listCustomers();
  // Adapt the real backend's CustomerSummary (totalBookings, lastBookingAt, no
  // per-customer idType) to the shape CustomersTable was built against
  // (stays, optional idType) — no KYC-by-customer aggregation exists server-side yet.
  const customers = apiCustomers.map((c) => ({
    name: c.name,
    phone: c.phone,
    email: c.email,
    stays: c.totalBookings,
    totalSpend: c.totalSpend,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Customers</h1>
          <p className="text-sm text-neutral-500">
            Guest directory, aggregated from bookings ({customers.length} guests).
          </p>
        </div>
        <ExportCsvButton
          filename="customers.csv"
          icon={faFileCsv}
          rows={customers.map((c) => ({
            name: c.name,
            phone: c.phone,
            email: c.email ?? "",
            stays: c.stays,
            totalSpend: c.totalSpend,
          }))}
        />
      </div>
      <CustomersTable customers={customers} />
    </div>
  );
}
