"use client";

// A genuinely working CSV export (not the reference's "Export XLSX" — real
// .xlsx generation would need a new dependency; a CSV blob download needs none
// and is honest about what it actually produces).
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Button } from "@/components/ui/Button";

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))];
  return lines.join("\n");
}

export function ExportCsvButton({
  rows,
  filename,
  label = "Export CSV",
  icon,
}: {
  rows: Record<string, string | number>[];
  filename: string;
  label?: string;
  icon: IconDefinition;
}) {
  function handleClick() {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" onClick={handleClick}>
      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
