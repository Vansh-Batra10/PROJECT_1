import { describe, expect, it } from "vitest";
import { runValidation } from "@/lib/validation-service";
import {
  sample01IntraState,
  sample02InterState,
  sample05PurchaseOrder,
} from "@/lib/__fixtures__/sample-extractions";

function fieldsOf(flags: { field: string }[]) {
  return flags.map((f) => f.field);
}

describe("sample invoices — clean pass", () => {
  it("01 intra-state CGST+SGST invoice has zero flags", () => {
    expect(runValidation(sample01IntraState())).toEqual([]);
  });

  it("02 inter-state IGST invoice has zero flags", () => {
    expect(runValidation(sample02InterState())).toEqual([]);
  });

  it("05 purchase order (no tax fields) has zero flags", () => {
    expect(runValidation(sample05PurchaseOrder())).toEqual([]);
  });
});

describe("GSTIN format", () => {
  it("flags a malformed supplier GSTIN", () => {
    const extraction = sample01IntraState();
    extraction.supplier.gstin = "NOT-A-GSTIN";
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("supplier.gstin");
    expect(flags.find((f) => f.field === "supplier.gstin")?.severity).toBe("warning");
  });

  it("flags a malformed buyer GSTIN", () => {
    const extraction = sample01IntraState();
    extraction.buyer.gstin = "27AAGCB5678N1Z"; // one char short
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("buyer.gstin");
  });

  it("accepts a well-formed GSTIN with alphanumeric checksum char", () => {
    const extraction = sample01IntraState();
    extraction.supplier.gstin = "27AAFCS1234M1ZA"; // checksum can be alphanumeric
    expect(fieldsOf(runValidation(extraction))).not.toContain("supplier.gstin");
  });
});

describe("state-code consistency", () => {
  it("flags supplier state_code that disagrees with GSTIN prefix", () => {
    const extraction = sample01IntraState();
    extraction.supplier.state_code = "29"; // GSTIN says 27
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("supplier.state_code");
  });
});

describe("intra vs inter-state tax-type check", () => {
  it("flags IGST charged on a same-state transaction", () => {
    const extraction = sample01IntraState();
    extraction.line_items[0].igst_rate = 18;
    extraction.line_items[0].igst_amount = 540;
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("totals.total_igst");
  });

  it("flags CGST/SGST charged on an inter-state transaction", () => {
    const extraction = sample02InterState();
    extraction.line_items[0].cgst_rate = 9;
    extraction.line_items[0].cgst_amount = 3960;
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("totals.total_cgst");
  });
});

describe("per-line tax math (rate-agnostic — only checks arithmetic)", () => {
  it("flags CGST amount that doesn't match taxable_value × rate, at any rate", () => {
    const extraction = sample01IntraState();
    extraction.line_items[0].cgst_rate = 14; // an unusual, non-standard slab — still must reconcile
    // cgst_amount left at 270, but 3000 * 14% = 420, so this should flag
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("line_items[0].cgst_amount");
  });

  it("accepts correct math at a non-standard rate (proves rates aren't hardcoded)", () => {
    const extraction = sample01IntraState();
    extraction.line_items[0].cgst_rate = 14;
    extraction.line_items[0].cgst_amount = 420; // 3000 * 14%
    extraction.line_items[0].sgst_rate = 14;
    extraction.line_items[0].sgst_amount = 420;
    extraction.line_items[0].line_total = 3000 + 420 + 420;
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).not.toContain("line_items[0].cgst_amount");
    expect(fieldsOf(flags)).not.toContain("line_items[0].sgst_amount");
  });

  it("flags IGST amount that doesn't match taxable_value × rate", () => {
    const extraction = sample02InterState();
    extraction.line_items[0].igst_amount = 1000; // should be 7920
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("line_items[0].igst_amount");
  });

  it("flags a line_total that doesn't equal taxable + taxes", () => {
    const extraction = sample01IntraState();
    extraction.line_items[0].line_total = 9999;
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("line_items[0].line_total");
  });

  it("tolerates rounding within ±₹1", () => {
    const extraction = sample01IntraState();
    extraction.line_items[0].cgst_amount = 270.6; // within ±1 of 270
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).not.toContain("line_items[0].cgst_amount");
  });
});

describe("header totals roll-up", () => {
  it("flags header total_taxable_value that doesn't match sum of lines", () => {
    const extraction = sample01IntraState();
    extraction.totals.total_taxable_value = 5000; // lines sum to 8000
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("totals.total_taxable_value");
  });

  it("flags a grand_total that doesn't reconcile with the tax breakdown", () => {
    const extraction = sample01IntraState();
    extraction.totals.grand_total = 12000;
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("totals.grand_total");
  });
});

describe("HSN/SAC shape", () => {
  it("flags an HSN/SAC code that isn't 4, 6, or 8 digits", () => {
    const extraction = sample01IntraState();
    extraction.line_items[0].hsn_sac = "731"; // 3 digits
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("line_items[0].hsn_sac");
  });

  it("accepts a 6-digit SAC code", () => {
    const extraction = sample01IntraState();
    extraction.line_items[0].hsn_sac = "998221";
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).not.toContain("line_items[0].hsn_sac");
  });
});

describe("date plausibility", () => {
  it("flags an unparseable invoice_date", () => {
    const extraction = sample01IntraState();
    extraction.invoice_date = "not-a-date";
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("invoice_date");
  });

  it("flags a future-dated invoice", () => {
    const extraction = sample01IntraState();
    extraction.invoice_date = "2099-01-01";
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("invoice_date");
  });
});

describe("required-field presence", () => {
  it("flags a missing supplier name", () => {
    const extraction = sample01IntraState();
    extraction.supplier.name = null;
    const flags = runValidation(extraction);
    expect(flags.find((f) => f.field === "supplier.name")?.severity).toBe("error");
  });

  it("flags a missing invoice_number on a tax invoice", () => {
    const extraction = sample01IntraState();
    extraction.invoice_number = null;
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("invoice_number");
  });

  it("does NOT require invoice_number on a purchase order", () => {
    const extraction = sample05PurchaseOrder();
    expect(extraction.invoice_number).toBeNull();
    expect(fieldsOf(runValidation(extraction))).not.toContain("invoice_number");
  });

  it("requires po_number on a purchase order instead", () => {
    const extraction = sample05PurchaseOrder();
    extraction.po_number = null;
    const flags = runValidation(extraction);
    expect(flags.find((f) => f.field === "po_number")?.severity).toBe("error");
  });

  it("flags zero line items", () => {
    const extraction = sample01IntraState();
    extraction.line_items = [];
    const flags = runValidation(extraction);
    expect(fieldsOf(flags)).toContain("line_items");
  });
});

describe("low-confidence flagging", () => {
  it("flags a populated field with confidence below 0.75", () => {
    const extraction = sample01IntraState();
    extraction.field_confidence = { "supplier.name": 0.5 };
    const flags = runValidation(extraction);
    expect(flags.find((f) => f.field === "supplier.name")?.message).toContain("Low confidence");
  });

  it("does not flag a field at exactly the 0.75 threshold", () => {
    const extraction = sample01IntraState();
    extraction.field_confidence = { "supplier.name": 0.75 };
    expect(fieldsOf(runValidation(extraction))).not.toContain("supplier.name");
  });

  it("ignores confidence 0 on a field that is legitimately null", () => {
    const extraction = sample01IntraState();
    extraction.field_confidence = { po_number: 0 };
    expect(fieldsOf(runValidation(extraction))).not.toContain("po_number");
  });
});
