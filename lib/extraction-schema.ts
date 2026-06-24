import { z } from "zod";

const nullableString = z.string().nullable().default(null);
const nullableNumber = z.number().nullable().default(null);

const party = z.object({
  name: nullableString,
  gstin: nullableString,
  address: nullableString,
  state_code: nullableString,
});

const lineItem = z.object({
  serial_no: nullableNumber,
  description: nullableString,
  hsn_sac: nullableString,
  quantity: nullableNumber,
  unit: nullableString,
  unit_price: nullableNumber,
  discount: nullableNumber,
  taxable_value: nullableNumber,
  cgst_rate: nullableNumber,
  cgst_amount: nullableNumber,
  sgst_rate: nullableNumber,
  sgst_amount: nullableNumber,
  igst_rate: nullableNumber,
  igst_amount: nullableNumber,
  cess_rate: nullableNumber,
  cess_amount: nullableNumber,
  line_total: nullableNumber,
});

const totals = z.object({
  total_taxable_value: nullableNumber,
  total_cgst: nullableNumber,
  total_sgst: nullableNumber,
  total_igst: nullableNumber,
  total_cess: nullableNumber,
  round_off: nullableNumber,
  grand_total: nullableNumber,
  amount_in_words: nullableString,
});

export const extractionSchema = z.object({
  document_type: z.enum([
    "tax_invoice",
    "bill_of_supply",
    "credit_note",
    "debit_note",
    "purchase_order",
    "unknown",
  ]),
  supplier: party,
  buyer: party,
  invoice_number: nullableString,
  invoice_date: nullableString,
  po_number: nullableString,
  place_of_supply: nullableString,
  reverse_charge: z.boolean().nullable().default(null),
  currency: z.string().default("INR"),
  line_items: z.array(lineItem).default([]),
  totals: totals,
  field_confidence: z.record(z.string(), z.number()).default({}),
  overall_confidence: z.number(),
  extraction_notes: nullableString,
});

export type Extraction = z.infer<typeof extractionSchema>;
export type LineItem = z.infer<typeof lineItem>;
