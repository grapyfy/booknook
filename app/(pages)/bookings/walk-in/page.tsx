import { listRooms } from "@/services/roomService";
import { WalkInBookingForm } from "@/components/forms/WalkInBookingForm";

export default async function WalkInBookingPage() {
  const rooms = await listRooms();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Walk-in booking</h1>
      <WalkInBookingForm rooms={rooms} />
    </div>
  );
}
