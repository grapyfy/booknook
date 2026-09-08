import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { listRoomsMock } from "@/components/lib/mockData";
import { Button } from "@/components/ui/Button";

export default function RoomsPage() {
  const rooms = listRoomsMock();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rooms</h1>
        <Link href="/rooms/new">
          <Button>
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
            Add room
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Rate / night</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium font-mono">{room.roomNumber}</td>
                <td className="px-4 py-3">{room.roomType}</td>
                <td className="px-4 py-3 font-mono">₹{room.ratePerNight.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      room.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {room.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
