import { listRooms } from "@/services/roomService";
import { getGstConfig } from "@/services/billingService";
import { WalkInBookingForm } from "@/components/forms/WalkInBookingForm";

export default async function WalkInBookingPage() {
  const [rooms, gstConfig] = await Promise.all([listRooms(), getGstConfig()]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Walk-in booking</h1>
      <WalkInBookingForm rooms={rooms} gstConfig={gstConfig} />
    </div>
  );
}
