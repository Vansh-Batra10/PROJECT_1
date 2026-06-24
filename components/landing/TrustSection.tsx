import Reveal from "./Reveal";

export default function TrustSection() {
  return (
    <section className="border-b border-border bg-background py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <p className="text-sm font-medium text-foreground">Built for India&apos;s GST regime</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">
            Your documents are processed only to extract and validate invoice data — they are not
            shared with third parties or used to train models on your data.
          </p>
        </Reveal>

        {/* REPLACE ME: swap this row for real client logos once available. No fabricated logos/testimonials. */}
        <Reveal delay={0.08}>
          <div className="mt-8 flex items-center justify-center gap-6 opacity-50">
            <div className="h-8 w-28 rounded border border-dashed border-border" />
            <div className="h-8 w-28 rounded border border-dashed border-border" />
            <div className="h-8 w-28 rounded border border-dashed border-border" />
          </div>
          <p className="mt-2 text-xs text-muted">Client logos — placeholder, replace once available.</p>
        </Reveal>
      </div>
    </section>
  );
}
