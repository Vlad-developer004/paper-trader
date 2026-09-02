import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-card bg-card border border-border shadow-[0_1px_2px_rgba(0,0,0,0.05),0_12px_28px_rgba(0,0,0,0.06)] p-4 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
