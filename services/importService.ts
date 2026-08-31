import Papa from "papaparse";
import { db } from "@/lib/db";

// The "Nothing Lost" report — every row is accounted for, either imported or flagged
// with a specific reason. Nothing silently disappears. See CLAUDE.md / the PRD's Module J.
export interface ImportReport {
  totalRows: number;
  imported: { row: number; bookingId: string; guestName: string; roomNumber: string }[];
  flagged: { row: number; reason: string; raw: Record<string, string> }[];
  roomsCreated: string[];
}

// Real hotel spreadsheets don't use consistent column names — match flexibly, case-insensitive.
const HEADER_ALIASES: Record<string, string[]> = {
  guestName: ["name", "guest name", "guest", "customer name", "customer"],
  phone: ["phone", "mobile", "contact", "phone number", "mobile number"],
  checkIn: ["checkin", "check-in", "check in", "arrival", "arrival date", "from"],
  checkOut: ["checkout", "check-out", "check out", "departure", "departure date", "to"],
  roomNumber: ["room", "room no", "room number", "room no.", "room#"],
  rate: ["rate", "amount", "price", "rate per night", "room rate", "tariff"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function findField(row: Record<string, string>, field: keyof typeof HEADER_ALIASES): string | undefined {
  const aliases = HEADER_ALIASES[field];
  for (const key of Object.keys(row)) {
    if (aliases.includes(normalizeHeader(key))) return row[key]?.trim();
  }
  return undefined;
}

// Accepts DD-MM-YYYY, DD/MM/YYYY (the Indian default per the PRD), or ISO YYYY-MM-DD —
// real spreadsheets mix these. Returns null if genuinely unparseable, never guesses.
function parseFlexibleDate(raw: string): Date | null {
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return new Date(raw);

  const dmyMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const date = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return null;
}

export async function importBookingsFromCsv(csvText: string): Promise<ImportReport> {
  const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  const report: ImportReport = { totalRows: rows.length, imported: [], flagged: [], roomsCreated: [] };
  const roomRateCache = new Map<string, number>(); // avoid re-querying the same room per row

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +1 for 0-index, +1 for the header row — matches what a human sees in Excel

    const guestName = findField(row, "guestName");
    const phoneRaw = findField(row, "phone");
    const checkInRaw = findField(row, "checkIn");
    const checkOutRaw = findField(row, "checkOut");
    const roomNumber = findField(row, "roomNumber");
    const rateRaw = findField(row, "rate");

    if (!guestName || !phoneRaw || !checkInRaw || !checkOutRaw || !roomNumber) {
      report.flagged.push({ row: rowNum, reason: "Missing a required field (name, phone, check-in, check-out, or room)", raw: row });
      continue;
    }

    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      report.flagged.push({ row: rowNum, reason: `Unrecognizable phone number: "${phoneRaw}"`, raw: row });
      continue;
    }

    const checkIn = parseFlexibleDate(checkInRaw);
    const checkOut = parseFlexibleDate(checkOutRaw);
    if (!checkIn || !checkOut) {
      report.flagged.push({ row: rowNum, reason: `Unrecognizable date — check-in "${checkInRaw}", check-out "${checkOutRaw}"`, raw: row });
      continue;
    }
    if (checkOut <= checkIn) {
      report.flagged.push({ row: rowNum, reason: "Check-out is not after check-in", raw: row });
      continue;
    }

    // Resolve the room: use it if it exists, create it if the row gives a rate, else flag —
    // never guess a rate, that's exactly the "never trust an amount" rule applied to imports too.
    let ratePerNight = roomRateCache.get(roomNumber);
    if (ratePerNight === undefined) {
      const existingRoom = await db.room.findUnique({ where: { roomNumber } });
      if (existingRoom) {
        ratePerNight = existingRoom.ratePerNight;
      } else if (rateRaw && !isNaN(Number(rateRaw))) {
        const newRoom = await db.room.create({
          data: { roomNumber, roomType: "Imported", ratePerNight: Math.round(Number(rateRaw)) },
        });
        ratePerNight = newRoom.ratePerNight;
        report.roomsCreated.push(roomNumber);
      } else {
        report.flagged.push({ row: rowNum, reason: `Room "${roomNumber}" doesn't exist yet and no rate was given to create it`, raw: row });
        continue;
      }
      roomRateCache.set(roomNumber, ratePerNight);
    }

    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const amount = ratePerNight * nights;

    const booking = await db.booking.create({
      data: {
        checkIn,
        checkOut,
        roomNumber,
        roomRatePerNight: ratePerNight,
        amount,
        guest: { create: { name: guestName, phone } },
      },
    });

    report.imported.push({ row: rowNum, bookingId: booking.id, guestName, roomNumber });
  }

  return report;
}
