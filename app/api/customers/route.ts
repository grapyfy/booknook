import { NextRequest, NextResponse } from "next/server";
import { listCustomers } from "@/services/customerService";
import { requireStaff } from "@/lib/require-staff";

export async function GET(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const customers = await listCustomers(search);
  return NextResponse.json(customers);
}
