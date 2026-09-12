import { listRooms } from "@/services/roomService";
import { MaintenanceTicketForm } from "@/components/forms/MaintenanceTicketForm";

export default async function NewMaintenanceTicketPage() {
  const rooms = await listRooms();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New maintenance ticket</h1>
      <MaintenanceTicketForm rooms={rooms} />
    </div>
  );
}
