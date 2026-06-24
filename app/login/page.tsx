export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            G
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Sign in to Ledgerly</h1>
          <p className="text-center text-sm text-muted">Use your work email to access your organization's documents.</p>
        </div>

        <form className="flex flex-col gap-4">
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
              autoComplete="current-password"
              placeholder="••••••••"
              className="rounded-[var(--radius)] border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-[var(--radius)] bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <a href="/register" className="font-medium text-primary hover:text-primary-hover">
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}
