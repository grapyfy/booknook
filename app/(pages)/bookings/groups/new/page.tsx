import { listRoomsMock } from "@/components/lib/mockData";
import { GroupBookingForm } from "@/components/forms/GroupBookingForm";

export default function NewGroupBookingPage() {
  const rooms = listRoomsMock();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New group booking</h1>
      <GroupBookingForm rooms={rooms} />
    </div>
  );
}
