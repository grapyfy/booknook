import Link from "next/link";
import { listRoomsMock } from "@/components/lib/mockData";
import { listRateRulesMock } from "@/components/lib/rateRulesMock";
import { getPropertySettings } from "@/services/settingsService";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { IllustrativeBanner } from "@/components/IllustrativeBanner";
import { RateRuleForm } from "@/components/forms/RateRuleForm";
import { RateRuleRow } from "@/components/RateRuleRow";
import { DefaultTimesForm } from "@/components/forms/DefaultTimesForm";

const TABS = [
  { key: "property", label: "Property" },
  { key: "categories", label: "Room categories" },
  { key: "rooms", label: "Rooms" },
  { key: "pricing", label: "Pricing" },
  { key: "channels", label: "Channels" },
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab = TABS.some((t) => t.key === tabParam) ? tabParam! : "property";
  const rooms = listRoomsMock();
  const rateRules = listRateRulesMock();
  const settings = await getPropertySettings();

  const categories = new Map<string, { count: number; rates: number[] }>();
  for (const r of rooms) {
    const entry = categories.get(r.roomType) ?? { count: 0, rates: [] };
    entry.count += 1;
    entry.rates.push(r.ratePerNight);
    categories.set(r.roomType, entry);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-neutral-500">Property details, room categories, and channel mappings.</p>
      </div>

      <div className="border-b border-neutral-200 flex gap-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "property" ? "/settings" : `/settings?tab=${t.key}`}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "property" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col gap-4 max-w-lg">
            <IllustrativeBanner>Saves are disabled in this preview — this shows the layout only.</IllustrativeBanner>
            <FormField label="Property name" htmlFor="propName">
              <Input id="propName" defaultValue="" placeholder="Your hotel's name" disabled />
            </FormField>
            <FormField label="City / State" htmlFor="propCity">
              <Input id="propCity" defaultValue="" placeholder="City, State" disabled />
            </FormField>
            <FormField label="GSTIN" htmlFor="propGstin">
              <Input id="propGstin" defaultValue="" placeholder="15-character GSTIN" disabled />
            </FormField>
            <Button disabled className="self-start">
              Save property
            </Button>
          </div>

          {/* Real, wired to PropertySettings — unlike the block above. */}
          <DefaultTimesForm defaultCheckInTime={settings.defaultCheckInTime} defaultCheckOutTime={settings.defaultCheckOutTime} />
        </div>
      )}

      {tab === "categories" && (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Rooms</th>
                <th className="px-4 py-3 font-medium">Rate range</th>
              </tr>
            </thead>
            <tbody>
              {[...categories.entries()].map(([type, { count, rates }]) => (
                <tr key={type} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{type}</td>
                  <td className="px-4 py-3 font-mono">{count}</td>
                  <td className="px-4 py-3 font-mono">
                    ₹{Math.min(...rates).toLocaleString("en-IN")}
                    {Math.min(...rates) !== Math.max(...rates) && ` – ₹${Math.max(...rates).toLocaleString("en-IN")}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "rooms" && (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-mono font-medium">{r.roomNumber}</td>
                  <td className="px-4 py-3">{r.roomType}</td>
                  <td className="px-4 py-3 font-mono">₹{r.ratePerNight.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        r.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {r.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-neutral-100">
            <Link href="/rooms/new" className="text-sm text-blue-600 hover:underline">
              Add a room →
            </Link>
          </div>
        </div>
      )}

      {tab === "pricing" && (
        <div className="flex flex-col gap-4">
          <IllustrativeBanner>
            Dynamic pricing (weekly/festival rate rules) is real, live backend logic — <span className="font-mono">RateRule</span>{" "}
            table, migrated, wired into booking pricing (see <span className="font-mono">BACKEND_LOGIC.md</span>). This screen isn&apos;t
            wired to it yet, so changes here are sample data only, same &quot;mock first, swap once ready&quot; step every screen
            goes through.
          </IllustrativeBanner>
          <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-4 py-3 font-medium">Rule</th>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Adjustment</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rateRules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                      No rate rules yet — add one below.
                    </td>
                  </tr>
                )}
                {rateRules.map((rule) => (
                  <RateRuleRow key={rule.id} rule={rule} />
                ))}
              </tbody>
            </table>
          </div>
          <RateRuleForm />
        </div>
      )}

      {tab === "channels" && (
        <div className="flex flex-col gap-4">
          <IllustrativeBanner>
            Illustrative mapping only — see the{" "}
            <Link href="/channels" className="underline">
              Channels
            </Link>{" "}
            page for the full OTA-partner stub.
          </IllustrativeBanner>
          <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Room type</th>
                  <th className="px-4 py-3 font-medium">External code</th>
                </tr>
              </thead>
              <tbody>
                {[...categories.keys()].map((type, i) => (
                  <tr key={type} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3">MakeMyTrip</td>
                    <td className="px-4 py-3">{type}</td>
                    <td className="px-4 py-3 font-mono text-neutral-400">MMT-{i + 1}-ILLUSTRATIVE</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
