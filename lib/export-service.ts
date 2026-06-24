import ExcelJS from "exceljs";
import type { Extraction } from "@/lib/extraction-schema";

const MONEY_FMT = "#,##0.00;[Red]-#,##0.00";

export interface ExportSourceInfo {
  fileName: string;
  approvedAt: Date | null;
}

function headerRow(parsed: Extraction) {
  return {
    "Supplier Name": parsed.supplier.name ?? "",
    "Supplier GSTIN": parsed.supplier.gstin ?? "",
    "Buyer Name": parsed.buyer.name ?? "",
    "Buyer GSTIN": parsed.buyer.gstin ?? "",
    "Invoice No": parsed.invoice_number ?? "",
    "Invoice Date": parsed.invoice_date ?? "",
    "Place of Supply": parsed.place_of_supply ?? "",
    "Reverse Charge": parsed.reverse_charge === null ? "" : parsed.reverse_charge ? "Yes" : "No",
    "Document Type": parsed.document_type,
    "Total Taxable": parsed.totals.total_taxable_value,
    "Total CGST": parsed.totals.total_cgst,
    "Total SGST": parsed.totals.total_sgst,
    "Total IGST": parsed.totals.total_igst,
    "Total Cess": parsed.totals.total_cess,
    "Round Off": parsed.totals.round_off,
    "Grand Total": parsed.totals.grand_total,
  };
}

const HEADER_MONEY_COLS = new Set([
  "Total Taxable",
  "Total CGST",
  "Total SGST",
  "Total IGST",
  "Total Cess",
  "Round Off",
  "Grand Total",
]);

const LINE_ITEM_COLUMNS: { header: string; key: keyof Extraction["line_items"][number]; money?: boolean }[] = [
  { header: "S.No", key: "serial_no" },
  { header: "Description", key: "description" },
  { header: "HSN/SAC", key: "hsn_sac" },
  { header: "Qty", key: "quantity" },
  { header: "Unit", key: "unit" },
  { header: "Rate", key: "unit_price", money: true },
  { header: "Discount", key: "discount", money: true },
  { header: "Taxable Value", key: "taxable_value", money: true },
  { header: "CGST Rate", key: "cgst_rate" },
  { header: "CGST Amt", key: "cgst_amount", money: true },
  { header: "SGST Rate", key: "sgst_rate" },
  { header: "SGST Amt", key: "sgst_amount", money: true },
  { header: "IGST Rate", key: "igst_rate" },
  { header: "IGST Amt", key: "igst_amount", money: true },
  { header: "Cess Rate", key: "cess_rate" },
  { header: "Cess Amt", key: "cess_amount", money: true },
  { header: "Line Total", key: "line_total", money: true },
];

export class ExportService {
  async buildXlsx(parsed: Extraction, source: ExportSourceInfo): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "GST Extract App";
    workbook.created = new Date();

    const headerSheet = workbook.addWorksheet("Invoice Header");
    const header = headerRow(parsed);
    const headerKeys = Object.keys(header);
    headerSheet.columns = headerKeys.map((key) => ({
      header: key,
      key,
      width: Math.max(14, key.length + 2),
    }));
    headerSheet.getRow(1).font = { bold: true };
    const headerDataRow = headerSheet.addRow(header);
    headerKeys.forEach((key, idx) => {
      const cell = headerDataRow.getCell(idx + 1);
      if (HEADER_MONEY_COLS.has(key)) {
        cell.numFmt = MONEY_FMT;
        cell.alignment = { horizontal: "right" };
      }
    });

    const lineItemsSheet = workbook.addWorksheet("Line Items");
    lineItemsSheet.columns = LINE_ITEM_COLUMNS.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.key === "description" ? 32 : 14,
    }));
    lineItemsSheet.getRow(1).font = { bold: true };
    for (const item of parsed.line_items) {
      const row = lineItemsSheet.addRow(
        Object.fromEntries(LINE_ITEM_COLUMNS.map((c) => [c.key, item[c.key] ?? null]))
      );
      LINE_ITEM_COLUMNS.forEach((c, idx) => {
        if (c.money) {
          const cell = row.getCell(idx + 1);
          cell.numFmt = MONEY_FMT;
          cell.alignment = { horizontal: "right" };
        }
      });
    }

    for (const sheet of [headerSheet, lineItemsSheet]) {
      sheet.addRow([]);
      const footerRow = sheet.addRow([
        `Source: ${source.fileName} · Approved: ${source.approvedAt ? source.approvedAt.toISOString() : "—"}`,
      ]);
      footerRow.font = { italic: true, color: { argb: "FF888888" } };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  buildCsv(parsed: Extraction, source: ExportSourceInfo): Buffer {
    const lines: string[] = [];
    const header = headerRow(parsed);
    const headerKeys = Object.keys(header);

    lines.push("Invoice Header");
    lines.push(headerKeys.map(csvEscape).join(","));
    lines.push(headerKeys.map((k) => csvEscape((header as Record<string, unknown>)[k])).join(","));
    lines.push("");

    lines.push("Line Items");
    lines.push(LINE_ITEM_COLUMNS.map((c) => csvEscape(c.header)).join(","));
    for (const item of parsed.line_items) {
      lines.push(LINE_ITEM_COLUMNS.map((c) => csvEscape(item[c.key])).join(","));
    }
    lines.push("");
    lines.push(csvEscape(`Source: ${source.fileName} · Approved: ${source.approvedAt ? source.approvedAt.toISOString() : "—"}`));

    return Buffer.from(lines.join("\n"), "utf-8");
  }
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
