import { listRoomsMock } from "@/components/lib/mockData";
import { MaintenanceTicketForm } from "@/components/forms/MaintenanceTicketForm";

export default function NewMaintenanceTicketPage() {
  const rooms = listRoomsMock();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New maintenance ticket</h1>
      <MaintenanceTicketForm rooms={rooms} />
    </div>
  );
}
