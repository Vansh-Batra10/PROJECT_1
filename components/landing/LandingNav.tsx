"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNav({ loggedIn }: { loggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-all duration-200 ${
        scrolled ? "border-border bg-surface/95 shadow-sm backdrop-blur-sm" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
            G
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Ledgerly</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border text-foreground md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="sr-only">Menu</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-surface px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm text-muted">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="hover:text-foreground">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {loggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-[var(--radius)] bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-hover"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-[var(--radius)] border border-border px-4 py-2 text-center text-sm font-medium text-foreground">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-[var(--radius)] bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-hover"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
