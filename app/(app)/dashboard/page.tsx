import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ExportButtons from "@/components/ExportButtons";

const STATUS_LABEL: Record<string, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  extracted: "Processing",
  needs_review: "Needs Review",
  approved: "Approved",
  exported: "Exported",
  failed: "Failed",
};

const STATUS_BADGE: Record<string, string> = {
  uploaded: "bg-background text-muted border-border",
  processing: "bg-primary-soft text-primary border-primary/20",
  extracted: "bg-primary-soft text-primary border-primary/20",
  needs_review: "bg-warning-soft text-warning border-warning-border",
  approved: "bg-success-soft text-success border-success-border",
  exported: "bg-success-soft text-success border-success-border",
  failed: "bg-danger-soft text-danger border-danger-border",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        STATUS_BADGE[status] ?? "bg-background text-muted border-border"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function ConfidencePill({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-sm text-muted">—</span>;
  }
  const pct = Math.round(value * 100);
  const tone =
    pct >= 85 ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="tnum text-sm text-foreground">{pct}%</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FlagChip({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-warning-border bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
      {count} flag{count === 1 ? "" : "s"}
    </span>
  );
}

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      extractions: { orderBy: { createdAt: "desc" }, take: 1, include: { flags: true } },
    },
  });

  return (
    <main className="flex-1 overflow-auto p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h1>
            <p className="mt-1 text-sm text-muted">Track extraction, review, and export status.</p>
          </div>
          <Link
            href="/upload"
            className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Upload new
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="card flex flex-col items-center justify-center gap-2 py-20 text-center">
            <p className="text-sm font-medium text-foreground">No documents yet</p>
            <p className="text-sm text-muted">Upload your first invoice to get started.</p>
            <Link
              href="/upload"
              className="mt-3 rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Upload an invoice
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Confidence</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Export</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const extraction = doc.extractions[0];
                  return (
                    <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-background">
                      <td className="px-4 py-3">
                        <Link href={`/documents/${doc.id}`} className="font-medium text-foreground hover:text-primary">
                          {doc.fileName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ConfidencePill value={extraction ? extraction.overallConfidence : null} />
                      </td>
                      <td className="px-4 py-3">
                        <FlagChip count={extraction ? extraction.flags.length : 0} />
                      </td>
                      <td className="tnum px-4 py-3 text-muted">{doc.createdAt.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <ExportButtons documentId={doc.id} status={doc.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
