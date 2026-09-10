import { listRooms } from "@/services/roomService";
import { GroupBookingForm } from "@/components/forms/GroupBookingForm";

export default async function NewGroupBookingPage() {
  const rooms = await listRooms();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New group booking</h1>
      <GroupBookingForm rooms={rooms} />
    </div>
  );
}
