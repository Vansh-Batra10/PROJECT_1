import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { extractionSchema } from "@/lib/extraction-schema";
import ReviewScreen from "@/components/ReviewScreen";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      extractions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!document) {
    return (
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <p>Document not found.</p>
        <Link href="/documents" className="text-sm underline text-gray-600">
          ← All documents
        </Link>
      </main>
    );
  }

  const extraction = document.extractions[0];
  if (!extraction) {
    return (
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <p className="text-sm text-red-600">No extraction available for this document yet.</p>
        <Link href="/documents" className="text-sm underline text-gray-600">
          ← All documents
        </Link>
      </main>
    );
  }

  const parsed = extractionSchema.parse(extraction.parsed);

  return (
    <ReviewScreen
      documentId={document.id}
      fileName={document.fileName}
      mimeType={document.mimeType}
      status={document.status}
      initialExtraction={parsed}
    />
  );
}
