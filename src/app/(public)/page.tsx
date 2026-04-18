import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GalleryCarousel } from "@/components/public/GalleryCarousel";
import { ProductCard } from "@/components/public/ProductCard";
import { ReviewsCarousel } from "@/components/public/ReviewsCarousel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listGalleryImages } from "@/lib/firebase/gallery";
import { listProducts } from "@/lib/firebase/products";
import { listReviews } from "@/lib/firebase/reviews";
import { getSettings } from "@/lib/firebase/settings";
import type { GalleryImage, Product, Review, Settings } from "@/lib/types";

// ISR: regenerate at most every 60 seconds so admin edits surface within a
// minute without waiting for a full rebuild.
export const revalidate = 60;

const DEFAULT_HERO = "Recién horneadas, hechas con amor";
const DEFAULT_TAGLINE = "Fresh from the oven";

interface LandingData {
  products: Product[];
  reviews: Review[];
  gallery: GalleryImage[];
  settings: Settings | null;
}

function toPlain<T>(value: T): T {
  // Firestore Timestamps carry a toJSON method that React 19 refuses to pass
  // from a Server Component to a Client Component. JSON round-trip strips the
  // prototype so what lands on the client is a plain object.
  return JSON.parse(JSON.stringify(value)) as T;
}

async function fetchData(): Promise<LandingData> {
  try {
    const [products, reviews, gallery, settings] = await Promise.all([
      listProducts({ activeOnly: true }),
      listReviews({ activeOnly: true }),
      listGalleryImages(),
      getSettings(),
    ]);
    return {
      products: toPlain(products),
      reviews: toPlain(reviews),
      gallery: toPlain(gallery),
      settings: settings ? toPlain(settings) : null,
    };
  } catch (error) {
    console.error("[landing] failed to fetch data:", error);
    return { products: [], reviews: [], gallery: [], settings: null };
  }
}

export default async function HomePage() {
  const { products, reviews, gallery, settings } = await fetchData();
  const heroMessage = settings?.heroMessage?.trim() || DEFAULT_HERO;
  const tagline = settings?.tagline?.trim() || DEFAULT_TAGLINE;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/hero-banner.jpg"
            alt="Alveolos de focaccia recién horneada — masa madre con 24 horas de fermento"
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/65 to-secondary/70" />
        </div>

        <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-4xl flex-col items-center justify-center gap-6 px-5 py-20 text-center md:px-8 md:py-28">
          <span className="inline-flex items-center rounded-full border border-border bg-card/90 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-brown-500 backdrop-blur">
            Masa madre · Fermentación 24 h
          </span>

          <h1 className="font-display text-5xl leading-[1.02] text-brown-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] md:text-7xl lg:text-8xl xl:text-9xl">
            {heroMessage}
          </h1>

          <p className="max-w-xl text-base text-brown-700 md:text-lg">
            Focaccias artesanales a pedido, en Corrientes. Pocas variedades,
            muchas horas de fermento, una sola persona detrás del horno.
          </p>

          <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row">
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
                "h-12 rounded-full border-brown-300 bg-card/70 px-8 text-base text-brown-700 backdrop-blur hover:bg-muted",
              )}
            >
              Armar pedido
            </Link>
          </div>

          <p className="mt-8 max-w-md font-body text-sm italic text-brown-500">
            {tagline}
          </p>
        </div>
      </section>

      <section
        id="menu"
        className="relative scroll-mt-20 overflow-hidden bg-secondary/40 py-16 md:py-24"
      >
        <Image
          src="/arrow-right-focaccia.png"
          alt=""
          width={400}
          height={400}
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 top-32 hidden w-64 rotate-[8deg] select-none opacity-90 lg:block xl:-right-6 xl:top-40 xl:w-80"
        />

        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 md:px-8">
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
            <div className="flex flex-col gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Link
            href="/pedido"
            className="group relative grid grid-cols-[130px_1fr] items-stretch overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[220px_1fr] md:grid-cols-[320px_1fr]"
          >
            <div className="relative h-full overflow-hidden bg-secondary">
              <Image
                src="/xl-card.jpg"
                alt="Focaccia XL para compartir"
                fill
                sizes="(max-width: 640px) 130px, (max-width: 768px) 220px, 320px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center gap-2 p-4 md:p-8">
              <span className="inline-flex w-fit items-center rounded-full border border-border bg-background px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-brown-500">
                También XL
              </span>
              <h3 className="font-display text-2xl leading-tight text-brown-900 md:text-3xl">
                Para compartir
              </h3>
              <p className="text-xs text-brown-500 md:text-sm">
                Una sola focaccia, masa generosa, todos alrededor de la mesa.
                Pedila por WhatsApp y coordinamos.
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brown-900">
                Pedir XL
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="relative h-[40svh] min-h-[280px] overflow-hidden md:h-[60svh]">
        <Image
          src="/mid-banner.jpg"
          alt="Masa con fermentación de 24 horas"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brown-900/40 via-brown-900/10 to-brown-900/50" />
        <div className="relative flex h-full w-full items-center justify-center px-5 text-center">
          <p className="font-display text-4xl leading-tight text-background drop-shadow-[0_2px_10px_rgba(44,24,16,0.45)] md:text-6xl lg:text-7xl">
            Masa madre · 24 horas de paciencia
          </p>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 md:px-8">
            <header className="flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-2">
                <span className="inline-flex w-fit items-center rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-brown-500 backdrop-blur">
                  De nuestro horno
                </span>
                <h2 className="font-display text-4xl text-brown-900 md:text-5xl">
                  Cada hornada, un mundo
                </h2>
              </div>
              <Link
                href="/galeria"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brown-700 hover:text-brown-900"
              >
                Ver toda la galería
                <ArrowRight className="h-4 w-4" />
              </Link>
            </header>
            <GalleryCarousel images={gallery} />
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="bg-secondary/40 py-16 md:py-24">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 md:px-8">
            <header className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-brown-500 backdrop-blur">
                Lo que dicen
              </span>
              <h2 className="font-display text-4xl text-brown-900 md:text-5xl">
                Gente que ya se obsesionó
              </h2>
            </header>
            <ReviewsCarousel reviews={reviews} />
          </div>
        </section>
      )}
    </>
  );
}
