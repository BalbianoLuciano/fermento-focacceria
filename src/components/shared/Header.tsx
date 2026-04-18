import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 md:px-8 md:py-4">
        <Logo size="sm" showTagline={false} />
        <Link
          href="/pedido"
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-11 rounded-full px-5 text-sm",
          )}
        >
          Pedí ahora
        </Link>
      </div>
    </header>
  );
}
