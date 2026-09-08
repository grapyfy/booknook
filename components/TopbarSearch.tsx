"use client";

// A real (functional) search over mock bookings/rooms — not decoration. Calls
// searchMockAction (a Server Action) directly since app/api/ is off-limits
// (Abhay's lane per CLAUDE.md's team split).
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faBed, faUser } from "@fortawesome/free-solid-svg-icons";
import { searchMockAction, type SearchResult } from "@/components/lib/actions";

export function TopbarSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setOpen(true);
    startTransition(async () => {
      const found = await searchMockAction(value);
      setResults(found);
    });
  }

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0 max-w-md">
      <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query && setOpen(true)}
        placeholder="Search guests, rooms, bookings..."
        className="w-full border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-sm bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400"
      />
      {open && query && (
        <div className="absolute top-full mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden z-20">
          {results.length === 0 && <div className="px-4 py-3 text-sm text-neutral-400">No matches.</div>}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false);
                setQuery("");
                router.push(r.href);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-neutral-50"
            >
              <FontAwesomeIcon icon={r.type === "booking" ? faUser : faBed} className="h-3.5 w-3.5 text-neutral-400" />
              <div>
                <div className="font-medium">{r.label}</div>
                <div className="text-xs text-neutral-500 font-mono">{r.sublabel}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
