"use client";

import Image from "next/image";
import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GalleryImage } from "@/lib/types";

export function GalleryCarousel({ images }: { images: GalleryImage[] }) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 5000, stopOnInteraction: true })],
  );
  const [active, setActive] = useState<GalleryImage | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 md:gap-4">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(image)}
              className="relative aspect-[4/5] min-w-[72%] shrink-0 overflow-hidden rounded-3xl bg-secondary md:min-w-[320px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              aria-label={image.caption ?? "Ver foto del horno"}
            >
              <Image
                src={image.imageUrl}
                alt={image.caption ?? "Foto del horno de Fermento Focacceria"}
                fill
                sizes="(max-width: 768px) 72vw, 320px"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
              {image.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brown-900/60 to-transparent px-4 py-3 text-left text-sm text-background">
                  {image.caption}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{active?.caption ?? "Foto"}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-brown-900 md:aspect-[3/2]">
              <Image
                src={active.imageUrl}
                alt={active.caption ?? "Foto del horno"}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
