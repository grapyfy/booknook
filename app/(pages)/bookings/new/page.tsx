import { listRooms } from "@/services/roomService";
import { NewBookingForm } from "@/components/forms/NewBookingForm";

export default async function NewBookingPage() {
  const rooms = await listRooms();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New booking</h1>
      <NewBookingForm rooms={rooms} />
    </div>
  );
}
