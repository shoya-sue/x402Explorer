import type { ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlowCard({ children, className = "", hover = true }: GlowCardProps) {
  const hoverClasses = hover
    ? "hover:border-solana-purple/40 hover:shadow-glow-card hover:-translate-y-0.5 cursor-default"
    : "";

  return (
    <div className={`glass-card p-6 transition-all duration-300 ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}
