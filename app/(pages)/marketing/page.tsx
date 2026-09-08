import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faTag, faGift, faCakeCandles } from "@fortawesome/free-solid-svg-icons";
import { listCustomersMock } from "@/components/lib/mockData";
import { Button } from "@/components/ui/Button";
import { IllustrativeBanner } from "@/components/IllustrativeBanner";

const HIGH_SPENDER_THRESHOLD = 15000;

export default function MarketingPage() {
  const customers = listCustomersMock();

  // Real segments, derived from real booking history — not fabricated counts.
  const segments = [
    { label: "New guests", count: customers.filter((c) => c.stays === 1).length, description: "One stay on record" },
    { label: "Returning guests", count: customers.filter((c) => c.stays > 1).length, description: "2+ stays" },
    {
      label: "High spenders",
      count: customers.filter((c) => c.totalSpend >= HIGH_SPENDER_THRESHOLD).length,
      description: `₹${HIGH_SPENDER_THRESHOLD.toLocaleString("en-IN")}+ total spend`,
    },
    {
      label: "Missing KYC",
      count: customers.filter((c) => !c.idType).length,
      description: "No ID captured yet",
    },
  ];

  const campaigns = [
    { name: "Birthday offers", icon: faCakeCandles, channel: "WhatsApp", description: "10% off, sent around a guest's birthday month." },
    { name: "Low-occupancy push", icon: faTag, channel: "WhatsApp + Email", description: "Discounted rate nudge for slow weekdays." },
    { name: "Repeat-guest offer", icon: faGift, channel: "WhatsApp", description: "A thank-you rate for guests with 3+ stays." },
    { name: "Post-stay review request", icon: faEnvelope, channel: "Email", description: "Sent 2 days after checkout." },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Marketing & CRM</h1>
        <p className="text-sm text-neutral-500">Guest segments and campaign templates.</p>
      </div>

      <IllustrativeBanner>
        Guest segments below are computed from real booking history. Campaigns are illustrative templates only —
        nothing here sends a real message, per CLAUDE.md&apos;s rule against wiring a live WhatsApp/email/SMS send
        before content is explicitly reviewed.
      </IllustrativeBanner>

      <div className="grid grid-cols-4 gap-4">
        {segments.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="text-2xl font-semibold font-mono">{s.count}</div>
            <div className="text-sm font-medium mt-1">{s.label}</div>
            <div className="text-xs text-neutral-400 mt-0.5">{s.description}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-500 mb-3">Campaign templates</h2>
        <div className="grid grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <div key={c.name} className="rounded-lg border border-neutral-200 bg-white p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={c.icon} className="h-4 w-4 text-neutral-500" />
                </div>
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">{c.channel}</div>
                  <p className="text-sm text-neutral-500 mt-1">{c.description}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                disabled
                title="Sample template only — not wired to a real send"
                className="shrink-0"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="h-3.5 w-3.5" />
                Launch
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
