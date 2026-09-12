"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { importCsvAction } from "@/components/lib/actions";
import type { ImportReport } from "@/components/lib/mockData";
import { Button } from "@/components/ui/Button";

export default function ImportPage() {
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setReport(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are supported for now (not .xlsx)");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    const csvText = await file.text();
    const result = await importCsvAction(csvText);
    setLoading(false);
    setReport(result);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Import bookings</h1>
        <p className="text-sm text-neutral-500">
          Upload a .csv export from your old spreadsheet — every row is either imported or flagged with a reason.
          Nothing is silently dropped.
        </p>
      </div>

      <label className="rounded-lg border-2 border-dashed border-neutral-300 bg-white p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-neutral-400 transition-colors">
        <FontAwesomeIcon icon={faUpload} className="h-6 w-6 text-neutral-400" />
        <span className="text-sm text-neutral-600">
          {fileName ?? "Click to choose a .csv file"}
        </span>
        <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
      </label>

      {loading && <p className="text-sm text-neutral-500">Processing…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {report && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="text-2xl font-semibold font-mono">{report.totalRows}</div>
              <div className="text-sm text-neutral-500">Total rows</div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="text-2xl font-semibold font-mono text-green-700">{report.imported.length}</div>
              <div className="text-sm text-neutral-500">Imported</div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="text-2xl font-semibold font-mono text-amber-700">{report.flagged.length}</div>
              <div className="text-sm text-neutral-500">Flagged</div>
            </div>
          </div>

          {report.roomsCreated.length > 0 && (
            <p className="text-sm text-neutral-500">
              Auto-created rooms: {report.roomsCreated.join(", ")}
            </p>
          )}

          {report.imported.length > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
              <div className="px-4 py-2 border-b border-neutral-200 text-sm font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5 text-green-600" />
                Imported
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {report.imported.map((row) => (
                    <tr key={row.row} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-2 text-neutral-500">Row {row.row}</td>
                      <td className="px-4 py-2">{row.guestName}</td>
                      <td className="px-4 py-2">Room {row.roomNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {report.flagged.length > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
              <div className="px-4 py-2 border-b border-neutral-200 text-sm font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5 text-amber-600" />
                Flagged — needs a manual look
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {report.flagged.map((row) => (
                    <tr key={row.row} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-2 text-neutral-500">Row {row.row}</td>
                      <td className="px-4 py-2">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <Button variant="secondary" onClick={() => { setReport(null); setFileName(null); }}>
              Import another file
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
