import { useEffect, useRef, useState } from "react";
import { LANGUAGES, useLanguage } from "../lib/i18n/index.js";
import { FlagIcon } from "./FlagIcon.js";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
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
        aria-label={t("a11y.language")}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-bold uppercase text-fg"
      >
        <FlagIcon lang={lang} />
        {lang}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-10 mt-1.5 min-w-[9rem] overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === lang}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                l.code === lang ? "bg-accent/12 text-accent" : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <FlagIcon lang={l.code} />
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
