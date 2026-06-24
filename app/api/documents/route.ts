import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StorageService } from "@/lib/storage-service";
import { ExtractionService } from "@/lib/extraction-service";
import { runValidation } from "@/lib/validation-service";

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export async function GET() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { extractions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type "${file.type}". Allowed: PDF, PNG, JPG, WEBP.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds the 15 MB limit." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = new StorageService();
  const { filePath } = await storage.save(buffer, file.name);

  const document = await prisma.document.create({
    data: {
      fileName: file.name,
      filePath,
      mimeType: file.type,
      status: "processing",
    },
  });

  try {
    const extractor = new ExtractionService();
    const result = await extractor.extract({ fileBuffer: buffer, mimeType: file.type });
    const flags = runValidation(result.parsed);

    const extraction = await prisma.extraction.create({
      data: {
        documentId: document.id,
        rawModelOutput: result.raw as object,
        parsed: result.parsed as object,
        overallConfidence: result.parsed.overall_confidence,
        modelName: result.modelName,
        lineItems: {
          create: result.parsed.line_items.map((li) => ({
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
        },
        flags: { create: flags },
      },
    });

    const hasErrors = flags.some((f) => f.severity === "error");
    await prisma.document.update({
      where: { id: document.id },
      data: { status: hasErrors ? "needs_review" : "extracted" },
    });

    return NextResponse.json({ documentId: document.id, extractionId: extraction.id });
  } catch (err) {
    await prisma.document.update({ where: { id: document.id }, data: { status: "failed" } });
    const message = err instanceof Error ? err.message : "Extraction failed.";
    return NextResponse.json({ error: message, documentId: document.id }, { status: 500 });
  }
}
