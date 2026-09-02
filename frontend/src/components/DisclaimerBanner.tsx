import { useLanguage } from "../lib/i18n/index.js";

export function DisclaimerBanner() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-2.5 border-b border-[oklch(0.85_0.06_65)] bg-[oklch(0.94_0.05_75)] px-6 py-2.5 dark:border-[oklch(0.37_0.07_65)] dark:bg-[oklch(0.28_0.06_65)]">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[oklch(0.5_0.1_55)] dark:text-[oklch(0.82_0.1_65)]">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 11V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="8" r="1.1" fill="currentColor" />
      </svg>
      <span className="min-w-0 text-[12.5px] font-semibold text-[oklch(0.4_0.08_55)] dark:text-[oklch(0.85_0.09_65)]">
        {t("disclaimer.banner")}
      </span>
    </div>
  );
}
