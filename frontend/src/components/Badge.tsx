import type { ReactNode } from "react";

type Tone = "positive" | "negative" | "info";

const tones: Record<Tone, string> = {
  positive: "bg-positive-bg text-positive",
  negative: "bg-negative-bg text-negative",
  info: "bg-accent/15 text-accent",
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}
