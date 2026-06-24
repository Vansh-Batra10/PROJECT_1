"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function DocumentPreviewPane({
  fileUrl,
  mimeType,
}: {
  fileUrl: string;
  mimeType: string;
}) {
  const [numPages, setNumPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);

  const isPdf = mimeType === "application/pdf";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2 text-sm bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="border rounded px-2 py-1 hover:bg-gray-100"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="border rounded px-2 py-1 hover:bg-gray-100"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
        {isPdf && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="border rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span>
              Page {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              className="border rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
        {isPdf ? (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={<p className="text-sm text-gray-500">Loading document…</p>}
            error={<p className="text-sm text-red-600">Failed to load PDF.</p>}
          >
            <Page
              pageNumber={pageNumber}
              scale={zoom}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt="Document preview"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            className="max-w-none h-fit"
          />
        )}
      </div>
    </div>
  );
}
