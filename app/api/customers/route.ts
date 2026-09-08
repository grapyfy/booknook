import { NextRequest, NextResponse } from "next/server";
import { listCustomers } from "@/services/customerService";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const customers = await listCustomers(search);
  return NextResponse.json(customers);
}
