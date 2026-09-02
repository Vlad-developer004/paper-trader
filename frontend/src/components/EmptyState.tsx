import type { ReactNode } from "react";

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="text-border">
        <rect x="3" y="8" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 8V6.5C8 5.12 9.12 4 10.5 4H13.5C14.88 4 16 5.12 16 6.5V8" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <div>
        <div className="font-bold">{title}</div>
        <div className="mt-1 text-sm text-muted">{body}</div>
      </div>
      {action}
    </div>
  );
}
