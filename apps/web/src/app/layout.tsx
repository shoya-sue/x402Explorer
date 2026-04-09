import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "x402 Explorer",
  description: "Discover and visualize APIs implementing the x402 payment protocol",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
