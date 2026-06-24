import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Extraction } from "@/lib/extraction-schema";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      extractions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { lineItems: true, flags: true },
      },
    },
  });

  if (!document) {
    return (
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <p>Document not found.</p>
      </main>
    );
  }

  const extraction = document.extractions[0];
  const parsed = extraction?.parsed as unknown as Extraction | undefined;

  return (
    <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{document.fileName}</h1>
          <p className="text-sm text-gray-500">
            Status: <span className="font-medium">{document.status}</span>
            {extraction && (
              <>
                {" "}· Overall confidence:{" "}
                <span className="font-medium">{Math.round(extraction.overallConfidence * 100)}%</span>
              </>
            )}
          </p>
        </div>
        <Link href="/documents" className="text-sm underline text-gray-600">
          ← All documents
        </Link>
      </div>

      {!extraction && (
        <p className="text-sm text-red-600">No extraction available for this document yet.</p>
      )}

      {extraction && parsed && (
        <div className="flex flex-col gap-8">
          {extraction.flags.length > 0 && (
            <section>
              <h2 className="text-lg font-medium mb-2">
                {extraction.flags.length} issue{extraction.flags.length === 1 ? "" : "s"} to check
              </h2>
              <ul className="flex flex-col gap-1">
                {extraction.flags.map((flag) => (
                  <li
                    key={flag.id}
                    className={`text-sm rounded px-3 py-2 ${
                      flag.severity === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <span className="font-mono text-xs mr-2">{flag.field}</span>
                    {flag.message}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-lg font-medium mb-2">Header</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="border rounded p-3">
                <h3 className="font-medium mb-2">Supplier</h3>
                <p>{parsed.supplier.name ?? "—"}</p>
                <p className="text-gray-500">{parsed.supplier.gstin ?? "—"}</p>
                <p className="text-gray-500">{parsed.supplier.address ?? "—"}</p>
              </div>
              <div className="border rounded p-3">
                <h3 className="font-medium mb-2">Buyer</h3>
                <p>{parsed.buyer.name ?? "—"}</p>
                <p className="text-gray-500">{parsed.buyer.gstin ?? "—"}</p>
                <p className="text-gray-500">{parsed.buyer.address ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm mt-4">
              <Field label="Document type" value={parsed.document_type} />
              <Field label="Invoice number" value={parsed.invoice_number} />
              <Field label="Invoice date" value={parsed.invoice_date} />
              <Field label="PO number" value={parsed.po_number} />
              <Field label="Place of supply" value={parsed.place_of_supply} />
              <Field label="Reverse charge" value={parsed.reverse_charge?.toString() ?? null} />
              <Field label="Currency" value={parsed.currency} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">Line items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse whitespace-nowrap">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    {["#", "Description", "HSN/SAC", "Qty", "Unit", "Rate", "Taxable", "CGST", "SGST", "IGST", "Cess", "Total"].map(
                      (h) => (
                        <th key={h} className="py-2 px-2">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {extraction.lineItems.map((li) => (
                    <tr key={li.id} className="border-b">
                      <td className="py-1 px-2">{li.serialNo ?? "—"}</td>
                      <td className="py-1 px-2">{li.description ?? "—"}</td>
                      <td className="py-1 px-2">{li.hsnSac ?? "—"}</td>
                      <td className="py-1 px-2">{li.quantity ?? "—"}</td>
                      <td className="py-1 px-2">{li.unit ?? "—"}</td>
                      <td className="py-1 px-2">{li.unitPrice ?? "—"}</td>
                      <td className="py-1 px-2">{li.taxableValue ?? "—"}</td>
                      <td className="py-1 px-2">{li.cgstAmount ?? "—"}</td>
                      <td className="py-1 px-2">{li.sgstAmount ?? "—"}</td>
                      <td className="py-1 px-2">{li.igstAmount ?? "—"}</td>
                      <td className="py-1 px-2">{li.cessAmount ?? "—"}</td>
                      <td className="py-1 px-2">{li.lineTotal ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">Totals</h2>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Field label="Taxable value" value={parsed.totals.total_taxable_value?.toString() ?? null} />
              <Field label="CGST" value={parsed.totals.total_cgst?.toString() ?? null} />
              <Field label="SGST" value={parsed.totals.total_sgst?.toString() ?? null} />
              <Field label="IGST" value={parsed.totals.total_igst?.toString() ?? null} />
              <Field label="Cess" value={parsed.totals.total_cess?.toString() ?? null} />
              <Field label="Round off" value={parsed.totals.round_off?.toString() ?? null} />
              <Field label="Grand total" value={parsed.totals.grand_total?.toString() ?? null} />
              <Field label="Amount in words" value={parsed.totals.amount_in_words} />
            </div>
          </section>

          {parsed.extraction_notes && (
            <section>
              <h2 className="text-lg font-medium mb-2">Extraction notes</h2>
              <p className="text-sm text-gray-600">{parsed.extraction_notes}</p>
            </section>
          )}

          <section>
            <h2 className="text-lg font-medium mb-2">Raw parsed JSON</h2>
            <pre className="text-xs bg-gray-50 border rounded p-4 overflow-x-auto">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p>{value ?? "—"}</p>
    </div>
  );
}
