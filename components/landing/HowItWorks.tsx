import Reveal from "./Reveal";

const STEPS = [
  {
    n: "1",
    title: "Upload",
    body: "Drop a PDF, photo, or scan — even messy ones. Ledgerly handles real-world documents, not just clean exports.",
  },
  {
    n: "2",
    title: "AI extracts & validates",
    body: "Every line item, HSN/SAC, quantity, rate, CGST/SGST/IGST. Built-in checks catch GSTIN format, tax math, and intra- vs inter-state errors — it only flags what needs your eyes.",
  },
  {
    n: "3",
    title: "Review & export",
    body: "Fix flagged fields in a clean two-pane screen, approve, and export to an Excel or Tally-ready format.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border bg-surface py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            How it works
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={0.08 * i}>
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-base font-semibold text-primary">
                  {step.n}
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
