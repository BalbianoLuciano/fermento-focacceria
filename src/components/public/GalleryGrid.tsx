"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GalleryImage } from "@/lib/types";

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<GalleryImage | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-card/60 px-8 py-16 text-center">
        <p className="font-display text-3xl text-brown-700">
          Pronto vamos a tener más fotos del horno
        </p>
        <p className="text-sm text-brown-500">
          Mientras tanto, seguinos en Instagram 📸
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 gap-3 md:columns-3 md:gap-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActive(image)}
            className="mb-3 block w-full overflow-hidden rounded-2xl bg-secondary md:mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            aria-label={image.caption ?? "Ver foto"}
            style={{ breakInside: "avoid" }}
          >
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={image.imageUrl}
                alt={image.caption ?? "Foto de Fermento Focacceria"}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
                priority={index < 3}
              />
            </div>
          </button>
        ))}
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
