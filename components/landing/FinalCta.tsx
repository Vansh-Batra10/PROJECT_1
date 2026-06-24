import Link from "next/link";
import Reveal from "./Reveal";

export default function FinalCta() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Stop typing. Start filing.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-7 flex flex-col items-center gap-2">
            <Link
              href="/register"
              className="rounded-[var(--radius)] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Get Started
            </Link>
            <span className="text-xs text-muted">No card required.</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
