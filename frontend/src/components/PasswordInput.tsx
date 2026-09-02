import { useState, type InputHTMLAttributes } from "react";

export function PasswordInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className={`w-full rounded-xl border border-border bg-transparent py-3 pl-3.5 pr-11 text-sm outline-none transition-colors focus:border-accent ${className}`}
        type={visible ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-fg"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3L21 21M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M9.4 5.5A10.4 10.4 0 0 1 12 5c5 0 9 4 10 7-.4 1.2-1.2 2.6-2.4 3.9M6.4 6.4C4.4 7.8 2.9 9.7 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 12C3 9 7 5 12 5s9 4 10 7c-1 3-5 7-10 7s-9-4-10-7Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        )}
      </button>
    </div>
  );
}
