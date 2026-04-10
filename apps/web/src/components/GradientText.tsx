import type { ElementType, ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export default function GradientText({ children, className = "", as: Tag = "span" }: GradientTextProps) {
  return (
    <Tag className={`gradient-text ${className}`}>
      {children}
    </Tag>
  );
}
