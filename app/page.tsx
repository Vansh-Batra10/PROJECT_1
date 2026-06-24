"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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
        <h1 className="text-2xl font-semibold mb-1">GST Invoice Extraction</h1>
        <p className="text-sm text-gray-500 mb-6">
          Upload a vendor invoice or purchase order (PDF, PNG, JPG, WEBP — max 15 MB) and get a
          structured GST extraction.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="border rounded p-2 text-sm"
          />
          <button
            type="submit"
            disabled={!file || status === "uploading"}
            className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40"
          >
            {status === "uploading" ? "Extracting… (this can take ~20s)" : "Upload & Extract"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <div className="mt-8">
          <a href="/documents" className="text-sm underline text-gray-600">
            View past documents →
          </a>
        </div>
      </div>
    </main>
  );
}
