"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket, faRightFromBracket, faBan, faUserXmark, faCheck, faCalendarPlus } from "@fortawesome/free-solid-svg-icons";
import { updateBookingStatusAction, rescheduleBookingAction } from "@/components/lib/actions";
import type { Booking } from "@/types/booking";

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function BookingRowActions({ id, status, checkOut }: { id: string; status: Booking["status"]; checkOut: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runStatus(next: Booking["status"]) {
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatusAction(id, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function extendOneNight() {
    setError(null);
    startTransition(async () => {
      const result = await rescheduleBookingAction(id, { checkOut: addDays(checkOut, 1) });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {error && <span className="text-red-600 text-xs">{error}</span>}
      {status === "waitlisted" && (
        <>
          <button
            onClick={() => runStatus("confirmed")}
            disabled={pending}
            title="Confirm booking"
            className="text-neutral-500 hover:text-blue-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => runStatus("cancelled")}
            disabled={pending}
            title="Cancel booking"
            className="text-neutral-500 hover:text-red-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faBan} className="h-3.5 w-3.5" />
          </button>
        </>
      )}
      {status === "confirmed" && (
        <>
          <button
            onClick={extendOneNight}
            disabled={pending}
            title="Extend stay by 1 night"
            className="text-neutral-500 hover:text-blue-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faCalendarPlus} className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => runStatus("checked-in")}
            disabled={pending}
            title="Check in"
            className="text-neutral-500 hover:text-green-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRightToBracket} className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => runStatus("no-show")}
            disabled={pending}
            title="Mark as no-show"
            className="text-neutral-500 hover:text-orange-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faUserXmark} className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => runStatus("cancelled")}
            disabled={pending}
            title="Cancel booking"
            className="text-neutral-500 hover:text-red-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faBan} className="h-3.5 w-3.5" />
          </button>
        </>
      )}
      {status === "checked-in" && (
        <>
          <button
            onClick={extendOneNight}
            disabled={pending}
            title="Extend stay by 1 night"
            className="text-neutral-500 hover:text-blue-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faCalendarPlus} className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => runStatus("checked-out")}
            disabled={pending}
            title="Check out"
            className="text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
