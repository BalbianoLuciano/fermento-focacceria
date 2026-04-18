import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "dark" | "light";

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  showTagline?: boolean;
  className?: string;
  as?: "link" | "div";
}

const sizeStyles: Record<LogoSize, { title: string; tagline: string }> = {
  sm: { title: "text-xl", tagline: "text-[10px]" },
  md: { title: "text-3xl", tagline: "text-xs" },
  lg: { title: "text-5xl md:text-6xl", tagline: "text-sm" },
};

const variantStyles: Record<LogoVariant, { title: string; tagline: string }> = {
  dark: { title: "text-brown-900", tagline: "text-brown-500" },
  light: { title: "text-background", tagline: "text-background/80" },
};

export function Logo({
  size = "md",
  variant = "dark",
  showTagline = true,
  className,
  as = "link",
}: LogoProps) {
  const styles = sizeStyles[size];
  const colors = variantStyles[variant];

  const content = (
    <span className={cn("flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-display tracking-tight lowercase",
          styles.title,
          colors.title,
        )}
      >
        Fermento focacceria
      </span>
      {showTagline && (
        <span
          className={cn(
            "font-body font-light italic tracking-wide mt-1",
            styles.tagline,
            colors.tagline,
          )}
        >
          Fresh from the oven
        </span>
      )}
    </span>
  );

  if (as === "link") {
    return (
      <Link href="/" aria-label="Fermento Focacceria, ir al inicio">
        {content}
      </Link>
    );
  }
  return content;
}
