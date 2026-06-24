import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StorageService } from "@/lib/storage-service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const storage = new StorageService();
  const buffer = await storage.read(document.filePath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${document.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
