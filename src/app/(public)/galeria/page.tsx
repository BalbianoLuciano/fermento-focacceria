import { GalleryGrid } from "@/components/public/GalleryGrid";
import { listGalleryImages } from "@/lib/firebase/gallery";
import type { GalleryImage } from "@/lib/types";

export const revalidate = 60;

export const metadata = {
  title: "Galería",
  description: "Fotos del horno y de las focaccias recién horneadas.",
};

async function fetchImages(): Promise<GalleryImage[]> {
  try {
    return await listGalleryImages();
  } catch (error) {
    console.error("[galeria] failed to fetch gallery:", error);
    return [];
  }
}

export default async function GaleriaPage() {
  const images = await fetchImages();

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 pb-20 pt-12 md:px-8 md:pt-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-brown-500 backdrop-blur">
          De nuestro horno
        </span>
        <h1 className="font-display text-4xl text-brown-900 md:text-5xl">
          Cada hornada, un mundo
        </h1>
        <p className="max-w-lg text-base text-brown-500">
          Fotos reales, sin filtros, recién sacadas del horno. Tocá cualquiera
          para verla en grande.
        </p>
      </header>

      <GalleryGrid images={images} />
    </section>
  );
}
