import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StorageService } from "@/lib/storage-service";

const CONTENT_TYPES: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; exportId: string }> }
) {
  const { id, exportId } = await params;
  const exportRecord = await prisma.export.findUnique({ where: { id: exportId } });
  if (!exportRecord || exportRecord.documentId !== id) {
    return NextResponse.json({ error: "Export not found." }, { status: 404 });
  }

  const document = await prisma.document.findUnique({ where: { id } });
  const storage = new StorageService();
  const buffer = await storage.read(exportRecord.filePath);
  const baseName = (document?.fileName ?? "export").replace(/\.[^.]+$/, "");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[exportRecord.format] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${baseName}.${exportRecord.format}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
