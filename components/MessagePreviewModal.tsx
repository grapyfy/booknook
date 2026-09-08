"use client";

// Template preview only — clicking "Preview" never sends anything anywhere.
// No WhatsApp/SMS API call exists in this codebase. Matches the folio page's
// WhatsApp-confirmation-preview pattern (see LOGIC.md).
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/Input";
import type { CustomerSummary } from "@/components/lib/mockData";

const TEMPLATES = {
  "pre-arrival": (name: string) => `Hi ${name}, looking forward to hosting you soon! Reply here for any requests.`,
  "post-stay": (name: string) => `Hi ${name}, thank you for staying with us — hope to see you again!`,
  "special-offer": (name: string) => `Hi ${name}, exclusive rate for our returning guests — reply for details.`,
} as const;

export function MessagePreviewModal({ customer, onClose }: { customer: CustomerSummary; onClose: () => void }) {
  const [template, setTemplate] = useState<keyof typeof TEMPLATES>("pre-arrival");

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg border border-neutral-200 max-w-md w-full p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Message preview — {customer.name}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900">
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <FormField label="Template" htmlFor="template">
          <Select id="template" value={template} onChange={(e) => setTemplate(e.target.value as keyof typeof TEMPLATES)}>
            <option value="pre-arrival">Pre-arrival</option>
            <option value="post-stay">Post-stay thank you</option>
            <option value="special-offer">Special offer</option>
          </Select>
        </FormField>

        <pre className="whitespace-pre-wrap text-sm bg-neutral-50 rounded-lg p-3 border border-neutral-100">
          {TEMPLATES[template](customer.name)}
        </pre>

        <p className="text-xs text-neutral-400">
          This is a preview only — nothing is sent. No WhatsApp/SMS provider is wired up yet.
        </p>

        <Button variant="secondary" onClick={onClose} className="self-end">
          Close
        </Button>
      </div>
    </div>
  );
}
