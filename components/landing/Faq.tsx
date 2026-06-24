"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import Reveal from "./Reveal";

const FAQS = [
  {
    q: "Does it work on photos and scans?",
    a: "Yes. Ledgerly is built to handle real-world documents — phone photos, scanned bills, and low-quality images — not just clean PDF exports. Low-confidence fields are flagged for a quick review rather than silently guessed.",
  },
  {
    q: "How accurate is it?",
    a: "Accuracy depends on document quality, but every extracted field carries a confidence score, and built-in checks (GSTIN format, tax math, intra/inter-state logic) flag anything that needs a human look before you export.",
  },
  {
    q: "Is my financial data secure?",
    a: "Documents are processed solely to extract and validate invoice data. We don't sell or share your data with third parties.",
  },
  {
    q: "Does it export to Tally?",
    a: "Yes — exports are formatted to map cleanly onto Tally purchase-entry fields, plus a standard Excel/CSV format for any other accounting tool.",
  },
  {
    q: "Can it handle handwritten invoices?",
    a: "Handwritten documents are harder to extract reliably than printed or typed ones. Ledgerly will attempt extraction and flag low-confidence fields, but accuracy on handwriting is lower than on printed invoices.",
  },
  {
    q: "What document types are supported?",
    a: "Vendor invoices and purchase orders, in PDF, PNG, JPG, or WEBP format.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <span
          className="shrink-0 text-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-sm text-muted">{a}</p>
      </motion.div>
    </div>
  );
}

export default function Faq() {
  return (
    <section id="faq" className="border-b border-border bg-surface py-20">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Frequently asked questions
          </h2>
        </Reveal>
        <Reveal delay={0.08} className="mt-10">
          <div>
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
