import { listRooms } from "@/services/roomService";
import { getGstConfig } from "@/services/billingService";
import { NewBookingForm } from "@/components/forms/NewBookingForm";

export default async function NewBookingPage() {
  const [rooms, gstConfig] = await Promise.all([listRooms(), getGstConfig()]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New booking</h1>
      <NewBookingForm rooms={rooms} gstConfig={gstConfig} />
    </div>
  );
}
