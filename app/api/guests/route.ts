import { NextRequest, NextResponse } from "next/server";
import { getBookingsByGuestPhone } from "@/services/guestService";
import { requireStaff } from "@/lib/require-staff";

// Phone as a query param, not a dynamic path segment — phone numbers often contain
// "+", which has special meaning in a URL path/query and is easy to mis-encode;
// a query param forces the caller through encodeURIComponent, a path segment doesn't.
export async function GET(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) return NextResponse.json({ error: "phone query param is required" }, { status: 400 });

  const bookings = await getBookingsByGuestPhone(phone);
  return NextResponse.json({ phone, bookings });
}
