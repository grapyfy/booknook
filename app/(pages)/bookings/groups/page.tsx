import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUsers } from "@fortawesome/free-solid-svg-icons";
import { listGroupBookingsMock } from "@/components/lib/mockData";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BookingsViewToggle } from "@/components/BookingsViewToggle";

export default function GroupBookingsPage() {
  const groups = listGroupBookingsMock();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Bookings</h1>
          <BookingsViewToggle active="groups" />
        </div>
        <Link href="/bookings/groups/new">
          <Button>
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
            New group booking
          </Button>
        </Link>
      </div>

      {groups.length === 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-12 text-center text-neutral-500">
          <div className="flex flex-col items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-neutral-300" />
            <div>No group bookings yet — create one for multiple rooms under one contact.</div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.groupId} className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{group.groupName}</div>
                <div className="text-xs text-neutral-500">
                  {group.totalRooms} room{group.totalRooms > 1 ? "s" : ""} · Contact: {group.bookings[0].guest.name} ({group.bookings[0].guest.phone})
                </div>
              </div>
              <div className="font-mono font-medium">₹{group.totalAmount.toLocaleString("en-IN")}</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-t border-neutral-100">
                  <th className="py-2 font-medium">Room</th>
                  <th className="py-2 font-medium">Check-in</th>
                  <th className="py-2 font-medium">Check-out</th>
                  <th className="py-2 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {group.bookings.map((b) => (
                  <tr key={b.id} className="border-t border-neutral-50">
                    <td className="py-2 font-mono">{b.roomNumber}</td>
                    <td className="py-2 font-mono">{b.checkIn}</td>
                    <td className="py-2 font-mono">{b.checkOut}</td>
                    <td className="py-2 font-mono">₹{b.amount.toLocaleString("en-IN")}</td>
                    <td className="py-2">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-2 text-right">
                      <Link href={`/bookings/${b.id}/folio`} className="text-neutral-500 hover:text-neutral-900">
                        Folio
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
