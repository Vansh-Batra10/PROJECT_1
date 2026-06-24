import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: { extractions: { orderBy: { createdAt: "desc" }, take: 1, include: { flags: true } } },
  });
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const extraction = document.extractions[0];
  const hasErrors = extraction?.flags.some((f) => f.severity === "error") ?? false;
  if (hasErrors) {
    return NextResponse.json({ error: "Cannot approve while error-level issues remain." }, { status: 409 });
  }

  await prisma.document.update({ where: { id }, data: { status: "approved", approvedAt: new Date() } });
  return NextResponse.json({ status: "approved" });
}
