"use client";

import { useRouter } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/session-constants";

export default function RegisterPage() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Demo-only: no real auth backend yet. New signups land on /upload.
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=2592000`;
    router.push("/upload");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            G
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Create your Ledgerly account</h1>
          <p className="text-center text-sm text-muted">Set up your organization to start extracting invoices.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="org" className="text-sm font-medium text-foreground">
              Organization name
            </label>
            <input
              id="org"
              type="text"
              placeholder="Acme Pvt Ltd"
              className="rounded-[var(--radius)] border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="rounded-[var(--radius)] border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="rounded-[var(--radius)] border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-[var(--radius)] bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
