import type { Extraction } from "./extraction-schema";

export interface ValidationFlag {
  field: string;
  severity: "error" | "warning";
  message: string;
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const HSN_RE = /^[0-9]{4}$|^[0-9]{6}$|^[0-9]{8}$/;

function near(a: number | null | undefined, b: number | null | undefined, tolerance = 1): boolean {
  if (a == null || b == null) return true; // can't compare missing values
  return Math.abs(a - b) <= Math.max(tolerance, Math.abs(b) * 0.005);
}

function sum(values: Array<number | null | undefined>): number {
  return values.reduce((acc: number, v) => acc + (v ?? 0), 0);
}

function getFieldValue(extraction: Extraction, path: string): unknown {
  const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current: unknown = extraction;
  for (const segment of segments) {
    if (current == null) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function runValidation(extraction: Extraction): ValidationFlag[] {
  const flags: ValidationFlag[] = [];
  const { supplier, buyer, totals, line_items, field_confidence } = extraction;

  // 1. GSTIN format
  if (supplier.gstin && !GSTIN_RE.test(supplier.gstin)) {
    flags.push({ field: "supplier.gstin", severity: "warning", message: "Supplier GSTIN does not match expected format." });
  }
  if (buyer.gstin && !GSTIN_RE.test(buyer.gstin)) {
    flags.push({ field: "buyer.gstin", severity: "warning", message: "Buyer GSTIN does not match expected format." });
  }

  // 2. State-code consistency
  if (supplier.gstin && supplier.state_code && supplier.gstin.slice(0, 2) !== supplier.state_code) {
    flags.push({ field: "supplier.state_code", severity: "warning", message: "Supplier state code doesn't match GSTIN prefix." });
  }
  if (buyer.gstin && buyer.state_code && buyer.gstin.slice(0, 2) !== buyer.state_code) {
    flags.push({ field: "buyer.state_code", severity: "warning", message: "Buyer state code doesn't match GSTIN prefix." });
  }

  // 3. Intra vs inter-state tax type
  const supplierState = supplier.gstin?.slice(0, 2) ?? supplier.state_code;
  const buyerState = buyer.gstin?.slice(0, 2) ?? buyer.state_code;
  if (supplierState && buyerState) {
    const hasIgst = line_items.some((li) => li.igst_amount);
    const hasCgstSgst = line_items.some((li) => li.cgst_amount || li.sgst_amount);
    if (supplierState === buyerState && hasIgst) {
      flags.push({ field: "totals.total_igst", severity: "warning", message: "Same-state transaction but IGST is charged; expected CGST+SGST." });
    }
    if (supplierState !== buyerState && hasCgstSgst) {
      flags.push({ field: "totals.total_cgst", severity: "warning", message: "Inter-state transaction but CGST/SGST is charged; expected IGST." });
    }
  }

  // 4. Per-line tax math
  line_items.forEach((li, idx) => {
    const expectedCgst = li.taxable_value != null && li.cgst_rate != null ? (li.taxable_value * li.cgst_rate) / 100 : null;
    const expectedSgst = li.taxable_value != null && li.sgst_rate != null ? (li.taxable_value * li.sgst_rate) / 100 : null;
    const expectedIgst = li.taxable_value != null && li.igst_rate != null ? (li.taxable_value * li.igst_rate) / 100 : null;

    if (expectedCgst != null && !near(expectedCgst, li.cgst_amount)) {
      flags.push({ field: `line_items[${idx}].cgst_amount`, severity: "error", message: "CGST amount doesn't match taxable value × rate." });
    }
    if (expectedSgst != null && !near(expectedSgst, li.sgst_amount)) {
      flags.push({ field: `line_items[${idx}].sgst_amount`, severity: "error", message: "SGST amount doesn't match taxable value × rate." });
    }
    if (expectedIgst != null && !near(expectedIgst, li.igst_amount)) {
      flags.push({ field: `line_items[${idx}].igst_amount`, severity: "error", message: "IGST amount doesn't match taxable value × rate." });
    }

    const lineSum = sum([li.taxable_value, li.cgst_amount, li.sgst_amount, li.igst_amount, li.cess_amount]);
    if (li.line_total != null && li.taxable_value != null && !near(lineSum, li.line_total)) {
      flags.push({ field: `line_items[${idx}].line_total`, severity: "error", message: "Line total doesn't match taxable value + taxes." });
    }

    // 6. HSN/SAC shape
    if (li.hsn_sac && !HSN_RE.test(li.hsn_sac)) {
      flags.push({ field: `line_items[${idx}].hsn_sac`, severity: "warning", message: "HSN/SAC code should be 4, 6, or 8 digits." });
    }
  });

  // 5. Header totals roll-up
  if (line_items.length > 0) {
    const sumTaxable = sum(line_items.map((li) => li.taxable_value));
    const sumCgst = sum(line_items.map((li) => li.cgst_amount));
    const sumSgst = sum(line_items.map((li) => li.sgst_amount));
    const sumIgst = sum(line_items.map((li) => li.igst_amount));
    const sumCess = sum(line_items.map((li) => li.cess_amount));

    if (totals.total_taxable_value != null && !near(sumTaxable, totals.total_taxable_value)) {
      flags.push({ field: "totals.total_taxable_value", severity: "warning", message: "Sum of line taxable values doesn't match header total." });
    }
    if (totals.total_cgst != null && !near(sumCgst, totals.total_cgst)) {
      flags.push({ field: "totals.total_cgst", severity: "warning", message: "Sum of line CGST doesn't match header total." });
    }
    if (totals.total_sgst != null && !near(sumSgst, totals.total_sgst)) {
      flags.push({ field: "totals.total_sgst", severity: "warning", message: "Sum of line SGST doesn't match header total." });
    }
    if (totals.total_igst != null && !near(sumIgst, totals.total_igst)) {
      flags.push({ field: "totals.total_igst", severity: "warning", message: "Sum of line IGST doesn't match header total." });
    }
    if (totals.total_cess != null && !near(sumCess, totals.total_cess)) {
      flags.push({ field: "totals.total_cess", severity: "warning", message: "Sum of line cess doesn't match header total." });
    }
  }

  const grandTotalSum = sum([
    totals.total_taxable_value,
    totals.total_cgst,
    totals.total_sgst,
    totals.total_igst,
    totals.total_cess,
    totals.round_off,
  ]);
  if (totals.grand_total != null && totals.total_taxable_value != null && !near(grandTotalSum, totals.grand_total)) {
    flags.push({ field: "totals.grand_total", severity: "error", message: "Grand total doesn't reconcile with header tax breakdown." });
  }

  // 7. Date plausibility
  if (extraction.invoice_date) {
    const d = new Date(extraction.invoice_date);
    if (Number.isNaN(d.getTime())) {
      flags.push({ field: "invoice_date", severity: "warning", message: "Invoice date is not a valid date." });
    } else if (d.getTime() > Date.now()) {
      flags.push({ field: "invoice_date", severity: "warning", message: "Invoice date is in the future." });
    }
  }

  // 8. Required-field presence (purchase orders don't carry an invoice number/date or tax totals)
  const isPurchaseOrder = extraction.document_type === "purchase_order";
  if (!supplier.name) flags.push({ field: "supplier.name", severity: "error", message: "Supplier name is missing." });
  if (!isPurchaseOrder) {
    if (!extraction.invoice_number) flags.push({ field: "invoice_number", severity: "error", message: "Invoice number is missing." });
    if (!extraction.invoice_date) flags.push({ field: "invoice_date", severity: "error", message: "Invoice date is missing." });
    if (totals.grand_total == null) flags.push({ field: "totals.grand_total", severity: "error", message: "Grand total is missing." });
  } else if (!extraction.po_number) {
    flags.push({ field: "po_number", severity: "error", message: "PO number is missing." });
  }
  if (line_items.length === 0) flags.push({ field: "line_items", severity: "error", message: "No line items were extracted." });

  // 9. Low-confidence fields (skip fields that are legitimately absent — a null value
  // with confidence 0 means "not present", not "uncertain".)
  for (const [field, confidence] of Object.entries(field_confidence)) {
    if (confidence < 0.75 && getFieldValue(extraction, field) != null) {
      flags.push({ field, severity: "warning", message: `Low confidence (${Math.round(confidence * 100)}%) — please verify.` });
    }
  }

  return flags;
}
