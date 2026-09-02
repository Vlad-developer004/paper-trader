import { NavLink } from "react-router-dom";
import { useLanguage, type TranslationKey } from "../lib/i18n/index.js";

const tabs: { to: string; labelKey: TranslationKey; icon: JSX.Element }[] = [
  {
    to: "/",
    labelKey: "nav.dashboard",
    icon: (
      <path d="M4 18L10 12L14 16L20 8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    to: "/portfolio",
    labelKey: "nav.portfolio",
    icon: (
      <>
        <rect x="3" y="8" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M8 8V6.5C8 5.12 9.12 4 10.5 4H13.5C14.88 4 16 5.12 16 6.5V8" stroke="currentColor" strokeWidth="2" />
      </>
    ),
  },
  {
    to: "/history",
    labelKey: "nav.history",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    to: "/leaderboard",
    labelKey: "tab.leaders",
    icon: (
      <>
        <path d="M7 4H17V9C17 11.76 14.76 14 12 14C9.24 14 7 11.76 7 9V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 14V18M9 20H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
];

export function BottomTabBar() {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-card px-3 pb-5 pt-3 md:hidden">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === "/"} className="flex flex-col items-center gap-1">
          {({ isActive }) => (
            <>
              <div
                className={`flex h-[30px] w-[38px] items-center justify-center rounded-[11px] ${
                  isActive ? "bg-fg text-bg" : "text-muted"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  {tab.icon}
                </svg>
              </div>
              <span className={`text-[10px] font-bold ${isActive ? "text-fg" : "text-muted"}`}>{t(tab.labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
