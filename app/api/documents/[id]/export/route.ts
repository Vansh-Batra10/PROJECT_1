import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractionSchema } from "@/lib/extraction-schema";
import { ExportService } from "@/lib/export-service";
import { StorageService } from "@/lib/storage-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format");
  if (format !== "xlsx" && format !== "csv") {
    return NextResponse.json({ error: "format must be 'xlsx' or 'csv'." }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { id },
    include: { extractions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  if (document.status !== "approved" && document.status !== "exported") {
    return NextResponse.json({ error: "Document must be approved before exporting." }, { status: 409 });
  }
  const extraction = document.extractions[0];
  if (!extraction) {
    return NextResponse.json({ error: "No extraction exists for this document." }, { status: 404 });
  }

  const parsed = extractionSchema.parse(extraction.parsed);
  const exportService = new ExportService();
  const approvedAt = document.approvedAt;

  const buffer =
    format === "xlsx"
      ? await exportService.buildXlsx(parsed, { fileName: document.fileName, approvedAt })
      : exportService.buildCsv(parsed, { fileName: document.fileName, approvedAt });

  const storage = new StorageService();
  const baseName = document.fileName.replace(/\.[^.]+$/, "");
  const { filePath } = await storage.save(buffer, `${baseName}.${format}`);

  const exportRecord = await prisma.export.create({
    data: { documentId: document.id, format, filePath },
  });

  if (document.status !== "exported") {
    await prisma.document.update({ where: { id: document.id }, data: { status: "exported" } });
  }

  return NextResponse.json({
    exportId: exportRecord.id,
    downloadUrl: `/api/documents/${document.id}/export/${exportRecord.id}`,
  });
}
