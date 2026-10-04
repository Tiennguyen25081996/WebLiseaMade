import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Language button luxury: radius hairline, no giant pill, no shadow.
 * Interaction = slow transition (500ms) + subtle tone, not bounce.
 */
const BASE =
  "relative inline-flex items-center justify-center gap-2 rounded-hair px-5 py-2 text-xs font-sans font-medium tracking-[0.08em] transition-all duration-500 ease-editorial disabled:opacity-40 disabled:cursor-not-allowed";

const VARIANTS = {
  primary: "bg-ink-900 text-sand-50 hover:bg-ink-700",
  secondary:
    "bg-transparent text-ink-900 border-1 border-ink-900/25 hover:border-ink-900/70 hover:bg-sand-100",
  ghost: "bg-transparent text-ink-700 hover:text-ink-900",
  danger:
    "bg-transparent text-coral-700 border-1 border-coral-700/35 hover:border-coral-700/80 hover:bg-coral-50",
} as const;

const SIZES = {
  sm: "px-3 py-1 text-2xs",
  md: "px-5 py-2 text-xs",
  lg: "px-7 py-3 text-sm",
} as const;

export function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  onClick,
  disabled = false,
  className = "",
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;


  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps {
  to: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LINK_SIZES = { sm: "text-xs", md: "text-sm", lg: "text-lg" } as const;

/** Link cò sach them button: underline reveal, language editorial. */
export function ButtonLink({
  to,
  children,
  size = "md",
  className = "",
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={`underline-reveal ${LINK_SIZES[size]} font-sans font-medium tracking-[0.06em] text-ink-900 hover:text-lagoon-700 ${className}`}
    >
      {children}
    </Link>
  );
}
