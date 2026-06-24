import Link from "next/link";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-white">
            G
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            Ledgerly
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/upload" className="hover:text-foreground">
            Upload
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Documents
          </Link>
        </nav>
      </div>
    </header>
  );
}
