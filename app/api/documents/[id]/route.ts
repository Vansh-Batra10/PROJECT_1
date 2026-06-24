import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractionSchema } from "@/lib/extraction-schema";
import { runValidation } from "@/lib/validation-service";
import { diffExtractions } from "@/lib/diff-extraction";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ document });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const parseResult = extractionSchema.safeParse(body.parsed);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid extraction payload.", issues: parseResult.error.issues }, { status: 400 });
  }
  const edited = parseResult.data;

  const document = await prisma.document.findUnique({
    where: { id },
    include: { extractions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  if (document.status === "approved") {
    return NextResponse.json({ error: "Document is approved and locked for editing." }, { status: 409 });
  }
  const extraction = document.extractions[0];
  if (!extraction) {
    return NextResponse.json({ error: "No extraction exists for this document." }, { status: 404 });
  }

  const before = extractionSchema.parse(extraction.parsed);
  const changes = diffExtractions(before, edited);
  const flags = runValidation(edited);

  await prisma.$transaction(async (tx) => {
    if (changes.length > 0) {
      await tx.reviewEdit.createMany({
        data: changes.map((c) => ({
          extractionId: extraction.id,
          field: c.field,
          oldValue: c.oldValue,
          newValue: c.newValue,
        })),
      });
    }

    await tx.extraction.update({
      where: { id: extraction.id },
      data: { parsed: edited, overallConfidence: edited.overall_confidence },
    });

    await tx.lineItem.deleteMany({ where: { extractionId: extraction.id } });
    if (edited.line_items.length > 0) {
      await tx.lineItem.createMany({
        data: edited.line_items.map((li) => ({
          extractionId: extraction.id,
          serialNo: li.serial_no,
          description: li.description,
          hsnSac: li.hsn_sac,
          quantity: li.quantity,
          unit: li.unit,
          unitPrice: li.unit_price,
          discount: li.discount,
          taxableValue: li.taxable_value,
          cgstRate: li.cgst_rate,
          cgstAmount: li.cgst_amount,
          sgstRate: li.sgst_rate,
          sgstAmount: li.sgst_amount,
          igstRate: li.igst_rate,
          igstAmount: li.igst_amount,
          cessRate: li.cess_rate,
          cessAmount: li.cess_amount,
          lineTotal: li.line_total,
        })),
      });
    }

    await tx.validationFlag.deleteMany({ where: { extractionId: extraction.id } });
    if (flags.length > 0) {
      await tx.validationFlag.createMany({
        data: flags.map((f) => ({ extractionId: extraction.id, field: f.field, severity: f.severity, message: f.message })),
      });
    }

    const hasErrors = flags.some((f) => f.severity === "error");
    await tx.document.update({
      where: { id: document.id },
      data: { status: hasErrors ? "needs_review" : "extracted" },
    });
  });

  return NextResponse.json({ flags, changesRecorded: changes.length });
}
