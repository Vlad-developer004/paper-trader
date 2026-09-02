export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M4 18L10 12L14 16L20 8" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 8H20V13" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="font-serif italic text-xl">Paper Trader</div>
    </div>
  );
}
