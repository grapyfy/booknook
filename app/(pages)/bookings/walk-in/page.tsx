import { listRoomsMock } from "@/components/lib/mockData";
import { WalkInBookingForm } from "@/components/forms/WalkInBookingForm";

export default function WalkInBookingPage() {
  const rooms = listRoomsMock();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Walk-in booking</h1>
      <WalkInBookingForm rooms={rooms} />
    </div>
  );
}
