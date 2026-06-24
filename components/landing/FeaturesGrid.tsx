import Reveal from "./Reveal";

const FEATURES = [
  { title: "Every line item captured", body: "Full table extraction, not just header totals." },
  { title: "GST-aware validation", body: "GSTIN, tax-math, and intra/inter-state checks built in." },
  { title: "Confidence scoring", body: "Review only low-confidence fields; trust the rest." },
  { title: "Tally & Excel export", body: "Accounting-ready data, mapped to purchase-entry fields." },
  { title: "Audit trail", body: "Every correction is logged against the original extraction." },
  { title: "Handles real-world docs", body: "Photos, scans, and imperfect bills — not just clean PDFs." },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="border-b border-border bg-background py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Built for how Indian accounting actually works
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={0.05 * i}>
              <div className="card h-full p-6 transition-transform duration-200 hover:-translate-y-0.5">
                <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                <p className="mt-2 text-sm text-muted">{feature.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
