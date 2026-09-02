import type { Language } from "../lib/i18n/index.js";

function GB() {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" className="rounded-[2px]">
      <rect width="20" height="14" fill="#00247d" />
      <path d="M0 0L20 14M20 0L0 14" stroke="#fff" strokeWidth="2.8" />
      <path d="M0 0L20 14M20 0L0 14" stroke="#cf142b" strokeWidth="1.2" />
      <path d="M10 0V14M0 7H20" stroke="#fff" strokeWidth="4.6" />
      <path d="M10 0V14M0 7H20" stroke="#cf142b" strokeWidth="2.6" />
    </svg>
  );
}

function DE() {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" className="rounded-[2px]">
      <rect width="20" height="4.67" y="0" fill="#000" />
      <rect width="20" height="4.67" y="4.67" fill="#dd0000" />
      <rect width="20" height="4.67" y="9.33" fill="#ffce00" />
    </svg>
  );
}

function RU() {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" className="rounded-[2px]">
      <rect width="20" height="4.67" y="0" fill="#fff" />
      <rect width="20" height="4.67" y="4.67" fill="#0039a6" />
      <rect width="20" height="4.67" y="9.33" fill="#d52b1e" />
    </svg>
  );
}

function UA() {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" className="rounded-[2px]">
      <rect width="20" height="7" y="0" fill="#005bbb" />
      <rect width="20" height="7" y="7" fill="#ffd500" />
    </svg>
  );
}

const FLAGS: Record<Language, () => JSX.Element> = { en: GB, de: DE, ru: RU, uk: UA };

export function FlagIcon({ lang }: { lang: Language }) {
  const Flag = FLAGS[lang];
  return <Flag />;
}
