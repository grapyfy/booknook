import { listRooms } from "@/services/roomService";
import { getGstConfig } from "@/services/billingService";
import { getPropertySettings } from "@/services/settingsService";
import { NewBookingForm } from "@/components/forms/NewBookingForm";

export default async function NewBookingPage() {
  const [rooms, gstConfig, settings] = await Promise.all([listRooms(), getGstConfig(), getPropertySettings()]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New booking</h1>
      <NewBookingForm
        rooms={rooms}
        gstConfig={gstConfig}
        defaultCheckInTime={settings.defaultCheckInTime}
        defaultCheckOutTime={settings.defaultCheckOutTime}
      />
    </div>
  );
}
