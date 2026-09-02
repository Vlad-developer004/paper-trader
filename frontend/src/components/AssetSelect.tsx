import { useEffect, useRef, useState } from "react";
import { AssetIcon } from "./AssetIcon.js";
import type { AssetSymbol } from "../lib/binanceSocket.js";

const ASSETS: AssetSymbol[] = ["BTC", "ETH", "SOL"];

// A native <select>'s dropdown list is styled by the OS, not the page — it ignores the app's
// dark theme entirely (stark white popup regardless of `.dark`). This renders the closed control
// and the open list ourselves so both follow the same design tokens as everything else.
export function AssetSelect({ value, onChange }: { value: AssetSymbol; onChange: (asset: AssetSymbol) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-transparent px-3.5 py-3 text-sm font-bold outline-none transition-colors focus:border-accent"
      >
        <span className="flex items-center gap-2">
          <AssetIcon asset={value} size={18} />
          {value}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
        >
          {ASSETS.map((a) => (
            <button
              key={a}
              type="button"
              role="option"
              aria-selected={a === value}
              onClick={() => {
                onChange(a);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-bold transition-colors ${
                a === value ? "bg-accent/12 text-accent" : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <AssetIcon asset={a} size={18} />
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
