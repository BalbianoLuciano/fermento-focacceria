import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "dark" | "light";

interface LogoProps {
  size?: LogoSize;
  /** Tagline color on the text line; image colors are baked into the SVG. */
  variant?: LogoVariant;
  showTagline?: boolean;
  className?: string;
  as?: "link" | "div";
}

const sizeStyles: Record<
  LogoSize,
  { pixels: number; gap: string; tagline: string }
> = {
  sm: { pixels: 44, gap: "gap-0", tagline: "text-[10px]" },
  md: { pixels: 88, gap: "gap-1", tagline: "text-xs" },
  lg: { pixels: 144, gap: "gap-2", tagline: "text-sm" },
};

const taglineColor: Record<LogoVariant, string> = {
  dark: "text-brown-500",
  light: "text-background/80",
};

export function Logo({
  size = "md",
  variant = "dark",
  showTagline = true,
  className,
  as = "link",
}: LogoProps) {
  const styles = sizeStyles[size];

  const content = (
    <span
      className={cn(
        "flex flex-col items-start leading-none",
        styles.gap,
        className,
      )}
    >
      <Image
        src="/logo.svg"
        alt="Fermento Focacceria"
        width={styles.pixels}
        height={styles.pixels}
        priority={size !== "sm"}
        unoptimized
        className="shrink-0"
      />
      {showTagline && (
        <span
          className={cn(
            "font-body font-light italic tracking-wide",
            styles.tagline,
            taglineColor[variant],
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
