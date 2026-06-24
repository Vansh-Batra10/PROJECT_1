import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-sm text-muted md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-white">
            G
          </span>
          <span className="font-semibold text-foreground">Ledgerly</span>
        </div>

        <nav className="flex items-center gap-6">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground">
            How it works
          </a>
          <a href="#faq" className="hover:text-foreground">
            FAQ
          </a>
          <Link href="/login" className="hover:text-foreground">
            Login
          </Link>
        </nav>

        <p>
          © {new Date().getFullYear()} Ledgerly. Made in India.
        </p>
      </div>
    </footer>
  );
}
