import Reveal from "./Reveal";

const PAINS = [
  {
    title: "Manual entry eats days",
    body: "Hundreds of vendor invoices land as PDFs, WhatsApp photos and scans — and someone has to type every one into Tally by hand.",
  },
  {
    title: "One wrong digit breaks a return",
    body: "A mistyped GSTIN or tax amount means reconciliation headaches later, or a return that needs to be revised.",
  },
  {
    title: "Missed bills = lost ITC (real cash)",
    body: "An invoice that never makes it into the books is Input Tax Credit your business never claims.",
  },
];

export default function ProblemSection() {
  return (
    <section className="border-b border-border bg-background py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            It&apos;s the 8th of the month again.
          </h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted md:text-base">
            Filing deadline is close, and the team is still typing invoices into Tally line by line.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PAINS.map((pain, i) => (
            <Reveal key={pain.title} delay={0.08 * i}>
              <div className="card h-full p-6">
                <p className="text-sm font-semibold text-foreground">{pain.title}</p>
                <p className="mt-2 text-sm text-muted">{pain.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
