import { useLanguage } from "../lib/i18n/index.js";

export function Footer() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-t border-border px-6 py-6 md:flex-row md:px-12">
      <div className="max-w-2xl">
        <div className="text-[13px] font-bold">{t("footer.title")}</div>
        <div className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t("footer.body")}</div>
      </div>
      <div className="whitespace-nowrap text-xs font-semibold text-muted">{t("footer.tag")}</div>
    </div>
  );
}
