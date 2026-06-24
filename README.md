# GST Invoice & PO Extraction (MVP) — Phase 1

A web app where an Indian accountant uploads a vendor invoice or PO (PDF/image) and gets back a
structured, validated GST extraction. This is **Phase 1**: prove the extraction core works end to
end. No auth, no review UI yet — just upload → extract → see the result.

## Stack

- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL via Prisma
- Google Gemini (vision-capable model) via the official `@google/genai` SDK, behind an
  `ExtractionService` interface so the provider is swappable later
- PDFs are sent natively to Gemini as inline base64 data — no server-side rasterization needed
  (Gemini's API accepts PDFs directly)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Have a PostgreSQL database running and set `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/gst_extract?schema=public"
   ```
3. Set your Gemini API key in `.env`:
   ```
   GEMINI_API_KEY="..."
   ```
   Get one at https://aistudio.google.com/apikey. Never paste the key directly into chat —
   only into `.env` (which is gitignored).
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000, upload a file, get redirected to the result page.

## Sample test invoices

`/samples` contains 5 generated PDFs covering the scenarios in the brief (regenerate with
`npx tsx scripts/generate-samples.ts`):

1. `01-intra-state-cgst-sgst.pdf` — clean intra-state invoice, CGST+SGST, multiple HSN line items
2. `02-inter-state-igst.pdf` — inter-state invoice, IGST
3. `03-services-sac.pdf` — services invoice using SAC codes
4. `04-messy-scan-low-confidence.pdf` — deliberately sparse layout to exercise low-confidence flags
5. `05-purchase-order.pdf` — PO with no tax amounts, just items + PO number

All vendor names and GSTINs are fictional but format-valid.

## What's built in Phase 1

- Upload a PDF/PNG/JPG/WEBP (≤15 MB) via `POST /api/documents`
- `ExtractionService` sends the document to Gemini with the GST extraction system prompt
  (`lib/extraction-prompt.ts`), validates the JSON response against a zod schema
  (`lib/extraction-schema.ts`), and retries once on malformed JSON
- `ValidationService` (`lib/validation-service.ts`) runs the GST rules engine: GSTIN format,
  state-code consistency, intra/inter-state tax-type checks, per-line and header tax-math
  reconciliation, HSN/SAC shape, date plausibility, required-field presence, and low-confidence
  flagging
- Results are persisted to Postgres (`Document`, `Extraction`, `LineItem`, `ValidationFlag`)
- `/documents` lists uploaded documents with status + confidence
- `/documents/:id` shows header fields, line items, totals, validation flags, and the raw
  parsed JSON
- Failures (bad file type, model timeout, malformed JSON, missing API key) are caught and the
  document is marked `failed` with a user-facing error — verified by uploading without an API key

## Explicitly stubbed / not built yet (later phases)

- **Phase 2**: two-pane review UI (document preview + editable fields), live re-validation on
  edit, audit trail of human corrections (`ReviewEdit` model already exists in the schema)
- **Phase 3**: Excel/CSV export (`Export` model already exists in the schema)
- **Phase 4**: auth, org scoping (`User`/`Org` models already exist), dashboard polish
- **Stretch, not started**: Tally XML export, batch upload, cost-optimized model routing, email/
  WhatsApp ingestion, billing

## Privacy note

Uploaded documents are sent to Google's Gemini API for extraction and are not sent to any
other third party. Originals are stored on local disk in `UPLOAD_DIR` (S3-ready via
`StorageService` — swap the implementation, not the callers). Document bytes and extracted PII
are never written to logs.
