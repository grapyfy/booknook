import { listRoomsMock } from "@/components/lib/mockData";
import { NewBookingForm } from "@/components/forms/NewBookingForm";

export default function NewBookingPage() {
  const rooms = listRoomsMock();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New booking</h1>
      <NewBookingForm rooms={rooms} />
    </div>
  );
}
