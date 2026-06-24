import type { Extraction } from "./extraction-schema";

export interface FieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

function flatten(value: unknown, prefix: string, out: Map<string, string | null>) {
  if (value === null || value === undefined) {
    out.set(prefix, null);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, idx) => flatten(item, `${prefix}[${idx}]`, out));
    return;
  }
  if (typeof value === "object") {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      flatten(val, prefix ? `${prefix}.${key}` : key, out);
    }
    return;
  }
  out.set(prefix, String(value));
}

/** Flattens header fields, totals, and line_items into a diffable map; skips field_confidence/notes (not user-editable). */
function flattenExtraction(extraction: Extraction): Map<string, string | null> {
  const { field_confidence, overall_confidence, extraction_notes, ...rest } = extraction;
  void field_confidence;
  void overall_confidence;
  void extraction_notes;
  const out = new Map<string, string | null>();
  flatten(rest, "", out);
  return out;
}

/** Diffs two extractions field-by-field for the ReviewEdit audit trail. */
export function diffExtractions(before: Extraction, after: Extraction): FieldChange[] {
  const beforeFlat = flattenExtraction(before);
  const afterFlat = flattenExtraction(after);
  const changes: FieldChange[] = [];
  const allFields = new Set([...beforeFlat.keys(), ...afterFlat.keys()]);

  for (const field of allFields) {
    const oldValue = beforeFlat.get(field) ?? null;
    const newValue = afterFlat.get(field) ?? null;
    if (oldValue !== newValue) {
      changes.push({ field: field.replace(/^\./, ""), oldValue, newValue });
    }
  }

  return changes;
}
