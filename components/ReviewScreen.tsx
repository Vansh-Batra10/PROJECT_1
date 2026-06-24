"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { runValidation, type ValidationFlag } from "@/lib/validation-service";
import type { Extraction, LineItem } from "@/lib/extraction-schema";

import ExportButtons from "./ExportButtons";

const DocumentPreviewPane = dynamic(() => import("./DocumentPreviewPane"), { ssr: false });

interface ReviewScreenProps {
  documentId: string;
  fileName: string;
  mimeType: string;
  status: string;
  initialExtraction: Extraction;
}

function emptyLineItem(): LineItem {
  return {
    serial_no: null,
    description: null,
    hsn_sac: null,
    quantity: null,
    unit: null,
    unit_price: null,
    discount: null,
    taxable_value: null,
    cgst_rate: null,
    cgst_amount: null,
    sgst_rate: null,
    sgst_amount: null,
    igst_rate: null,
    igst_amount: null,
    cess_rate: null,
    cess_amount: null,
    line_total: null,
  };
}

function toNumberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export default function ReviewScreen({ documentId, fileName, mimeType, status, initialExtraction }: ReviewScreenProps) {
  const router = useRouter();
  const [extraction, setExtraction] = useState<Extraction>(initialExtraction);
  const [docStatus, setDocStatus] = useState(status);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const locked = docStatus === "approved";
  const fileUrl = `/api/documents/${documentId}/file`;

  const flags = useMemo<ValidationFlag[]>(() => runValidation(extraction), [extraction]);
  const flagsByField = useMemo(() => {
    const map = new Map<string, ValidationFlag[]>();
    for (const flag of flags) {
      map.set(flag.field, [...(map.get(flag.field) ?? []), flag]);
    }
    return map;
  }, [flags]);

  const errorCount = flags.filter((f) => f.severity === "error").length;
  const warningCount = flags.filter((f) => f.severity === "warning").length;

  function confidenceOf(field: string): number | null {
    return extraction.field_confidence[field] ?? null;
  }

  function setHeaderField<K extends keyof Extraction>(key: K, value: Extraction[K]) {
    setExtraction((prev) => ({ ...prev, [key]: value }));
  }

  function setPartyField(party: "supplier" | "buyer", key: keyof Extraction["supplier"], value: string | null) {
    setExtraction((prev) => ({ ...prev, [party]: { ...prev[party], [key]: value } }));
  }

  function setTotalsField(key: keyof Extraction["totals"], value: string | number | null) {
    setExtraction((prev) => ({ ...prev, totals: { ...prev.totals, [key]: value } }));
  }

  function setLineItemField(idx: number, key: keyof LineItem, value: LineItem[typeof key]) {
    setExtraction((prev) => {
      const line_items = prev.line_items.map((li, i) => (i === idx ? { ...li, [key]: value } : li));
      return { ...prev, line_items };
    });
  }

  function addLineItem() {
    setExtraction((prev) => ({ ...prev, line_items: [...prev.line_items, emptyLineItem()] }));
  }

  function removeLineItem(idx: number) {
    setExtraction((prev) => ({ ...prev, line_items: prev.line_items.filter((_, i) => i !== idx) }));
  }

  function moveLineItem(idx: number, direction: -1 | 1) {
    setExtraction((prev) => {
      const target = idx + direction;
      if (target < 0 || target >= prev.line_items.length) return prev;
      const items = [...prev.line_items];
      [items[idx], items[target]] = [items[target], items[idx]];
      return { ...prev, line_items: items };
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed: extraction }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Save failed.");
        return;
      }
      setSaveMessage(`Saved (${data.changesRecorded} field${data.changesRecorded === 1 ? "" : "s"} changed).`);
      router.refresh();
    } catch {
      setSaveError("Save failed — network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    setApproving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Approve failed.");
        return;
      }
      setDocStatus("approved");
      router.refresh();
    } finally {
      setApproving(false);
    }
  }

  const statusLabel: Record<string, string> = {
    uploaded: "Uploaded",
    processing: "Processing",
    extracted: "Extracted",
    needs_review: "Needs review",
    approved: "Approved",
    exported: "Exported",
    failed: "Failed",
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">{fileName}</h1>
          <p className="text-xs text-muted">
            Status: <span className="font-medium text-foreground">{statusLabel[docStatus] ?? docStatus}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-xs text-success">{saveMessage}</span>}
          {saveError && <span className="text-xs text-danger">{saveError}</span>}
          <button
            onClick={handleSave}
            disabled={saving || locked}
            className="rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleApprove}
            disabled={approving || locked || errorCount > 0}
            title={errorCount > 0 ? "Resolve all errors before approving" : undefined}
            className="rounded-[var(--radius)] bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {locked ? "Approved ✓" : approving ? "Approving…" : "Approve"}
          </button>
          <ExportButtons documentId={documentId} status={docStatus} />
        </div>
      </header>

      {flags.length > 0 && (
        <div className="sticky top-0 z-10 border-b border-warning-border bg-warning-soft px-6 py-2.5 text-sm">
          <p className="font-medium text-foreground">
            {flags.length} issue{flags.length === 1 ? "" : "s"} to check
            {errorCount > 0 && <span className="text-danger"> · {errorCount} error{errorCount === 1 ? "" : "s"}</span>}
            {warningCount > 0 && <span className="text-warning"> · {warningCount} warning{warningCount === 1 ? "" : "s"}</span>}
          </p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
            {flags.slice(0, 12).map((f, i) => (
              <li key={i} className={f.severity === "error" ? "text-danger" : "text-warning"}>
                <span className="font-mono">{f.field}</span>: {f.message}
              </li>
            ))}
            {flags.length > 12 && <li className="text-muted">+{flags.length - 12} more…</li>}
          </ul>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-border bg-surface">
          <DocumentPreviewPane fileUrl={fileUrl} mimeType={mimeType} />
        </div>

        <div className="flex w-1/2 flex-col gap-6 overflow-y-auto bg-background p-6">
          <Section title="Header">
            <div className="grid grid-cols-2 gap-4">
              <PartyFields
                label="Supplier"
                party={extraction.supplier}
                onChange={(key, value) => setPartyField("supplier", key, value)}
                flagsByField={flagsByField}
                confidenceOf={confidenceOf}
                prefix="supplier"
                locked={locked}
              />
              <PartyFields
                label="Buyer"
                party={extraction.buyer}
                onChange={(key, value) => setPartyField("buyer", key, value)}
                flagsByField={flagsByField}
                confidenceOf={confidenceOf}
                prefix="buyer"
                locked={locked}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <TextField
                label="Invoice number"
                field="invoice_number"
                value={extraction.invoice_number}
                onChange={(v) => setHeaderField("invoice_number", v)}
                flagsByField={flagsByField}
                confidenceOf={confidenceOf}
                locked={locked}
              />
              <TextField
                label="Invoice date (YYYY-MM-DD)"
                field="invoice_date"
                value={extraction.invoice_date}
                onChange={(v) => setHeaderField("invoice_date", v)}
                flagsByField={flagsByField}
                confidenceOf={confidenceOf}
                locked={locked}
              />
              <TextField
                label="PO number"
                field="po_number"
                value={extraction.po_number}
                onChange={(v) => setHeaderField("po_number", v)}
                flagsByField={flagsByField}
                confidenceOf={confidenceOf}
                locked={locked}
              />
              <TextField
                label="Place of supply"
                field="place_of_supply"
                value={extraction.place_of_supply}
                onChange={(v) => setHeaderField("place_of_supply", v)}
                flagsByField={flagsByField}
                confidenceOf={confidenceOf}
                locked={locked}
              />
            </div>
          </Section>

          <Section title="Line items">
            <div className="overflow-x-auto rounded-[var(--radius)] border border-border">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="sticky top-0 bg-background text-left text-muted">
                    {["#", "Description", "HSN/SAC", "Qty", "Unit", "Rate", "Taxable", "CGST%", "CGST", "SGST%", "SGST", "IGST%", "IGST", "Total", ""].map((h) => (
                      <th key={h} className="border-b border-border px-2 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extraction.line_items.map((li, idx) => (
                    <tr key={idx} className="border-b border-border align-top last:border-b-0 hover:bg-background/60">
                      <Cell field={`line_items[${idx}].serial_no`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.serial_no} onChange={(v) => setLineItemField(idx, "serial_no", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].description`} flagsByField={flagsByField} confidenceOf={confidenceOf} wide>
                        <TxtInput value={li.description} onChange={(v) => setLineItemField(idx, "description", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].hsn_sac`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <TxtInput value={li.hsn_sac} onChange={(v) => setLineItemField(idx, "hsn_sac", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].quantity`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.quantity} onChange={(v) => setLineItemField(idx, "quantity", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].unit`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <TxtInput value={li.unit} onChange={(v) => setLineItemField(idx, "unit", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].unit_price`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.unit_price} onChange={(v) => setLineItemField(idx, "unit_price", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].taxable_value`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.taxable_value} onChange={(v) => setLineItemField(idx, "taxable_value", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].cgst_rate`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.cgst_rate} onChange={(v) => setLineItemField(idx, "cgst_rate", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].cgst_amount`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.cgst_amount} onChange={(v) => setLineItemField(idx, "cgst_amount", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].sgst_rate`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.sgst_rate} onChange={(v) => setLineItemField(idx, "sgst_rate", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].sgst_amount`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.sgst_amount} onChange={(v) => setLineItemField(idx, "sgst_amount", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].igst_rate`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.igst_rate} onChange={(v) => setLineItemField(idx, "igst_rate", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].igst_amount`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.igst_amount} onChange={(v) => setLineItemField(idx, "igst_amount", v)} disabled={locked} />
                      </Cell>
                      <Cell field={`line_items[${idx}].line_total`} flagsByField={flagsByField} confidenceOf={confidenceOf}>
                        <NumInput value={li.line_total} onChange={(v) => setLineItemField(idx, "line_total", v)} disabled={locked} />
                      </Cell>
                      <td className="whitespace-nowrap px-2 py-1.5">
                        {!locked && (
                          <div className="flex gap-1.5 text-muted">
                            <button onClick={() => moveLineItem(idx, -1)} disabled={idx === 0} className="hover:text-foreground disabled:opacity-30" title="Move up">
                              ↑
                            </button>
                            <button onClick={() => moveLineItem(idx, 1)} disabled={idx === extraction.line_items.length - 1} className="hover:text-foreground disabled:opacity-30" title="Move down">
                              ↓
                            </button>
                            <button onClick={() => removeLineItem(idx)} className="hover:text-danger" title="Delete row">
                              ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!locked && (
              <button onClick={addLineItem} className="mt-2 rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface">
                + Add line item
              </button>
            )}
          </Section>

          <Section title="Totals">
            <div className="grid grid-cols-2 gap-4">
              <TotalField label="Taxable value" field="totals.total_taxable_value" value={extraction.totals.total_taxable_value} onChange={(v) => setTotalsField("total_taxable_value", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
              <TotalField label="CGST" field="totals.total_cgst" value={extraction.totals.total_cgst} onChange={(v) => setTotalsField("total_cgst", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
              <TotalField label="SGST" field="totals.total_sgst" value={extraction.totals.total_sgst} onChange={(v) => setTotalsField("total_sgst", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
              <TotalField label="IGST" field="totals.total_igst" value={extraction.totals.total_igst} onChange={(v) => setTotalsField("total_igst", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
              <TotalField label="Cess" field="totals.total_cess" value={extraction.totals.total_cess} onChange={(v) => setTotalsField("total_cess", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
              <TotalField label="Round off" field="totals.round_off" value={extraction.totals.round_off} onChange={(v) => setTotalsField("round_off", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
              <TotalField label="Grand total" field="totals.grand_total" value={extraction.totals.grand_total} onChange={(v) => setTotalsField("grand_total", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function fieldClasses(field: string, flagsByField: Map<string, ValidationFlag[]>, confidence: number | null) {
  const fieldFlags = flagsByField.get(field) ?? [];
  const hasError = fieldFlags.some((f) => f.severity === "error");
  const hasWarning = fieldFlags.some((f) => f.severity === "warning");
  const lowConfidence = confidence !== null && confidence < 0.75;

  if (hasError) return "border-danger-border bg-danger-soft";
  if (hasWarning || lowConfidence) return "border-warning-border bg-warning-soft";
  return "border-border";
}

function FieldMessages({ field, flagsByField }: { field: string; flagsByField: Map<string, ValidationFlag[]> }) {
  const fieldFlags = flagsByField.get(field) ?? [];
  if (fieldFlags.length === 0) return null;
  return (
    <div className="mt-0.5 flex flex-col gap-0.5">
      {fieldFlags.map((f, i) => (
        <p key={i} className={`text-[11px] ${f.severity === "error" ? "text-danger" : "text-warning"}`}>
          {f.message}
        </p>
      ))}
    </div>
  );
}

function TextField({
  label,
  field,
  value,
  onChange,
  flagsByField,
  confidenceOf,
  locked,
}: {
  label: string;
  field: string;
  value: string | null;
  onChange: (v: string | null) => void;
  flagsByField: Map<string, ValidationFlag[]>;
  confidenceOf: (field: string) => number | null;
  locked: boolean;
}) {
  const confidence = confidenceOf(field);
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="flex items-center gap-1 text-muted">
        {label}
        {confidence !== null && confidence < 0.75 && (
          <span title={`Low confidence: ${Math.round(confidence * 100)}%`} className="text-warning">
            ⚠
          </span>
        )}
      </span>
      <input
        className={`rounded-[var(--radius)] border px-2.5 py-1.5 text-sm text-foreground ${fieldClasses(field, flagsByField, confidence)} disabled:cursor-not-allowed disabled:opacity-60`}
        value={value ?? ""}
        disabled={locked}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      />
      <FieldMessages field={field} flagsByField={flagsByField} />
    </label>
  );
}

function TotalField({
  label,
  field,
  value,
  onChange,
  flagsByField,
  confidenceOf,
  locked,
}: {
  label: string;
  field: string;
  value: number | null;
  onChange: (v: number | null) => void;
  flagsByField: Map<string, ValidationFlag[]>;
  confidenceOf: (field: string) => number | null;
  locked: boolean;
}) {
  const confidence = confidenceOf(field);
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="flex items-center gap-1 text-muted">
        {label}
        {confidence !== null && confidence < 0.75 && (
          <span title={`Low confidence: ${Math.round(confidence * 100)}%`} className="text-warning">
            ⚠
          </span>
        )}
      </span>
      <input
        type="number"
        className={`tnum rounded-[var(--radius)] border px-2.5 py-1.5 text-right text-sm text-foreground ${fieldClasses(field, flagsByField, confidence)} disabled:cursor-not-allowed disabled:opacity-60`}
        value={value ?? ""}
        disabled={locked}
        onChange={(e) => onChange(toNumberOrNull(e.target.value))}
      />
      <FieldMessages field={field} flagsByField={flagsByField} />
    </label>
  );
}

function PartyFields({
  label,
  party,
  onChange,
  flagsByField,
  confidenceOf,
  prefix,
  locked,
}: {
  label: string;
  party: Extraction["supplier"];
  onChange: (key: keyof Extraction["supplier"], value: string | null) => void;
  flagsByField: Map<string, ValidationFlag[]>;
  confidenceOf: (field: string) => number | null;
  prefix: string;
  locked: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-background p-3">
      <h3 className="text-xs font-semibold text-muted">{label}</h3>
      <TextField label="Name" field={`${prefix}.name`} value={party.name} onChange={(v) => onChange("name", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
      <TextField label="GSTIN" field={`${prefix}.gstin`} value={party.gstin} onChange={(v) => onChange("gstin", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
      <TextField label="Address" field={`${prefix}.address`} value={party.address} onChange={(v) => onChange("address", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
      <TextField label="State code" field={`${prefix}.state_code`} value={party.state_code} onChange={(v) => onChange("state_code", v)} flagsByField={flagsByField} confidenceOf={confidenceOf} locked={locked} />
    </div>
  );
}

function Cell({
  field,
  flagsByField,
  confidenceOf,
  wide,
  children,
}: {
  field: string;
  flagsByField: Map<string, ValidationFlag[]>;
  confidenceOf: (field: string) => number | null;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const confidence = confidenceOf(field);
  const classes = fieldClasses(field, flagsByField, confidence);
  const highlighted = classes.includes("bg-");
  return (
    <td className={`px-1.5 py-1 ${wide ? "min-w-[160px]" : "min-w-[64px]"}`}>
      <div className={`rounded-md ${highlighted ? `border ${classes}` : ""}`}>
        {children}
      </div>
      <FieldMessages field={field} flagsByField={flagsByField} />
    </td>
  );
}

function NumInput({ value, onChange, disabled }: { value: number | null; onChange: (v: number | null) => void; disabled: boolean }) {
  return (
    <input
      type="number"
      className="tnum w-full rounded-md border-0 bg-transparent px-1.5 py-1 text-right text-xs text-foreground focus:outline-1 focus:outline-primary disabled:opacity-60"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(toNumberOrNull(e.target.value))}
    />
  );
}

function TxtInput({ value, onChange, disabled }: { value: string | null; onChange: (v: string | null) => void; disabled: boolean }) {
  return (
    <input
      type="text"
      className="w-full rounded-md border-0 bg-transparent px-1.5 py-1 text-xs text-foreground focus:outline-1 focus:outline-primary disabled:opacity-60"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
    />
  );
}
