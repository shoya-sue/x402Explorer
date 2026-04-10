export const runtime = "edge";

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "x402 Explorer — Discover APIs Powered by x402 Payments",
  description: "Discover, register, and visualize APIs implementing the x402 payment protocol on Solana. Real-time ecosystem monitoring for AI agent payments.",
  openGraph: {
    title: "x402 Explorer",
    description: "The index for x402-powered APIs on Solana",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-solana-dark text-neutral-100 antialiased font-sans">
        <div className="relative">
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-solana-purple/10 blur-3xl" />
            <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-solana-green/6 blur-3xl" />
          </div>
          <Navbar />
          <main className="relative">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
