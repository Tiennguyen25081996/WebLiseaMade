import type { ReactNode } from "react";

export type BadgeTone = "lagoon" | "coral" | "sand" | "neutral";

const TONES: Record<BadgeTone, string> = {
  lagoon: "bg-lagoon-100 text-lagoon-800 ring-lagoon-200",
  coral: "bg-coral-100 text-coral-800 ring-coral-200",
  sand: "bg-sand-200 text-sand-900 ring-sand-300",
  neutral: "bg-white text-ink-700 ring-sand-200",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "lagoon", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
