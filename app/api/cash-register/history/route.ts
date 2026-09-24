import { NextResponse } from "next/server";
import { listRegisterHistory } from "@/services/cashRegisterService";
import { requireStaff } from "@/lib/require-staff";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  return NextResponse.json(await listRegisterHistory());
}
