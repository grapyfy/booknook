"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { OTA_PARTNER_NAMES } from "@/constants/channels";
import { setStopSellAction, setAllChannelsStopSellAction, setChannelStopSellAction } from "@/components/lib/actions";
import type { ChannelInventoryEntry } from "@/components/lib/channelInventoryMock";

export function ChannelInventoryMatrix({ roomTypes, entries }: { roomTypes: string[]; entries: ChannelInventoryEntry[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function entryFor(roomType: string, channel: string) {
    return entries.find((e) => e.roomType === roomType && e.channel === channel);
  }

  function toggleCell(roomType: string, channel: string, current: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setStopSellAction(roomType, channel, !current);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  function toggleChannel(channel: string, stopSell: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setChannelStopSellAction(channel, roomTypes, stopSell);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  function pauseAll(stopSell: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setAllChannelsStopSellAction(roomTypes, stopSell);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  const anyStopped = entries.some((e) => e.stopSell);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-400">
          Click a cell to toggle. This updates GRAP&apos;s own record only — no real OTA is connected, so nothing
          is actually pushed anywhere.
        </p>
        <button
          onClick={() => pauseAll(!anyStopped)}
          disabled={pending}
          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 disabled:opacity-50 ${
            anyStopped ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200" : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          <FontAwesomeIcon icon={anyStopped ? faCheck : faTriangleExclamation} className="h-3 w-3" />
          {anyStopped ? "Reopen everything" : "Stop selling everywhere"}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-medium text-neutral-500 border-b border-r border-neutral-200">Room type</th>
              {OTA_PARTNER_NAMES.map((channel) => {
                const channelEntries = entries.filter((e) => e.channel === channel);
                const channelStopped = channelEntries.every((e) => e.stopSell);
                return (
                  <th key={channel} className="px-3 py-3 text-center font-medium text-neutral-500 border-b border-neutral-200 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <span>{channel}</span>
                      <button
                        onClick={() => toggleChannel(channel, !channelStopped)}
                        disabled={pending}
                        className="text-[11px] font-normal text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {channelStopped ? "reopen all" : "pause all"}
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {roomTypes.map((roomType) => (
              <tr key={roomType}>
                <td className="px-4 py-3 border-r border-b border-neutral-100 font-medium whitespace-nowrap">{roomType}</td>
                {OTA_PARTNER_NAMES.map((channel) => {
                  const entry = entryFor(roomType, channel);
                  const stopped = entry?.stopSell ?? false;
                  return (
                    <td key={channel} className="p-2 border-b border-neutral-100 text-center">
                      <button
                        onClick={() => toggleCell(roomType, channel, stopped)}
                        disabled={pending}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium w-full justify-center disabled:opacity-50 ${
                          stopped ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        <FontAwesomeIcon icon={stopped ? faBan : faCheck} className="h-3 w-3" />
                        {stopped ? "Stopped" : "Open"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
