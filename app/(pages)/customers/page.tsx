import { faFileCsv } from "@fortawesome/free-solid-svg-icons";
import { listCustomersMock } from "@/components/lib/mockData";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { CustomersTable } from "@/components/CustomersTable";

export default function CustomersPage() {
  const customers = listCustomersMock();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
