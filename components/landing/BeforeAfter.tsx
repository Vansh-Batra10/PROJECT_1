"use client";

import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const ROWS = [
  { desc: "Steel Sheets 2mm", hsn: "7208", rate: "₹12,400.00", tax: "18%" },
  { desc: "Welding Rods (5kg)", hsn: "8311", rate: "₹2,150.00", tax: "18%" },
  { desc: "Safety Gloves", hsn: "4015", rate: "₹860.00", tax: "12%" },
];

const CYCLE_MS = 4200;

export default function BeforeAfter() {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setTick((t) => t + 1), CYCLE_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="card relative overflow-hidden p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Vendor invoice</p>
        <div className="space-y-2 rounded-[var(--radius)] border border-border bg-background p-4">
          <div className="h-2.5 w-2/3 rounded bg-border" />
          <div className="h-2.5 w-1/2 rounded bg-border" />
          <div className="mt-4 space-y-1.5">
            <div className="h-2 w-full rounded bg-border" />
            <div className="h-2 w-5/6 rounded bg-border" />
            <div className="h-2 w-full rounded bg-border" />
            <div className="h-2 w-4/6 rounded bg-border" />
          </div>
          <div className="mt-4 h-2.5 w-1/3 rounded bg-border" />
        </div>
        <p className="mt-3 text-xs text-muted">A scanned PDF, photo, or messy bill — as-is.</p>
      </div>

      <div className="card relative overflow-hidden p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Extracted &amp; validated</p>
        <div className="overflow-hidden rounded-[var(--radius)] border border-border">
          <table className="tnum w-full text-xs">
            <thead>
              <tr className="bg-background text-left text-muted">
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">HSN</th>
                <th className="px-3 py-2 text-right font-medium">Rate</th>
                <th className="px-3 py-2 text-right font-medium">GST</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <AnimatePresence key={`${tick}-${row.desc}`} mode="popLayout">
                  <motion.tr
                    initial={reduceMotion ? undefined : { opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.22 }}
                    className="border-t border-border"
                  >
                    <td className="px-3 py-2 text-foreground">{row.desc}</td>
                    <td className="px-3 py-2 text-muted">{row.hsn}</td>
                    <td className="px-3 py-2 text-right text-foreground">{row.rate}</td>
                    <td className="px-3 py-2 text-right text-foreground">{row.tax}</td>
                  </motion.tr>
                </AnimatePresence>
              ))}
            </tbody>
          </table>
        </div>
        <motion.div
          key={`flags-${tick}`}
          initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.85 }}
          className="mt-3 flex items-center gap-2"
        >
          <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
            ✓ Tax math validated
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-warning-border bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
            1 field to review
          </span>
        </motion.div>
      </div>
    </div>
  );
}
