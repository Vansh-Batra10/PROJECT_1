import type { Extraction } from "@/lib/extraction-schema";

function blank(): Extraction {
  return {
    document_type: "tax_invoice",
    supplier: { name: null, gstin: null, address: null, state_code: null },
    buyer: { name: null, gstin: null, address: null, state_code: null },
    invoice_number: null,
    invoice_date: null,
    po_number: null,
    place_of_supply: null,
    reverse_charge: null,
    currency: "INR",
    line_items: [],
    totals: {
      total_taxable_value: null,
      total_cgst: null,
      total_sgst: null,
      total_igst: null,
      total_cess: null,
      round_off: null,
      grand_total: null,
      amount_in_words: null,
    },
    field_confidence: {},
    overall_confidence: 1,
    extraction_notes: null,
  };
}

// Mirrors samples/01-intra-state-cgst-sgst.pdf — ground truth from scripts/generate-samples.ts.
export function sample01IntraState(): Extraction {
  return {
    ...blank(),
    document_type: "tax_invoice",
    supplier: {
      name: "Shree Hardware Traders",
      gstin: "27AAFCS1234M1Z5",
      address: "12 MG Road, Pune, Maharashtra 411001",
      state_code: "27",
    },
    buyer: {
      name: "Bright Future Industries Pvt Ltd",
      gstin: "27AAGCB5678N1Z2",
      address: "45 FC Road, Pune, Maharashtra 411004",
      state_code: "27",
    },
    invoice_number: "INV-2026-1001",
    invoice_date: "2026-06-01",
    place_of_supply: "Maharashtra (27)",
    line_items: [
      { serial_no: 1, description: "Steel Hex Bolts M8", hsn_sac: "7318", quantity: 500, unit: "NOS", unit_price: 6, discount: null, taxable_value: 3000, cgst_rate: 9, cgst_amount: 270, sgst_rate: 9, sgst_amount: 270, igst_rate: null, igst_amount: null, cess_rate: null, cess_amount: null, line_total: 3540 },
      { serial_no: 2, description: "Galvanised Wire Mesh", hsn_sac: "7314", quantity: 20, unit: "KG", unit_price: 150, discount: null, taxable_value: 3000, cgst_rate: 9, cgst_amount: 270, sgst_rate: 9, sgst_amount: 270, igst_rate: null, igst_amount: null, cess_rate: null, cess_amount: null, line_total: 3540 },
      { serial_no: 3, description: "Cable Ties 200mm", hsn_sac: "3926", quantity: 1000, unit: "PCS", unit_price: 2, discount: null, taxable_value: 2000, cgst_rate: 9, cgst_amount: 180, sgst_rate: 9, sgst_amount: 180, igst_rate: null, igst_amount: null, cess_rate: null, cess_amount: null, line_total: 2360 },
    ],
    totals: {
      total_taxable_value: 8000,
      total_cgst: 720,
      total_sgst: 720,
      total_igst: null,
      total_cess: null,
      round_off: null,
      grand_total: 9440,
      amount_in_words: null,
    },
    overall_confidence: 0.97,
  };
}

// Mirrors samples/02-inter-state-igst.pdf
export function sample02InterState(): Extraction {
  return {
    ...blank(),
    document_type: "tax_invoice",
    supplier: {
      name: "Coastal Electronics Supply Co.",
      gstin: "29AACCE4321K1Z8",
      address: "7 Industrial Estate, Bengaluru, Karnataka 560058",
      state_code: "29",
    },
    buyer: {
      name: "Northgate Retail Pvt Ltd",
      gstin: "07AADCN9876P1Z3",
      address: "221 Connaught Place, New Delhi, Delhi 110001",
      state_code: "07",
    },
    invoice_number: "INV-2026-2007",
    invoice_date: "2026-06-03",
    place_of_supply: "Delhi (07)",
    line_items: [
      { serial_no: 1, description: "LED Driver Module 24V", hsn_sac: "8504", quantity: 200, unit: "NOS", unit_price: 220, discount: null, taxable_value: 44000, cgst_rate: null, cgst_amount: null, sgst_rate: null, sgst_amount: null, igst_rate: 18, igst_amount: 7920, cess_rate: null, cess_amount: null, line_total: 51920 },
      { serial_no: 2, description: "Aluminium Heat Sink", hsn_sac: "7616", quantity: 200, unit: "NOS", unit_price: 80, discount: null, taxable_value: 16000, cgst_rate: null, cgst_amount: null, sgst_rate: null, sgst_amount: null, igst_rate: 18, igst_amount: 2880, cess_rate: null, cess_amount: null, line_total: 18880 },
    ],
    totals: {
      total_taxable_value: 60000,
      total_cgst: null,
      total_sgst: null,
      total_igst: 10800,
      total_cess: null,
      round_off: null,
      grand_total: 70800,
      amount_in_words: null,
    },
    overall_confidence: 1,
  };
}

// Mirrors samples/05-purchase-order.pdf — no tax amounts at all.
export function sample05PurchaseOrder(): Extraction {
  return {
    ...blank(),
    document_type: "purchase_order",
    supplier: {
      name: "Shree Hardware Traders",
      gstin: "27AAFCS1234M1Z5",
      address: "12 MG Road, Pune, Maharashtra 411001",
      state_code: "27",
    },
    buyer: {
      name: "Bright Future Industries Pvt Ltd",
      gstin: "27AAGCB5678N1Z2",
      address: "45 FC Road, Pune, Maharashtra 411004",
      state_code: "27",
    },
    invoice_number: null,
    po_number: "PO-2026-0099",
    place_of_supply: "Maharashtra (27)",
    line_items: [
      { serial_no: 1, description: "Steel Hex Bolts M8", hsn_sac: "7318", quantity: 1000, unit: "NOS", unit_price: 6, discount: null, taxable_value: 6000, cgst_rate: null, cgst_amount: null, sgst_rate: null, sgst_amount: null, igst_rate: null, igst_amount: null, cess_rate: null, cess_amount: null, line_total: 6000 },
      { serial_no: 2, description: "Galvanised Wire Mesh", hsn_sac: "7314", quantity: 50, unit: "KG", unit_price: 150, discount: null, taxable_value: 7500, cgst_rate: null, cgst_amount: null, sgst_rate: null, sgst_amount: null, igst_rate: null, igst_amount: null, cess_rate: null, cess_amount: null, line_total: 7500 },
    ],
    totals: {
      total_taxable_value: 13500,
      total_cgst: null,
      total_sgst: null,
      total_igst: null,
      total_cess: null,
      round_off: null,
      grand_total: 13500,
      amount_in_words: null,
    },
    overall_confidence: 1,
  };
}
