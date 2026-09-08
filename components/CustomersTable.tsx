"use client";

// Guest directory with a real (client-side) search filter. The "Message"
// action only ever shows a preview — see MessagePreviewModal — never sends
// anything, per CLAUDE.md's rule against wiring a live WhatsApp/SMS/email send
// before content review.
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faCommentSms } from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/Input";
import type { CustomerSummary } from "@/components/lib/mockData";
import { MessagePreviewModal } from "@/components/MessagePreviewModal";

export function CustomersTable({ customers }: { customers: CustomerSummary[] }) {
  const [query, setQuery] = useState("");
  const [messaging, setMessaging] = useState<CustomerSummary | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q)
    );
  }, [customers, query]);

  return (
    <>
      <div className="relative max-w-sm">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
        <Input
          placeholder="Search name, phone, or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">KYC</th>
              <th className="px-4 py-3 font-medium">Stays</th>
              <th className="px-4 py-3 font-medium">Total spend</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                  No matching guests.
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.phone} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 font-mono">{c.phone}</td>
                <td className="px-4 py-3">{c.email ?? <span className="text-neutral-300">—</span>}</td>
                <td className="px-4 py-3">
                  {c.idType ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                      Captured
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-500 font-medium">
                      None
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono">{c.stays}</td>
                <td className="px-4 py-3 font-mono">₹{c.totalSpend.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setMessaging(c)}
                    className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900"
                    title="Preview a WhatsApp/SMS message (never sent)"
                  >
                    <FontAwesomeIcon icon={faCommentSms} className="h-3.5 w-3.5" />
                    Message
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {messaging && <MessagePreviewModal customer={messaging} onClose={() => setMessaging(null)} />}
    </>
  );
}
