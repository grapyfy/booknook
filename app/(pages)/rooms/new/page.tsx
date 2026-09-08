import { NewRoomForm } from "@/components/forms/NewRoomForm";

export default function NewRoomPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Add room</h1>
      <NewRoomForm />
    </div>
  );
}
