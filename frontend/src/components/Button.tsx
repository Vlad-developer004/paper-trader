import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base = "rounded-xl px-5 py-3 text-sm font-bold transition-opacity disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:opacity-90",
  secondary: "border border-border text-fg hover:bg-black/5 dark:hover:bg-white/5",
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
