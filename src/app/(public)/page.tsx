import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-16 text-center md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_center_top,var(--secondary)_0%,transparent_70%)]" />

      <span className="mb-6 inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium tracking-wider text-brown-500 uppercase backdrop-blur">
        Masa madre · Fermentación 24 h
      </span>

      <h1 className="font-display text-5xl leading-[1.05] text-brown-900 md:text-7xl lg:text-8xl">
        Recién horneadas,
        <br />
        hechas con amor
      </h1>

      <p className="mt-6 max-w-xl text-base text-brown-500 md:text-lg">
        Focaccias artesanales a pedido, en Corrientes. Pocas variedades, muchas
        horas de fermento, una sola persona detrás del horno.
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="#menu"
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-12 rounded-full px-8 text-base gap-2",
          )}
        >
          Ver el menú
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/pedido"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 rounded-full border-brown-300 px-8 text-base text-brown-700 hover:bg-muted",
          )}
        >
          Armar pedido
        </Link>
      </div>

      <p className="mt-14 max-w-md text-sm text-brown-500/80">
        &ldquo;Tu próxima obsesión&rdquo; — hecha por Anna, una a una,
        fresquitas todos los días.
      </p>
    </section>
  );
}
