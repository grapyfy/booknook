import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { IllustrativeBanner } from "@/components/IllustrativeBanner";

// Deliberately generic, non-attributable sample text — not tied to any real
// guest name from the mock booking data, and not framed as pulled from an
// actual Google/OTA review feed (no such integration exists). A fabricated
// review with a real-looking name or platform source would be misleading in
// a way a fabricated stat tile isn't.
const SAMPLE_REVIEWS = [
  { rating: 5, text: "Clean room, quick check-in, staff was helpful throughout the stay.", source: "Sample review" },
  { rating: 4, text: "Good location, breakfast could have more variety.", source: "Sample review" },
  { rating: 5, text: "Would book again — great value for the price.", source: "Sample review" },
  { rating: 3, text: "AC took a while to get fixed during our stay, otherwise fine.", source: "Sample review" },
];

export default function ReviewsPage() {
  const avgRating = SAMPLE_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / SAMPLE_REVIEWS.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Reviews & reputation</h1>
        <p className="text-sm text-neutral-500">Guest feedback in one place.</p>
      </div>

      <IllustrativeBanner>
        Sample data only — no Google/OTA review integration exists yet. These aren&apos;t real reviews from real
        guests; shown purely to illustrate the layout a real feed would fill.
      </IllustrativeBanner>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">Average rating</div>
          <div className="text-2xl font-semibold font-mono flex items-center gap-1.5">
            {avgRating.toFixed(1)}
            <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-amber-400" />
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">Total reviews (sample)</div>
          <div className="text-2xl font-semibold font-mono">{SAMPLE_REVIEWS.length}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">Sources connected</div>
          <div className="text-2xl font-semibold font-mono">0</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {SAMPLE_REVIEWS.map((r, i) => (
          <div key={i} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, star) => (
                  <FontAwesomeIcon
                    key={star}
                    icon={faStar}
                    className={`h-3.5 w-3.5 ${star < r.rating ? "text-amber-400" : "text-neutral-200"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-neutral-400">{r.source}</span>
            </div>
            <p className="text-sm text-neutral-600 mt-2">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
