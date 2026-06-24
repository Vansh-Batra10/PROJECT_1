import Reveal from "./Reveal";

export default function WhoItsFor() {
  return (
    <section className="border-b border-border bg-surface py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Who it&apos;s for
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Reveal delay={0.05}>
            <div className="card h-full p-8">
              <p className="text-base font-semibold text-foreground">CA &amp; bookkeeping firms</p>
              <p className="mt-2 text-sm text-muted">
                Turn a junior&apos;s two-day data-entry job into two hours. Handle more clients without
                adding headcount.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card h-full p-8">
              <p className="text-base font-semibold text-foreground">SME accounts teams</p>
              <p className="mt-2 text-sm text-muted">
                Never miss a purchase invoice, never lose Input Tax Credit because a bill slipped
                through the cracks.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
