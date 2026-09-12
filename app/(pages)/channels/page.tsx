// UI-ONLY STUB (partner cards) + a real, interactive stop-sell matrix.
// CLAUDE.md's v1 scope explicitly defers OTA channel-manager engineering
// until API access is confirmed — "don't build this speculatively." The
// partner cards are illustrative; the stop-sell matrix below is genuinely
// functional (mock-persisted, survives a reload) but never reaches any real
// OTA, since no channel connection exists — see ChannelInventoryMatrix.
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { CHANNEL_PARTNERS } from "@/constants/channels";
import { listRoomsMock } from "@/components/lib/mockData";
import { listChannelInventoryMock } from "@/components/lib/channelInventoryMock";
import { IllustrativeBanner } from "@/components/IllustrativeBanner";
import { SyncNowButton } from "@/components/SyncNowButton";
import { ChannelInventoryMatrix } from "@/components/ChannelInventoryMatrix";

export default function ChannelsPage() {
  const roomTypes = [...new Set(listRoomsMock().map((r) => r.roomType))];
  const inventoryEntries = listChannelInventoryMock(roomTypes);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Channels & integrations</h1>
          <p className="text-sm text-neutral-500">Which OTA partners GRAP is built to support.</p>
        </div>
        <SyncNowButton />
      </div>

      <IllustrativeBanner>
        Partner list is illustrative — per CLAUDE.md&apos;s v1 scope, OTA channel-manager engineering is deferred
        until a specific partner integration is confirmed with a paying hotel. No real MakeMyTrip/Goibibo/Booking.com
        connection exists yet.
      </IllustrativeBanner>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHANNEL_PARTNERS.map((p) => (
          <div key={p.name} className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-medium">{p.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">{p.type}</span>
            </div>
            <p className="text-sm text-neutral-500">{p.desc}</p>
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
              Not connected — illustrative only
            </span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-medium mb-3">Rates & inventory — stop-sell control</h2>
        <ChannelInventoryMatrix roomTypes={roomTypes} entries={inventoryEntries} />
      </div>
    </div>
  );
}
