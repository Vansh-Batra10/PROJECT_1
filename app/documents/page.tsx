import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ExportButtons from "@/components/ExportButtons";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { extractions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <Link href="/" className="text-sm underline text-gray-600">
          Upload new →
        </Link>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">No documents uploaded yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">File</th>
              <th className="py-2">Status</th>
              <th className="py-2">Confidence</th>
              <th className="py-2">Uploaded</th>
              <th className="py-2">Export</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  <Link href={`/documents/${doc.id}`} className="underline">
                    {doc.fileName}
                  </Link>
                </td>
                <td className="py-2">{doc.status}</td>
                <td className="py-2">
                  {doc.extractions[0]
                    ? `${Math.round(doc.extractions[0].overallConfidence * 100)}%`
                    : "—"}
                </td>
                <td className="py-2">{doc.createdAt.toLocaleString()}</td>
                <td className="py-2">
                  <ExportButtons documentId={doc.id} status={doc.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
