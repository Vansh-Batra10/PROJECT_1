"use client";

import { useState } from "react";

export default function ExportButtons({ documentId, status }: { documentId: string; status: string }) {
  const [busy, setBusy] = useState<"xlsx" | "csv" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const enabled = status === "approved" || status === "exported";

  async function handleExport(format: "xlsx" | "csv") {
    setBusy(format);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/export?format=${format}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Export failed.");
        return;
      }
      window.location.href = data.downloadUrl;
    } catch {
      setError("Export failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport("xlsx")}
        disabled={!enabled || busy !== null}
        title={enabled ? undefined : "Approve the document before exporting"}
        className="text-sm border rounded px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy === "xlsx" ? "Exporting…" : "Export .xlsx"}
      </button>
      <button
        onClick={() => handleExport("csv")}
        disabled={!enabled || busy !== null}
        title={enabled ? undefined : "Approve the document before exporting"}
        className="text-sm border rounded px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy === "csv" ? "Exporting…" : "Export .csv"}
      </button>
      <button
        disabled
        title="Coming soon"
        className="text-sm border rounded px-3 py-1.5 opacity-40 cursor-not-allowed"
      >
        Tally XML (coming soon)
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
