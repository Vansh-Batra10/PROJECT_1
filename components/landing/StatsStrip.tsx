"use client";

import { motion, useInView, useMotionValue, useReducedMotion, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

// PLACEHOLDER stats — illustrative only. Replace with real, measured numbers
// before this goes live; do not present these as proven results.
const STATS = [
  { value: 90, suffix: "%", label: "less manual entry time" },
  { value: 100, suffix: "%", label: "of line items + HSN captured" },
  { value: 0, suffix: "", label: "invoices missed", display: "Zero" },
];

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion, motionValue]);

  return (
    <span ref={ref} className="tnum">
      {display}
      {suffix}
    </span>
  );
}

export default function StatsStrip() {
  return (
    <section className="border-b border-border bg-primary py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 text-center sm:grid-cols-3">
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-3xl font-semibold text-white md:text-4xl">
                {stat.display ?? <CountUp value={stat.value} suffix={stat.suffix} />}
              </p>
              <p className="mt-1 text-sm text-white/80">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-white/60">
          Illustrative placeholders — replace with measured results.
        </p>
      </div>
    </section>
  );
}
