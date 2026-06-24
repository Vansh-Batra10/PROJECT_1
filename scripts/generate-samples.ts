import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { promises as fs } from "fs";
import path from "path";

const SAMPLES_DIR = path.resolve(__dirname, "..", "samples");

interface LineItem {
  sn: number;
  desc: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  taxable: number;
  cgstRate?: number;
  cgstAmt?: number;
  sgstRate?: number;
  sgstAmt?: number;
  igstRate?: number;
  igstAmt?: number;
  total: number;
}

interface InvoiceSpec {
  fileName: string;
  title: string;
  invoiceNo: string;
  date: string;
  poNumber?: string;
  supplier: { name: string; gstin: string; address: string };
  buyer: { name: string; gstin: string; address: string };
  placeOfSupply: string;
  items: LineItem[];
  grandTotal: number;
  noTax?: boolean;
  messy?: boolean;
}

async function renderInvoice(spec: InvoiceSpec) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const left = 40;

  function text(str: string, x: number, size = 10, useFont = font, color = rgb(0, 0, 0)) {
    page.drawText(str, { x, y, size, font: useFont, color });
  }
  function line(dy = 16) {
    y -= dy;
  }

  text(spec.title, left, 16, bold);
  line(24);
  text(`Invoice No: ${spec.invoiceNo}`, left);
  text(`Date: ${spec.date}`, 320);
  line();
  if (spec.poNumber) {
    text(`PO Number: ${spec.poNumber}`, left);
    line();
  }
  text(`Place of Supply: ${spec.placeOfSupply}`, left);
  line(24);

  text("Supplier:", left, 11, bold);
  line();
  text(spec.supplier.name, left);
  line();
  text(`GSTIN: ${spec.supplier.gstin}`, left);
  line();
  text(spec.supplier.address, left, 9);
  line(20);

  text("Buyer:", left, 11, bold);
  line();
  text(spec.buyer.name, left);
  line();
  text(`GSTIN: ${spec.buyer.gstin}`, left);
  line();
  text(spec.buyer.address, left, 9);
  line(24);

  const headers = spec.noTax
    ? ["#", "Description", "HSN", "Qty", "Unit", "Rate", "Amount"]
    : ["#", "Description", "HSN", "Qty", "Rate", "Taxable", "Tax", "Total"];
  const colX = [left, left + 25, left + 170, left + 220, left + 260, left + 310, left + 380, left + 460];

  headers.forEach((h, i) => text(h, colX[i], 9, bold));
  line(14);
  page.drawLine({
    start: { x: left, y: y + 4 },
    end: { x: 555, y: y + 4 },
    thickness: 0.5,
  });
  line(4);

  for (const item of spec.items) {
    text(String(item.sn), colX[0], 9);
    text(item.desc, colX[1], 9);
    text(item.hsn, colX[2], 9);
    text(`${item.qty} ${item.unit}`, colX[3], 9);
    if (spec.noTax) {
      text(item.rate.toFixed(2), colX[4], 9);
      text(item.taxable.toFixed(2), colX[5], 9);
    } else {
      text(item.rate.toFixed(2), colX[4], 9);
      text(item.taxable.toFixed(2), colX[5], 9);
      const taxStr = item.igstRate
        ? `IGST ${item.igstRate}%: ${item.igstAmt?.toFixed(2)}`
        : `C+S ${item.cgstRate}%+${item.sgstRate}%: ${((item.cgstAmt ?? 0) + (item.sgstAmt ?? 0)).toFixed(2)}`;
      text(taxStr, colX[6], 8);
      text(item.total.toFixed(2), colX[7], 9);
    }
    line(16);
  }

  line(10);
  page.drawLine({ start: { x: left, y: y + 4 }, end: { x: 555, y: y + 4 }, thickness: 0.5 });
  line(20);

  text(`Grand Total: Rs. ${spec.grandTotal.toFixed(2)}`, 380, 12, bold);
  line(20);

  if (spec.messy) {
    text("(scan quality: faded toner, slight skew — for low-confidence testing)", left, 8, font, rgb(0.5, 0.5, 0.5));
  }

  const bytes = await doc.save();
  await fs.mkdir(SAMPLES_DIR, { recursive: true });
  await fs.writeFile(path.join(SAMPLES_DIR, spec.fileName), bytes);
  console.log(`Wrote samples/${spec.fileName}`);
}

async function main() {
  // 1. Clean intra-state invoice (CGST + SGST), multiple HSN line items.
  await renderInvoice({
    fileName: "01-intra-state-cgst-sgst.pdf",
    title: "TAX INVOICE",
    invoiceNo: "INV-2026-1001",
    date: "01/06/2026",
    supplier: {
      name: "Shree Hardware Traders",
      gstin: "27AAFCS1234M1Z5",
      address: "12 MG Road, Pune, Maharashtra 411001",
    },
    buyer: {
      name: "Bright Future Industries Pvt Ltd",
      gstin: "27AAGCB5678N1Z2",
      address: "45 FC Road, Pune, Maharashtra 411004",
    },
    placeOfSupply: "Maharashtra (27)",
    items: [
      {
        sn: 1, desc: "Steel Hex Bolts M8", hsn: "7318", qty: 500, unit: "NOS",
        rate: 6, taxable: 3000, cgstRate: 9, cgstAmt: 270, sgstRate: 9, sgstAmt: 270, total: 3540,
      },
      {
        sn: 2, desc: "Galvanised Wire Mesh", hsn: "7314", qty: 20, unit: "KG",
        rate: 150, taxable: 3000, cgstRate: 9, cgstAmt: 270, sgstRate: 9, sgstAmt: 270, total: 3540,
      },
      {
        sn: 3, desc: "Cable Ties 200mm", hsn: "3926", qty: 1000, unit: "PCS",
        rate: 2, taxable: 2000, cgstRate: 9, cgstAmt: 180, sgstRate: 9, sgstAmt: 180, total: 2360,
      },
    ],
    grandTotal: 9440,
  });

  // 2. Inter-state invoice (IGST).
  await renderInvoice({
    fileName: "02-inter-state-igst.pdf",
    title: "TAX INVOICE",
    invoiceNo: "INV-2026-2007",
    date: "03/06/2026",
    supplier: {
      name: "Coastal Electronics Supply Co.",
      gstin: "29AACCE4321K1Z8",
      address: "7 Industrial Estate, Bengaluru, Karnataka 560058",
    },
    buyer: {
      name: "Northgate Retail Pvt Ltd",
      gstin: "07AADCN9876P1Z3",
      address: "221 Connaught Place, New Delhi, Delhi 110001",
    },
    placeOfSupply: "Delhi (07)",
    items: [
      {
        sn: 1, desc: "LED Driver Module 24V", hsn: "8504", qty: 200, unit: "NOS",
        rate: 220, taxable: 44000, igstRate: 18, igstAmt: 7920, total: 51920,
      },
      {
        sn: 2, desc: "Aluminium Heat Sink", hsn: "7616", qty: 200, unit: "NOS",
        rate: 80, taxable: 16000, igstRate: 18, igstAmt: 2880, total: 18880,
      },
    ],
    grandTotal: 70800,
  });

  // 3. Services invoice using SAC codes.
  await renderInvoice({
    fileName: "03-services-sac.pdf",
    title: "TAX INVOICE (SERVICES)",
    invoiceNo: "INV-2026-3015",
    date: "05/06/2026",
    supplier: {
      name: "Apex Consulting & Audit LLP",
      gstin: "27AAFAP1122Q1ZR",
      address: "3rd Floor, Nariman Point, Mumbai, Maharashtra 400021",
    },
    buyer: {
      name: "Bright Future Industries Pvt Ltd",
      gstin: "27AAGCB5678N1Z2",
      address: "45 FC Road, Pune, Maharashtra 411004",
    },
    placeOfSupply: "Maharashtra (27)",
    items: [
      {
        sn: 1, desc: "Statutory Audit Fees - FY25-26", hsn: "998221", qty: 1, unit: "NOS",
        rate: 50000, taxable: 50000, cgstRate: 9, cgstAmt: 4500, sgstRate: 9, sgstAmt: 4500, total: 59000,
      },
      {
        sn: 2, desc: "GST Advisory Retainer - June", hsn: "998231", qty: 1, unit: "NOS",
        rate: 15000, taxable: 15000, cgstRate: 9, cgstAmt: 1350, sgstRate: 9, sgstAmt: 1350, total: 17700,
      },
    ],
    grandTotal: 76700,
  });

  // 4. Messy/scanned-looking invoice for low-confidence handling.
  await renderInvoice({
    fileName: "04-messy-scan-low-confidence.pdf",
    title: "TAX  INVOICE",
    invoiceNo: "INV/26/0042",
    date: "10/06/2026",
    supplier: {
      name: "Vijay Traders & Co",
      gstin: "24AAXPV5544R1Z9",
      address: "Plot 9, GIDC Vatva, Ahmedabad, Gujarat 382445",
    },
    buyer: {
      name: "Coastal Electronics Supply Co.",
      gstin: "29AACCE4321K1Z8",
      address: "7 Industrial Estate, Bengaluru, Karnataka 560058",
    },
    placeOfSupply: "Karnataka (29)",
    items: [
      {
        sn: 1, desc: "PVC Insulation Tape (assorted)", hsn: "3919", qty: 300, unit: "PCS",
        rate: 18, taxable: 5400, igstRate: 18, igstAmt: 972, total: 6372,
      },
      {
        sn: 2, desc: "Copper Wire Spool 1.5sqmm", hsn: "8544", qty: 40, unit: "NOS",
        rate: 450, taxable: 18000, igstRate: 18, igstAmt: 3240, total: 21240,
      },
    ],
    grandTotal: 27612,
    messy: true,
  });

  // 5. Purchase order (no tax amounts, just items + PO number).
  await renderInvoice({
    fileName: "05-purchase-order.pdf",
    title: "PURCHASE ORDER",
    invoiceNo: "—",
    date: "12/06/2026",
    poNumber: "PO-2026-0099",
    supplier: {
      name: "Shree Hardware Traders",
      gstin: "27AAFCS1234M1Z5",
      address: "12 MG Road, Pune, Maharashtra 411001",
    },
    buyer: {
      name: "Bright Future Industries Pvt Ltd",
      gstin: "27AAGCB5678N1Z2",
      address: "45 FC Road, Pune, Maharashtra 411004",
    },
    placeOfSupply: "Maharashtra (27)",
    items: [
      { sn: 1, desc: "Steel Hex Bolts M8", hsn: "7318", qty: 1000, unit: "NOS", rate: 6, taxable: 6000, total: 6000 },
      { sn: 2, desc: "Galvanised Wire Mesh", hsn: "7314", qty: 50, unit: "KG", rate: 150, taxable: 7500, total: 7500 },
    ],
    grandTotal: 13500,
    noTax: true,
  });
}

main();
