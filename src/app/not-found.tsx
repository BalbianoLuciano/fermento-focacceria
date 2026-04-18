import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70svh] w-full max-w-xl flex-col items-center justify-center gap-6 px-5 py-16 text-center md:px-8">
      <p className="font-display text-6xl text-brown-300 md:text-7xl">404</p>
      <h1 className="font-display text-3xl leading-tight text-brown-900 md:text-4xl">
        Esta página no existe
      </h1>
      <p className="max-w-sm text-base text-brown-500">
        Quizás se fue al horno. Probá volver al inicio.
      </p>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "default" }),
          "h-12 rounded-full px-8 text-base",
        )}
      >
        Volver al inicio
      </Link>
    </section>
  );
}
