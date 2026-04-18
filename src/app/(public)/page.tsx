import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/public/ProductCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listProducts } from "@/lib/firebase/products";
import { getSettings } from "@/lib/firebase/settings";
import type { Product, Settings } from "@/lib/types";

// ISR: regenerate at most every 60 seconds so admin edits surface within a
// minute without waiting for a full rebuild.
export const revalidate = 60;

const DEFAULT_HERO = "Recién horneadas, hechas con amor";
const DEFAULT_TAGLINE = "Fresh from the oven";

async function fetchData(): Promise<{
  products: Product[];
  settings: Settings | null;
}> {
  try {
    const [products, settings] = await Promise.all([
      listProducts({ activeOnly: true }),
      getSettings(),
    ]);
    return { products, settings };
  } catch (error) {
    console.error("[landing] failed to fetch menu data:", error);
    return { products: [], settings: null };
  }
}

export default async function HomePage() {
  const { products, settings } = await fetchData();
  const heroMessage = settings?.heroMessage?.trim() || DEFAULT_HERO;
  const tagline = settings?.tagline?.trim() || DEFAULT_TAGLINE;

  return (
    <>
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-16 text-center md:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_center_top,var(--secondary)_0%,transparent_70%)]" />

        <span className="mb-6 inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-brown-500 backdrop-blur">
          Masa madre · Fermentación 24 h
        </span>

        <h1 className="font-display text-5xl leading-[1.05] text-brown-900 md:text-7xl lg:text-8xl">
          {heroMessage}
        </h1>

        <p className="mt-6 max-w-xl text-base text-brown-500 md:text-lg">
          Focaccias artesanales a pedido, en Corrientes. Pocas variedades,
          muchas horas de fermento, una sola persona detrás del horno.
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

        <p className="mt-14 max-w-md font-body text-sm italic text-brown-500/80">
          {tagline}
        </p>
      </section>

      <section id="menu" className="scroll-mt-20 bg-secondary/40 py-16 md:py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-5 md:px-8">
          <header className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-brown-500 backdrop-blur">
              Nuestros sabores
            </span>
            <h2 className="font-display text-4xl text-brown-900 md:text-5xl">
              Pocas, pero obsesivas
            </h2>
            <p className="max-w-lg text-base text-brown-500">
              Masa madre, fermentación lenta, horneada a pedido. Elegí tamaño y
              sumalas al pedido — la entrega la coordinamos por WhatsApp.
            </p>
          </header>

          {products.length === 0 ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 px-8 py-16 text-center">
              <p className="font-display text-3xl text-brown-700">
                Pronto vamos a tener nuevos sabores
              </p>
              <p className="text-sm text-brown-500">
                Volvé en un ratito o escribinos por WhatsApp 🍞
              </p>
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
