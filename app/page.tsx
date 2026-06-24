"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

const ACCEPTED = "application/pdf,image/png,image/jpeg,image/webp";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    setFile(f);
    setError(null);
    setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/documents", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Upload failed.");
      return;
    }

    router.push(`/documents/${data.documentId}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">GST Invoice Extraction</h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          Upload a vendor invoice or purchase order and get a structured, validated GST extraction.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              if (f) pickFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={`card flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragActive ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {file ? (
              <>
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB — click to change</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">Drag and drop a file here, or click to browse</p>
                <p className="text-xs text-muted">PDF, PNG, JPG, or WEBP — max 15 MB</p>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || status === "uploading"}
            className="rounded-[var(--radius)] bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "uploading" ? "Extracting your document…" : "Upload & Extract"}
          </button>

          {status === "uploading" && (
            <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-primary/20 bg-primary-soft px-4 py-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
              </div>
              <p className="text-xs text-primary">
                Reading line items, tax fields, and GSTINs — this usually takes about 20 seconds.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-[var(--radius)] border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </form>

        <div className="mt-8">
          <a href="/documents" className="text-sm text-muted hover:text-foreground">
            View past documents →
          </a>
        </div>
      </div>
    </main>
  );
}
