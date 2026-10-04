import type { ReactNode } from "react";

export type BadgeTone = "lagoon" | "coral" | "sand" | "neutral";

const TONES: Record<BadgeTone, string> = {
  lagoon: "border-lagoon-300 text-lagoon-700",
  coral: "border-coral-300 text-coral-700",
  sand: "border-sand-300 text-sand-800",
  neutral: "border-ink-900/20 text-ink-700",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** Badge luxury: chip hairline + micro-caps eyebrow, không pill không fill. */
export function Badge({ tone = "lagoon", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-hair border-1 px-2 py-1 text-eyebrow uppercase tracking-[0.14em] ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
