import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Ledgerly — GST Invoice Extraction for Indian Businesses",
  description:
    "Turn any vendor invoice — PDF, photo, or scan — into accounting-ready, GST-validated data. Every line item, HSN/SAC and tax split, exported straight to Excel or Tally.",
  openGraph: {
    title: "Ledgerly — Invoices in. Tally-ready data out.",
    description:
      "AI-powered GST invoice extraction and validation for Indian CA firms and SME accounts teams.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
