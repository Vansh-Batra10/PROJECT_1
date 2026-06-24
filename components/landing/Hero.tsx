import Link from "next/link";
import Reveal from "./Reveal";
import BeforeAfter from "./BeforeAfter";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom, black, transparent)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary-soft), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Invoices in. Tally-ready data out.
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted md:text-lg">
              Upload a PDF, photo, or scan. Ledgerly extracts every line item, HSN/SAC code and GST
              split, checks the tax math, and exports clean data straight into Excel or Tally. Built
              for Indian CAs and SMEs.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-8 flex flex-col items-center gap-2">
              <Link
                href="/register"
                className="rounded-[var(--radius)] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Try it free
              </Link>
              <span className="text-xs text-muted">No card required.</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.24} className="mx-auto mt-16 max-w-3xl">
          <BeforeAfter />
        </Reveal>
      </div>
    </section>
  );
}
